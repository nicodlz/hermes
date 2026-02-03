import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, LeadStatus } from "@hermes/db";

const createLeadSchema = z.object({
  source: z.string(),
  sourceUrl: z.string().url(),
  sourceId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  authorUrl: z.string().optional(),
  score: z.number().default(0),
  scoreReasons: z.string().optional(),
  tags: z.string().optional(),
});

const updateLeadSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  score: z.number().optional(),
  scoreReasons: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  currency: z.string().optional(),
  deadline: z.string().datetime().optional(),
  tags: z.string().optional(),
});

const querySchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  minScore: z.coerce.number().optional(),
  source: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
});

export const leadsRouter = new Hono()
  // List leads with filters
  .get("/", zValidator("query", querySchema), async (c) => {
    const { status, minScore, source, search, limit, offset } = c.req.valid("query");

    const where = {
      ...(status && { status }),
      ...(minScore && { score: { gte: minScore } }),
      ...(source && { source }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { author: { contains: search } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: [{ score: "desc" }, { scrapedAt: "desc" }],
        take: limit,
        skip: offset,
        include: {
          _count: { select: { notes: true, tasks: true, messages: true } },
        },
      }),
      db.lead.count({ where }),
    ]);

    return c.json({ leads, total, limit, offset });
  })

  // Get single lead with all relations
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { dueAt: "asc" } },
        messages: { orderBy: { createdAt: "desc" } },
        proposals: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }

    return c.json(lead);
  })

  // Create lead
  .post("/", zValidator("json", createLeadSchema), async (c) => {
    const data = c.req.valid("json");

    // Check if lead already exists
    const existing = await db.lead.findUnique({
      where: { sourceUrl: data.sourceUrl },
    });

    if (existing) {
      return c.json({ error: "Lead already exists", lead: existing }, 409);
    }

    const lead = await db.lead.create({ data });
    return c.json(lead, 201);
  })

  // Bulk create leads (for scraping)
  .post("/bulk", zValidator("json", z.array(createLeadSchema)), async (c) => {
    const leads = c.req.valid("json");
    
    const results = await Promise.allSettled(
      leads.map(async (lead) => {
        const existing = await db.lead.findUnique({
          where: { sourceUrl: lead.sourceUrl },
        });
        if (existing) return { status: "exists", lead: existing };
        
        const created = await db.lead.create({ data: lead });
        return { status: "created", lead: created };
      })
    );

    const created = results.filter(
      (r) => r.status === "fulfilled" && r.value.status === "created"
    ).length;
    const exists = results.filter(
      (r) => r.status === "fulfilled" && r.value.status === "exists"
    ).length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return c.json({ created, exists, failed, total: leads.length });
  })

  // Update lead
  .patch("/:id", zValidator("json", updateLeadSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    // Auto-set timestamps based on status changes
    const updates: Record<string, unknown> = { ...data };
    if (data.status === "QUALIFIED" && !updates.qualifiedAt) {
      updates.qualifiedAt = new Date();
    } else if (data.status === "CONTACTED" && !updates.contactedAt) {
      updates.contactedAt = new Date();
    } else if (data.status === "RESPONDED" && !updates.respondedAt) {
      updates.respondedAt = new Date();
    } else if (data.status === "CALL_SCHEDULED" && !updates.callAt) {
      updates.callAt = new Date();
    } else if (data.status === "PROPOSAL_SENT" && !updates.proposalAt) {
      updates.proposalAt = new Date();
    } else if ((data.status === "WON" || data.status === "LOST") && !updates.closedAt) {
      updates.closedAt = new Date();
    }

    const lead = await db.lead.update({
      where: { id },
      data: updates,
    });

    return c.json(lead);
  })

  // Add note to lead
  .post("/:id/notes", zValidator("json", z.object({
    content: z.string(),
    type: z.enum(["MANUAL", "AI_ANALYSIS", "AI_RESEARCH", "SYSTEM"]).default("MANUAL"),
    aiModel: z.string().optional(),
  })), async (c) => {
    const leadId = c.req.param("id");
    const data = c.req.valid("json");

    const note = await db.note.create({
      data: { ...data, leadId },
    });

    return c.json(note, 201);
  })

  // Delete lead
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.lead.delete({ where: { id } });
    return c.json({ success: true });
  })

  // Pipeline stats
  .get("/stats/pipeline", async (c) => {
    const pipeline = await db.lead.groupBy({
      by: ["status"],
      _count: true,
    });

    const stats = Object.fromEntries(
      pipeline.map((p) => [p.status, p._count])
    );

    return c.json(stats);
  });
