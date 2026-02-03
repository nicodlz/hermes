import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 3001;

console.log(`🚀 Hermes API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
