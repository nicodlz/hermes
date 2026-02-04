import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { serveStatic } from "@hono/node-server/serve-static";
import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { tasksRouter } from "./routes/tasks.js";
import { templatesRouter } from "./routes/templates.js";
import { sourcesRouter } from "./routes/sources.js";
import { statsRouter } from "./routes/stats.js";
import { aiRouter } from "./routes/ai.js";
import { adminRouter } from "./routes/admin.js";
import { outreach } from "./routes/outreach.js";
import { requireAuth, type AuthContext } from "./middleware/auth.js";

const VERSION = process.env.npm_package_version || "0.1.0";
const COMMIT = process.env.COMMIT_SHA || "unknown";

export const app = new Hono<AuthContext>()
  // Global error handler
  .onError((err, c) => {
    console.error(`[Error] ${err.message}`, err.stack);
    
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status);
    }
    
    // Don't expose internal errors in production
    const message = process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message;
    
    return c.json({ error: message }, 500);
  })

  // Global middlewares
  .use("*", logger())
  .use(
    "/api/*",
    cors({
      origin: ["http://localhost:5173", "https://hermes.ndlz.net"],
      credentials: true,
    })
  )

  // Health check with version
  .get("/health", (c) => c.json({ 
    status: "healthy",
    version: VERSION,
    commit: COMMIT,
    timestamp: new Date().toISOString(),
  }))

  // Auth routes (public + protected)
  .route("/api/auth", authRouter)

  // Admin routes (protected by ADMIN_SECRET)
  .route("/api/admin", adminRouter)

  // Protected API routes (require authentication)
  .use("/api/leads/*", requireAuth)
  .use("/api/tasks/*", requireAuth)
  .use("/api/templates/*", requireAuth)
  .use("/api/sources/*", requireAuth)
  .use("/api/stats/*", requireAuth)
  .use("/api/ai/*", requireAuth)
  .use("/api/outreach/*", requireAuth)
  .route("/api/leads", leadsRouter)
  .route("/api/tasks", tasksRouter)
  .route("/api/templates", templatesRouter)
  .route("/api/sources", sourcesRouter)
  .route("/api/stats", statsRouter)
  .route("/api/ai", aiRouter)
  .route("/api/outreach", outreach)

  // Serve static files in production
  .use("/*", serveStatic({ root: "../web/dist" }))
  .get("/*", serveStatic({ root: "../web/dist", path: "index.html" }));

export type AppType = typeof app;
