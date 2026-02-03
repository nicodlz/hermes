import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@hermes/db";

/**
 * AI Agent API - Endpoints optimized for OpenClaw integration
 * 
 * These endpoints are designed to be called by the AI agent
 * for automated lead processing, qualification, and outreach.
 */

export const aiRouter = new Hono()
  // Get next actions for AI agent
  .get("/next-actions", async (c) => {
    const [
      pendingTasks,
      leadsToQualify,
      leadsToContact,
      leadsToFollowUp,
    ] = await Promise.all([
      // Pending tasks with high priority
      db.task.findMany({
        where: { status: "PENDING" },
        include: { lead: { select: { id: true, title: true, author: true } } },
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
        take: 5,
      }),
      // New leads that need qualification
      db.lead.findMany({
        where: { status: "NEW", score: 0 },
        orderBy: { scrapedAt: "desc" },
        take: 10,
      }),
      // Qualified leads not yet contacted
      db.lead.findMany({
        where: { status: "QUALIFIED", contactedAt: null },
        orderBy: { score: "desc" },
        take: 5,
      }),
      // Leads needing follow-up (contacted 2+ days ago, no response)
      db.lead.findMany({
        where: {
          status: { in: ["CONTACTED", "FOLLOWUP_1"] },
          contactedAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          respondedAt: null,
        },
        orderBy: { contactedAt: "asc" },
        take: 5,
      }),
    ]);

    return c.json({
      tasks: pendingTasks,
      toQualify: leadsToQualify,
      toContact: leadsToContact,
      toFollowUp: leadsToFollowUp,
      summary: {
        pendingTasks: pendingTasks.length,
        leadsToQualify: leadsToQualify.length,
        leadsToContact: leadsToContact.length,
        leadsToFollowUp: leadsToFollowUp.length,
      },
    });
  })

  // Qualify a lead (AI scoring)
  .post("/qualify/:id", zValidator("json", z.object({
    score: z.number(),
    reasons: z.array(z.string()),
    analysis: z.string().optional(),
    aiModel: z.string().optional(),
  })), async (c) => {
    const id = c.req.param("id");
    const { score, reasons, analysis, aiModel } = c.req.valid("json");

    const lead = await db.lead.update({
      where: { id },
      data: {
        score,
        scoreReasons: JSON.stringify(reasons),
        status: score >= 15 ? "QUALIFIED" : "ARCHIVED",
        qualifiedAt: new Date(),
      },
    });

    // Add AI analysis note
    if (analysis) {
      await db.note.create({
        data: {
          leadId: id,
          content: analysis,
          type: "AI_ANALYSIS",
          aiModel,
        },
      });
    }

    return c.json(lead);
  })

  // Generate outreach message
  .post("/outreach/:id", zValidator("json", z.object({
    templateId: z.string(),
    variables: z.record(z.string()),
    channel: z.enum(["REDDIT_DM", "TWITTER_DM", "EMAIL", "LINKEDIN", "DISCORD", "OTHER"]),
  })), async (c) => {
    const leadId = c.req.param("id");
    const { templateId, variables, channel } = c.req.valid("json");

    // Get template and render
    const template = await db.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }

    let content = template.content;
    let subject = template.subject || "";
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      content = content.replace(regex, value);
      subject = subject.replace(regex, value);
    }

    // Create draft message
    const message = await db.message.create({
      data: {
        leadId,
        channel,
        direction: "OUTBOUND",
        subject: subject || null,
        content,
        templateId,
        status: "DRAFT",
      },
    });

    // Update template usage
    await db.template.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return c.json({ message, renderedContent: content, renderedSubject: subject });
  })

  // Mark message as sent
  .post("/message/:id/sent", zValidator("json", z.object({
    externalId: z.string().optional(),
    threadId: z.string().optional(),
  }).optional()), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json") || {};

    const message = await db.message.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalId: data.externalId,
        threadId: data.threadId,
      },
    });

    // Update lead status
    await db.lead.update({
      where: { id: message.leadId },
      data: {
        status: "CONTACTED",
        contactedAt: new Date(),
      },
    });

    return c.json(message);
  })

  // Record response received
  .post("/lead/:id/response", zValidator("json", z.object({
    content: z.string(),
    channel: z.enum(["REDDIT_DM", "TWITTER_DM", "EMAIL", "LINKEDIN", "DISCORD", "OTHER"]),
    externalId: z.string().optional(),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  })), async (c) => {
    const leadId = c.req.param("id");
    const { content, channel, externalId, sentiment } = c.req.valid("json");

    // Create inbound message
    const message = await db.message.create({
      data: {
        leadId,
        channel,
        direction: "INBOUND",
        content,
        externalId,
        status: "READ",
      },
    });

    // Update lead
    await db.lead.update({
      where: { id: leadId },
      data: {
        status: "RESPONDED",
        respondedAt: new Date(),
      },
    });

    // Add sentiment note if provided
    if (sentiment) {
      await db.note.create({
        data: {
          leadId,
          content: `Response sentiment: ${sentiment}`,
          type: "AI_ANALYSIS",
        },
      });
    }

    return c.json(message);
  })

  // Daily digest for AI
  .get("/digest", async (c) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      newLeads,
      qualifiedToday,
      responsesToday,
      pendingFollowups,
      upcomingCalls,
      stats,
    ] = await Promise.all([
      db.lead.count({ where: { scrapedAt: { gte: today } } }),
      db.lead.count({ where: { qualifiedAt: { gte: today } } }),
      db.lead.count({ where: { respondedAt: { gte: today } } }),
      db.lead.count({
        where: {
          status: { in: ["CONTACTED", "FOLLOWUP_1", "FOLLOWUP_2"] },
          contactedAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          respondedAt: null,
        },
      }),
      db.lead.count({
        where: {
          status: "CALL_SCHEDULED",
          callAt: { gte: today },
        },
      }),
      db.lead.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return c.json({
      date: today.toISOString().split("T")[0],
      summary: {
        newLeads,
        qualifiedToday,
        responsesToday,
        pendingFollowups,
        upcomingCalls,
      },
      pipeline: Object.fromEntries(stats.map((s) => [s.status, s._count])),
      actions: {
        qualifyNew: newLeads > 0,
        sendFollowups: pendingFollowups > 0,
        prepareCalls: upcomingCalls > 0,
      },
    });
  });
