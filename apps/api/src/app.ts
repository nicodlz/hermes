import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { tasksRouter } from "./routes/tasks.js";
import { templatesRouter } from "./routes/templates.js";
import { sourcesRouter } from "./routes/sources.js";
import { statsRouter } from "./routes/stats.js";
import { aiRouter } from "./routes/ai.js";
import { requireAuth, type AuthContext } from "./middleware/auth.js";

export const app = new Hono<AuthContext>()
  // Global middlewares
  .use("*", logger())
  .use(
    "/api/*",
    cors({
      origin: ["http://localhost:5173", "https://hermes.ndlz.net"],
      credentials: true,
    })
  )

  // Health check
  .get("/health", (c) => c.json({ status: "healthy" }))

  // Auth routes (public + protected)
  .route("/api/auth", authRouter)

  // Protected API routes (require authentication)
  .use("/api/leads/*", requireAuth)
  .use("/api/tasks/*", requireAuth)
  .use("/api/templates/*", requireAuth)
  .use("/api/sources/*", requireAuth)
  .use("/api/stats/*", requireAuth)
  .use("/api/ai/*", requireAuth)
  .route("/api/leads", leadsRouter)
  .route("/api/tasks", tasksRouter)
  .route("/api/templates", templatesRouter)
  .route("/api/sources", sourcesRouter)
  .route("/api/stats", statsRouter)
  .route("/api/ai", aiRouter)

  // Serve static files in production
  .use("/*", serveStatic({ root: "../web/dist" }))
  .get("/*", serveStatic({ root: "../web/dist", path: "index.html" }));

export type AppType = typeof app;
