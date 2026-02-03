import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, TemplateType, MessageChannel } from "@hermes/db";

const createTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.nativeEnum(TemplateType),
  channel: z.nativeEnum(MessageChannel).optional(),
  subject: z.string().optional(),
  content: z.string(),
  variables: z.string().optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

export const templatesRouter = new Hono()
  // List templates
  .get("/", async (c) => {
    const type = c.req.query("type") as TemplateType | undefined;
    const channel = c.req.query("channel") as MessageChannel | undefined;
    const active = c.req.query("active");

    const templates = await db.template.findMany({
      where: {
        ...(type && { type }),
        ...(channel && { channel }),
        ...(active !== undefined && { isActive: active === "true" }),
      },
      orderBy: { name: "asc" },
    });

    return c.json(templates);
  })

  // Get template by ID
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const template = await db.template.findUnique({ where: { id } });

    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }

    return c.json(template);
  })

  // Create template
  .post("/", zValidator("json", createTemplateSchema), async (c) => {
    const data = c.req.valid("json");
    const template = await db.template.create({ data });
    return c.json(template, 201);
  })

  // Update template
  .patch("/:id", zValidator("json", updateTemplateSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const template = await db.template.update({ where: { id }, data });
    return c.json(template);
  })

  // Render template with variables
  .post("/:id/render", zValidator("json", z.record(z.string())), async (c) => {
    const id = c.req.param("id");
    const variables = c.req.valid("json");

    const template = await db.template.findUnique({ where: { id } });
    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }

    let rendered = template.content;
    let renderedSubject = template.subject || "";

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      rendered = rendered.replace(regex, value);
      renderedSubject = renderedSubject.replace(regex, value);
    }

    // Increment usage count
    await db.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return c.json({
      subject: renderedSubject,
      content: rendered,
      template: { id: template.id, name: template.name },
    });
  })

  // Delete template
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.template.delete({ where: { id } });
    return c.json({ success: true });
  });
