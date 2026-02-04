/**
 * Lead Management API Routes
 *
 * Provides CRUD operations for leads including:
 * - Listing with filters (status, score, source, search)
 * - Bulk creation for scrapers
 * - Status updates with automatic timestamp tracking
 * - Notes management
 * - Pipeline statistics
 * 
 * All queries are filtered by the user's organization.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, LeadStatus } from "@hermes/db";
import type { AuthContext } from "../middleware/auth.js";
import { findEmailWithHunter, extractDomain, parseName, extractLinkedInUsername } from "../lib/enrichment.js";

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

export const leadsRouter = new Hono<AuthContext>()
  // List leads with filters
  .get("/", zValidator("query", querySchema), async (c) => {
    const orgId = c.get("orgId");
    const { status, minScore, source, search, limit, offset } = c.req.valid("query");

    const where = {
      orgId, // Filter by organization
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
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const lead = await db.lead.findFirst({
      where: { id, orgId }, // Filter by organization
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
    const orgId = c.get("orgId");
    const data = c.req.valid("json");

    // Check if lead already exists in this organization
    const existing = await db.lead.findFirst({
      where: { sourceUrl: data.sourceUrl, orgId },
    });

    if (existing) {
      return c.json({ error: "Lead already exists", lead: existing }, 409);
    }

    const lead = await db.lead.create({ data: { ...data, orgId } });
    return c.json(lead, 201);
  })

  // Bulk create leads (for scraping)
  .post("/bulk", zValidator("json", z.array(createLeadSchema)), async (c) => {
    const orgId = c.get("orgId");
    const leads = c.req.valid("json");
    
    const results = await Promise.allSettled(
      leads.map(async (lead) => {
        const existing = await db.lead.findFirst({
          where: { sourceUrl: lead.sourceUrl, orgId },
        });
        if (existing) return { status: "exists", lead: existing };
        
        const created = await db.lead.create({ data: { ...lead, orgId } });
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
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const data = c.req.valid("json");

    // Verify lead belongs to organization
    const existing = await db.lead.findFirst({ where: { id, orgId } });
    if (!existing) {
      return c.json({ error: "Lead not found" }, 404);
    }

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
    const orgId = c.get("orgId");
    const leadId = c.req.param("id");
    const data = c.req.valid("json");

    // Verify lead belongs to organization
    const lead = await db.lead.findFirst({ where: { id: leadId, orgId } });
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }

    const note = await db.note.create({
      data: { ...data, leadId },
    });

    return c.json(note, 201);
  })

  // Delete lead
  .delete("/:id", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    
    // Verify lead belongs to organization
    const lead = await db.lead.findFirst({ where: { id, orgId } });
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    await db.lead.delete({ where: { id } });
    return c.json({ success: true });
  })

  // Pipeline stats
  .get("/stats/pipeline", async (c) => {
    const orgId = c.get("orgId");
    const pipeline = await db.lead.groupBy({
      by: ["status"],
      where: { orgId },
      _count: true,
    });

    const stats = Object.fromEntries(
      pipeline.map((p) => [p.status, p._count])
    );

    return c.json(stats);
  })

  // Enrich lead - find email automatically
  .post("/:id/enrich", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    
    // Verify lead belongs to organization
    const lead = await db.lead.findFirst({ 
      where: { id, orgId },
      include: { enrichments: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
    
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }

    // Check if already enriched recently (within last 24h)
    const lastEnrichment = lead.enrichments[0];
    if (lastEnrichment && lastEnrichment.status === "success") {
      const hoursSinceEnrichment = (Date.now() - new Date(lastEnrichment.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceEnrichment < 24) {
        return c.json({ 
          error: "Lead was already enriched in the last 24 hours",
          email: lead.email,
          source: lead.emailSource,
          enrichedAt: lead.emailEnrichedAt
        }, 429);
      }
    }

    try {
      // Extract information
      let domain = lead.company ? extractDomain(lead.company) : null;
      if (!domain && lead.website) {
        domain = extractDomain(lead.website);
      }
      if (!domain && lead.authorUrl) {
        // Try to extract domain from author URL
        const urlDomain = new URL(lead.authorUrl).hostname.replace("www.", "");
        if (!urlDomain.includes("reddit.com") && !urlDomain.includes("twitter.com")) {
          domain = urlDomain;
        }
      }

      if (!domain) {
        await db.enrichmentLog.create({
          data: {
            leadId: id,
            provider: "hunter.io",
            status: "error",
            result: JSON.stringify({ error: "No domain available" }),
          },
        });
        return c.json({ error: "Cannot enrich: no company domain available" }, 400);
      }

      // Parse author name if available
      let firstName = "";
      let lastName = "";
      if (lead.author) {
        const parsed = parseName(lead.author);
        firstName = parsed.firstName;
        lastName = parsed.lastName;
      }

      if (!firstName && !lastName) {
        await db.enrichmentLog.create({
          data: {
            leadId: id,
            provider: "hunter.io",
            status: "error",
            result: JSON.stringify({ error: "No name available" }),
          },
        });
        return c.json({ error: "Cannot enrich: no author name available" }, 400);
      }

      // Call Hunter.io
      const result = await findEmailWithHunter({
        domain,
        firstName,
        lastName,
      });

      // Log the attempt
      await db.enrichmentLog.create({
        data: {
          leadId: id,
          provider: "hunter.io",
          status: result.email ? "success" : "not_found",
          emailFound: result.email,
          confidence: result.confidence,
          result: JSON.stringify(result.raw || {}),
        },
      });

      // Update lead if email found
      if (result.email) {
        await db.lead.update({
          where: { id },
          data: {
            email: result.email,
            emailSource: "hunter.io",
            emailEnrichedAt: new Date(),
          },
        });

        return c.json({
          success: true,
          email: result.email,
          confidence: result.confidence,
          source: result.source,
        });
      }

      return c.json({
        success: false,
        message: "No email found",
        source: result.source,
      }, 404);

    } catch (error: any) {
      // Log error
      await db.enrichmentLog.create({
        data: {
          leadId: id,
          provider: "hunter.io",
          status: "error",
          result: JSON.stringify({ error: error.message }),
        },
      });

      // Check if it's a rate limit error
      if (error.message?.includes("rate") || error.message?.includes("limit")) {
        return c.json({ error: "Rate limit exceeded. Try again later." }, 429);
      }

      return c.json({ error: error.message || "Enrichment failed" }, 500);
    }
  });
