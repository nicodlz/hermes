/**
 * Authentication API Routes
 * 
 * Handles:
 * - User registration and login
 * - Session management (logout)
 * - API key management (create, list, revoke)
 * - Current user info
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "@hermes/db";
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

const BCRYPT_ROUNDS = 12;

// Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  orgName: z.string().min(1, "Organization name is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
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
   * Register a new user and organization
   */
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { email, password, name, orgName } = c.req.valid("json");

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: "Email already registered" }, 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create organization and user in a transaction
    const result = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          orgId: org.id,
        },
      });

      return { user, org };
    });

    // Create session
    const sessionId = await createSession(result.user.id);
    setSessionCookie(c, sessionId);

    return c.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        orgId: result.org.id,
        orgName: result.org.name,
      },
    }, 201);
  })

  /**
   * Login with email and password
   */
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Create session
    const sessionId = await createSession(user.id);
    setSessionCookie(c, sessionId);

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
