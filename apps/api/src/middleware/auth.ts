/**
 * Authentication Middleware
 * 
 * Supports two auth methods:
 * 1. Session-based auth (cookies) for web UI
 * 2. API key auth (X-API-Key header) for agent/API access
 */

import { createMiddleware } from "hono/factory";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { db } from "@hermes/db";
import crypto from "crypto";

// Context variables for authenticated requests
export type AuthContext = {
  Variables: {
    userId: string;
    orgId: string;
    sessionId?: string;
    apiKeyId?: string;
  };
};

// Session configuration
const SESSION_COOKIE = "hermes_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Hash an API key with SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a secure random API key
 * Format: hms_<40 random hex chars>
 */
export function generateApiKey(): string {
  const randomPart = crypto.randomBytes(20).toString("hex");
  return `hms_${randomPart}`;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string> {
  const session = await db.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE),
    },
  });
  return session.id;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.session.delete({ where: { id: sessionId } }).catch(() => {});
}

/**
 * Validate session and return user if valid
 */
async function validateSession(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }

  return { session, user: session.user };
}

/**
 * Validate API key and return user if valid
 */
async function validateApiKey(key: string) {
  const keyHash = hashApiKey(key);
  
  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update last used timestamp (fire and forget)
  db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { apiKey, user: apiKey.user };
}

/**
 * Auth middleware - checks both session cookie and API key header
 * Returns 401 if neither is valid
 */
export const requireAuth = createMiddleware<AuthContext>(async (c, next) => {
  // First, try API key (for programmatic access)
  const apiKeyHeader = c.req.header("X-API-Key");
  if (apiKeyHeader) {
    const result = await validateApiKey(apiKeyHeader);
    if (result) {
      c.set("userId", result.user.id);
      c.set("orgId", result.user.orgId);
      c.set("apiKeyId", result.apiKey.id);
      return next();
    }
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  // Second, try session cookie (for web UI)
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) {
    const result = await validateSession(sessionId);
    if (result) {
      c.set("userId", result.user.id);
      c.set("orgId", result.user.orgId);
      c.set("sessionId", result.session.id);
      return next();
    }
    // Clear invalid session cookie
    deleteCookie(c, SESSION_COOKIE);
  }

  throw new HTTPException(401, { message: "Authentication required" });
});

/**
 * Optional auth middleware - sets user context if authenticated, but doesn't require it
 */
export const optionalAuth = createMiddleware<AuthContext>(async (c, next) => {
  // Try API key
  const apiKeyHeader = c.req.header("X-API-Key");
  if (apiKeyHeader) {
    const result = await validateApiKey(apiKeyHeader);
    if (result) {
      c.set("userId", result.user.id);
      c.set("orgId", result.user.orgId);
      c.set("apiKeyId", result.apiKey.id);
    }
    return next();
  }

  // Try session cookie
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) {
    const result = await validateSession(sessionId);
    if (result) {
      c.set("userId", result.user.id);
      c.set("orgId", result.user.orgId);
      c.set("sessionId", result.session.id);
    }
  }

  return next();
});

/**
 * Set session cookie after login
 */
export function setSessionCookie(c: { header: (name: string, value: string) => void }, sessionId: string) {
  const expires = new Date(Date.now() + SESSION_MAX_AGE);
  const cookie = `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}`;
  c.header("Set-Cookie", cookie);
}

/**
 * Clear session cookie on logout
 */
export function clearSessionCookie(c: { header: (name: string, value: string) => void }) {
  c.header("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
