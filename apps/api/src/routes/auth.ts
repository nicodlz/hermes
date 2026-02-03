/**
 * Authentication API Routes
 * 
 * Handles:
 * - Magic link authentication (request link, verify token)
 * - Session management (logout)
 * - API key management (create, list, revoke)
 * - Current user info
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@hermes/db";
import { sendMagicLinkEmail } from "../lib/email.js";
import {
  AuthContext,
  requireAuth,
  createSession,
  deleteSession,
  setSessionCookie,
  clearSessionCookie,
  generateApiKey,
  hashApiKey,
} from "../middleware/auth.js";

const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a secure random token for magic links
 */
function generateMagicToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Schemas
const requestMagicLinkSchema = z.object({
  email: z.string().email(),
  // For new user registration
  name: z.string().optional(),
  orgName: z.string().optional(),
});

const verifyMagicLinkSchema = z.object({
  token: z.string().min(1),
});

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  expiresAt: z.string().datetime().optional(),
});

// Router
export const authRouter = new Hono<AuthContext>()
  // ==========================================
  // PUBLIC ROUTES
  // ==========================================

  /**
   * Request a magic link
   * - If user exists: sends login link
   * - If user doesn't exist + orgName provided: sends signup link
   * - If user doesn't exist + no orgName: returns error
   */
  .post("/magic-link", zValidator("json", requestMagicLinkSchema), async (c) => {
    const { email, name, orgName } = c.req.valid("json");

    // Check if user exists
    const existingUser = await db.user.findUnique({ where: { email } });
    
    if (!existingUser && !orgName) {
      // New user trying to login without registering
      return c.json({ 
        error: "No account found with this email. Please provide an organization name to sign up.",
        needsSignup: true,
      }, 400);
    }

    // Generate magic link token
    const token = generateMagicToken();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

    // Delete any existing unused magic links for this email
    await db.magicLink.deleteMany({
      where: { email, usedAt: null },
    });

    // Create new magic link
    await db.magicLink.create({
      data: {
        token,
        email,
        userId: existingUser?.id,
        orgName: existingUser ? null : orgName,
        userName: existingUser ? null : name,
        expiresAt,
      },
    });

    // Send email
    try {
      await sendMagicLinkEmail({
        to: email,
        token,
        isNewUser: !existingUser,
      });
    } catch (err) {
      console.error("Failed to send magic link email:", err);
      // In development, log the link for testing
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] Magic link for ${email}: /auth/verify?token=${token}`);
      }
      return c.json({ 
        error: "Failed to send email. Please try again.",
        // In dev mode, include the token for testing
        ...(process.env.NODE_ENV === "development" && { devToken: token }),
      }, 500);
    }

    return c.json({ 
      success: true,
      message: `Magic link sent to ${email}`,
    });
  })

  /**
   * Verify magic link token and create session
   */
  .get("/verify", zValidator("query", verifyMagicLinkSchema), async (c) => {
    const { token } = c.req.valid("query");

    // Find the magic link
    const magicLink = await db.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      return c.json({ error: "Invalid or expired link" }, 400);
    }

    if (magicLink.usedAt) {
      return c.json({ error: "This link has already been used" }, 400);
    }

    if (magicLink.expiresAt < new Date()) {
      return c.json({ error: "This link has expired" }, 400);
    }

    let user = magicLink.user;

    // If no user linked, this is a new signup
    if (!user) {
      if (!magicLink.orgName) {
        return c.json({ error: "Invalid signup link" }, 400);
      }

      // Create organization and user
      const result = await db.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: { name: magicLink.orgName! },
        });

        const newUser = await tx.user.create({
          data: {
            email: magicLink.email,
            name: magicLink.userName,
            orgId: org.id,
          },
        });

        return { user: newUser, org };
      });

      user = result.user;
    }

    // Mark magic link as used
    await db.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    // Create session
    const sessionId = await createSession(user.id);
    setSessionCookie(c, sessionId);

    // Get org info for response
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      include: { org: true },
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orgId: userWithOrg!.orgId,
        orgName: userWithOrg!.org.name,
      },
    });
  })

  // ==========================================
  // PROTECTED ROUTES (require authentication)
  // ==========================================

  /**
   * Logout - invalidate current session
   */
  .post("/logout", requireAuth, async (c) => {
    const sessionId = c.get("sessionId");
    if (sessionId) {
      await deleteSession(sessionId);
    }
    clearSessionCookie(c);
    return c.json({ success: true });
  })

  /**
   * Get current user info
   */
  .get("/me", requireAuth, async (c) => {
    const userId = c.get("userId");

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { org: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orgId: user.orgId,
        orgName: user.org.name,
      },
    });
  })

  // ==========================================
  // API KEY MANAGEMENT
  // ==========================================

  /**
   * Create a new API key
   * Returns the key ONCE - it cannot be retrieved again
   */
  .post("/keys", requireAuth, zValidator("json", createApiKeySchema), async (c) => {
    const userId = c.get("userId");
    const { name, expiresAt } = c.req.valid("json");

    // Generate API key
    const key = generateApiKey();
    const keyHash = hashApiKey(key);

    // Store hashed key
    const apiKey = await db.apiKey.create({
      data: {
        name,
        keyHash,
        userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Return the key ONCE (only time it's ever shown)
    return c.json({
      id: apiKey.id,
      name: apiKey.name,
      key, // The actual key - only shown once!
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    }, 201);
  })

  /**
   * List user's API keys (without the actual key values)
   */
  .get("/keys", requireAuth, async (c) => {
    const userId = c.get("userId");

    const apiKeys = await db.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ keys: apiKeys });
  })

  /**
   * Revoke (delete) an API key
   */
  .delete("/keys/:id", requireAuth, async (c) => {
    const userId = c.get("userId");
    const keyId = c.req.param("id");

    // Verify the key belongs to the user
    const apiKey = await db.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      return c.json({ error: "API key not found" }, 404);
    }

    await db.apiKey.delete({ where: { id: keyId } });

    return c.json({ success: true });
  });
