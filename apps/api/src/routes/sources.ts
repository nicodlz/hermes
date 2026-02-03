import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, SourceType } from "@hermes/db";

const createSourceSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(SourceType),
  config: z.string(), // JSON config
  schedule: z.string().optional(), // Cron expression
  isActive: z.boolean().default(true),
});

const updateSourceSchema = createSourceSchema.partial();

export const sourcesRouter = new Hono()
  // List sources
  .get("/", async (c) => {
    const active = c.req.query("active");
    const type = c.req.query("type") as SourceType | undefined;

    const sources = await db.source.findMany({
      where: {
        ...(active !== undefined && { isActive: active === "true" }),
        ...(type && { type }),
      },
      orderBy: { name: "asc" },
    });

    return c.json(sources);
  })

  // Get source by ID
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const source = await db.source.findUnique({ where: { id } });

    if (!source) {
      return c.json({ error: "Source not found" }, 404);
    }

    return c.json(source);
  })

  // Create source
  .post("/", zValidator("json", createSourceSchema), async (c) => {
    const data = c.req.valid("json");
    const source = await db.source.create({ data });
    return c.json(source, 201);
  })

  // Update source
  .patch("/:id", zValidator("json", updateSourceSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const source = await db.source.update({ where: { id }, data });
    return c.json(source);
  })

  // Toggle source active state
  .post("/:id/toggle", async (c) => {
    const id = c.req.param("id");
    const source = await db.source.findUnique({ where: { id } });
    
    if (!source) {
      return c.json({ error: "Source not found" }, 404);
    }

    const updated = await db.source.update({
      where: { id },
      data: { isActive: !source.isActive },
    });

    return c.json(updated);
  })

  // Mark source as run
  .post("/:id/run", zValidator("json", z.object({
    scrapedCount: z.number(),
    error: z.string().optional(),
  })), async (c) => {
    const id = c.req.param("id");
    const { scrapedCount, error } = c.req.valid("json");

    const source = await db.source.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        totalScraped: { increment: scrapedCount },
        lastError: error || null,
      },
    });

    return c.json(source);
  })

  // Delete source
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.source.delete({ where: { id } });
    return c.json({ success: true });
  });
