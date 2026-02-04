/**
 * Admin API Routes
 * 
 * Protected by ADMIN_SECRET environment variable.
 * Used for:
 * - Creating users and organizations directly
 * - Generating API keys for system integrations
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@hermes/db";
import { generateApiKey, hashApiKey } from "../middleware/auth.js";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

/**
 * Middleware to verify admin secret
 */
function requireAdminSecret(c: any, next: () => Promise<void>) {
  const providedSecret = c.req.header("X-Admin-Secret");
  
  if (!ADMIN_SECRET) {
    return c.json({ error: "Admin API not configured" }, 503);
  }
  
  if (!providedSecret || providedSecret !== ADMIN_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  return next();
}

// Schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  orgName: z.string().min(1, "Organization name is required"),
});

const createApiKeySchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().min(1, "Key name is required"),
  expiresAt: z.string().datetime().optional(),
}).refine(data => data.userId || data.email, {
  message: "Either userId or email is required",
});

// Router
export const adminRouter = new Hono()
  // All admin routes require the secret
  .use("/*", requireAdminSecret)

  /**
   * Create a new user and organization
   */
  .post("/users", zValidator("json", createUserSchema), async (c) => {
    const { email, name, orgName } = c.req.valid("json");

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      const org = await db.organization.findUnique({ where: { id: existing.orgId } });
      return c.json({
        message: "User already exists",
        user: {
          id: existing.id,
          email: existing.email,
          name: existing.name,
          orgId: existing.orgId,
          orgName: org?.name,
        },
      }, 200);
    }

    // Create organization and user in transaction
    const result = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName },
      });

      const user = await tx.user.create({
        data: {
          email,
          name,
          orgId: org.id,
        },
      });

      return { user, org };
    });

    return c.json({
      message: "User created successfully",
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
   * Create an API key for a user
   */
  .post("/api-keys", zValidator("json", createApiKeySchema), async (c) => {
    const { userId, email, name, expiresAt } = c.req.valid("json");

    // Find user
    let user;
    if (userId) {
      user = await db.user.findUnique({ where: { id: userId } });
    } else if (email) {
      user = await db.user.findUnique({ where: { email } });
    }

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Generate API key
    const key = generateApiKey();
    const keyHash = hashApiKey(key);

    // Store hashed key
    const apiKey = await db.apiKey.create({
      data: {
        name,
        keyHash,
        userId: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return c.json({
      message: "API key created successfully",
      id: apiKey.id,
      name: apiKey.name,
      key, // The actual key - only shown once!
      userId: user.id,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    }, 201);
  })

  /**
   * List all users (for admin purposes)
   */
  .get("/users", async (c) => {
    const users = await db.user.findMany({
      include: {
        org: true,
        _count: {
          select: { apiKeys: true, sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        orgId: u.orgId,
        orgName: u.org.name,
        apiKeyCount: u._count.apiKeys,
        sessionCount: u._count.sessions,
        createdAt: u.createdAt,
      })),
    });
  })

  /**
   * Get environment status
   */
  .get("/status", async (c) => {
    return c.json({
      adminConfigured: !!ADMIN_SECRET,
      resendConfigured: !!process.env.RESEND_API_KEY,
      appUrl: process.env.APP_URL || "https://hermes.ndlz.net",
      nodeEnv: process.env.NODE_ENV,
    });
  });
