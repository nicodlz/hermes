/**
 * Statistics API Routes
 * 
 * All stats are filtered by the user's organization.
 */

import { Hono } from "hono";
import { db } from "@hermes/db";
import type { AuthContext } from "../middleware/auth.js";

export const statsRouter = new Hono<AuthContext>()
  // Dashboard stats
  .get("/dashboard", async (c) => {
    const orgId = c.get("orgId");
    
    const [
      totalLeads,
      qualifiedLeads,
      contactedLeads,
      respondedLeads,
      dealsWon,
      dealsLost,
      pendingTasks,
      overdueTasks,
      pipeline,
    ] = await Promise.all([
      db.lead.count({ where: { orgId } }),
      db.lead.count({ where: { orgId, status: "QUALIFIED" } }),
      db.lead.count({ where: { orgId, contactedAt: { not: null } } }),
      db.lead.count({ where: { orgId, respondedAt: { not: null } } }),
      db.lead.count({ where: { orgId, status: "WON" } }),
      db.lead.count({ where: { orgId, status: "LOST" } }),
      db.task.count({ where: { status: "PENDING", lead: { orgId } } }),
      db.task.count({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueAt: { lt: new Date() },
          lead: { orgId },
        },
      }),
      db.lead.groupBy({
        by: ["status"],
        where: { orgId },
        _count: true,
      }),
    ]);

    const responseRate = contactedLeads > 0 
      ? Math.round((respondedLeads / contactedLeads) * 100) 
      : 0;
    
    const winRate = (dealsWon + dealsLost) > 0
      ? Math.round((dealsWon / (dealsWon + dealsLost)) * 100)
      : 0;

    return c.json({
      overview: {
        totalLeads,
        qualifiedLeads,
        contactedLeads,
        respondedLeads,
        dealsWon,
        dealsLost,
        responseRate,
        winRate,
      },
      tasks: {
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      pipeline: Object.fromEntries(pipeline.map((p) => [p.status, p._count])),
    });
  })

  // Daily stats
  .get("/daily", async (c) => {
    const days = Number(c.req.query("days")) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await db.dailyStats.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
    });

    return c.json(stats);
  })

  // Record daily stats (called by cron)
  .post("/daily/record", async (c) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      leadsScraped,
      leadsQualified,
      leadsContacted,
      leadsResponded,
      callsScheduled,
      proposalsSent,
      dealsWon,
      dealsLost,
    ] = await Promise.all([
      db.lead.count({ where: { scrapedAt: { gte: today } } }),
      db.lead.count({ where: { qualifiedAt: { gte: today } } }),
      db.lead.count({ where: { contactedAt: { gte: today } } }),
      db.lead.count({ where: { respondedAt: { gte: today } } }),
      db.lead.count({ where: { callAt: { gte: today } } }),
      db.lead.count({ where: { proposalAt: { gte: today } } }),
      db.lead.count({ where: { status: "WON", closedAt: { gte: today } } }),
      db.lead.count({ where: { status: "LOST", closedAt: { gte: today } } }),
    ]);

    const stats = await db.dailyStats.upsert({
      where: { date: today },
      create: {
        date: today,
        leadsScraped,
        leadsQualified,
        leadsContacted,
        leadsResponded,
        callsScheduled,
        proposalsSent,
        dealsWon,
        dealsLost,
      },
      update: {
        leadsScraped,
        leadsQualified,
        leadsContacted,
        leadsResponded,
        callsScheduled,
        proposalsSent,
        dealsWon,
        dealsLost,
      },
    });

    return c.json(stats);
  })

  // Conversion funnel
  .get("/funnel", async (c) => {
    const orgId = c.get("orgId");
    const since = c.req.query("since");
    const until = c.req.query("until");
    
    const dateFilter = since || until ? {
      createdAt: {
        ...(since && { gte: new Date(since) }),
        ...(until && { lte: new Date(until) }),
      }
    } : {};
    
    const [
      total,
      qualified,
      contacted,
      responded,
      calls,
      proposals,
      won,
    ] = await Promise.all([
      db.lead.count({ where: { orgId, ...dateFilter } }),
      db.lead.count({ where: { orgId, qualifiedAt: { not: null }, ...dateFilter } }),
      db.lead.count({ where: { orgId, contactedAt: { not: null }, ...dateFilter } }),
      db.lead.count({ where: { orgId, respondedAt: { not: null }, ...dateFilter } }),
      db.lead.count({ where: { orgId, callAt: { not: null }, ...dateFilter } }),
      db.lead.count({ where: { orgId, proposalAt: { not: null }, ...dateFilter } }),
      db.lead.count({ where: { orgId, status: "WON", ...dateFilter } }),
    ]);

    const funnel = [
      { stage: "NEW", label: "Scraped", count: total, rate: 100 },
      { stage: "QUALIFIED", label: "Qualified", count: qualified, rate: total ? Math.round((qualified / total) * 100) : 0 },
      { stage: "CONTACTED", label: "Contacted", count: contacted, rate: qualified ? Math.round((contacted / qualified) * 100) : 0 },
      { stage: "RESPONDED", label: "Responded", count: responded, rate: contacted ? Math.round((responded / contacted) * 100) : 0 },
      { stage: "WON", label: "Won", count: won, rate: responded ? Math.round((won / responded) * 100) : 0 },
    ];

    return c.json(funnel);
  })

  // Timeline stats (leads evolution by day/week)
  .get("/timeline", async (c) => {
    const orgId = c.get("orgId");
    const days = Number(c.req.query("days")) || 30;
    const groupBy = c.req.query("groupBy") || "day"; // day or week
    
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // Fetch all leads with timestamps
    const leads = await db.lead.findMany({
      where: { 
        orgId,
        createdAt: { gte: since }
      },
      select: {
        createdAt: true,
        qualifiedAt: true,
        contactedAt: true,
        respondedAt: true,
        status: true,
        closedAt: true,
      },
      orderBy: { createdAt: "asc" }
    });

    // Group by date
    const timeline: Record<string, any> = {};
    
    leads.forEach(lead => {
      const dateKey = groupBy === "week" 
        ? getWeekKey(lead.createdAt)
        : lead.createdAt.toISOString().split('T')[0];
      
      if (!timeline[dateKey]) {
        timeline[dateKey] = {
          date: dateKey,
          new: 0,
          qualified: 0,
          contacted: 0,
          responded: 0,
          won: 0,
          lost: 0,
        };
      }
      
      timeline[dateKey].new++;
      if (lead.qualifiedAt) timeline[dateKey].qualified++;
      if (lead.contactedAt) timeline[dateKey].contacted++;
      if (lead.respondedAt) timeline[dateKey].responded++;
      if (lead.status === "WON") timeline[dateKey].won++;
      if (lead.status === "LOST") timeline[dateKey].lost++;
    });

    return c.json(Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date)));
  })

  // Template performance stats
  .get("/templates", async (c) => {
    const orgId = c.get("orgId");
    
    // Get all templates with their message stats
    const templates = await db.template.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        usageCount: true,
        messages: {
          where: {
            lead: { orgId },
            status: { in: ["SENT", "DELIVERED", "READ", "REPLIED"] }
          },
          select: {
            status: true,
            sentAt: true,
            repliedAt: true,
          }
        }
      }
    });

    const stats = templates.map(template => {
      const sent = template.messages.filter(m => m.sentAt).length;
      const replied = template.messages.filter(m => m.repliedAt).length;
      const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;
      
      return {
        id: template.id,
        name: template.name,
        type: template.type,
        usageCount: template.usageCount,
        sent,
        replied,
        replyRate,
      };
    });

    return c.json(stats.sort((a, b) => b.usageCount - a.usageCount));
  })

  // Top lead sources
  .get("/sources", async (c) => {
    const orgId = c.get("orgId");
    const since = c.req.query("since");
    const until = c.req.query("until");
    
    const dateFilter = since || until ? {
      createdAt: {
        ...(since && { gte: new Date(since) }),
        ...(until && { lte: new Date(until) }),
      }
    } : {};

    const sources = await db.lead.groupBy({
      by: ["source"],
      where: { orgId, ...dateFilter },
      _count: { id: true },
      _avg: { score: true },
    });

    // Get conversion stats per source
    const sourceStats = await Promise.all(
      sources.map(async (s) => {
        const [qualified, contacted, responded, won] = await Promise.all([
          db.lead.count({ where: { orgId, source: s.source, qualifiedAt: { not: null }, ...dateFilter } }),
          db.lead.count({ where: { orgId, source: s.source, contactedAt: { not: null }, ...dateFilter } }),
          db.lead.count({ where: { orgId, source: s.source, respondedAt: { not: null }, ...dateFilter } }),
          db.lead.count({ where: { orgId, source: s.source, status: "WON", ...dateFilter } }),
        ]);

        return {
          source: s.source,
          total: s._count.id,
          avgScore: Math.round(s._avg.score || 0),
          qualified,
          contacted,
          responded,
          won,
          conversionRate: s._count.id > 0 ? Math.round((won / s._count.id) * 100) : 0,
        };
      })
    );

    return c.json(sourceStats.sort((a, b) => b.total - a.total));
  })

  // Conversion time stats (average time between stages)
  .get("/conversion-time", async (c) => {
    const orgId = c.get("orgId");
    
    const leads = await db.lead.findMany({
      where: { 
        orgId,
        qualifiedAt: { not: null }
      },
      select: {
        createdAt: true,
        qualifiedAt: true,
        contactedAt: true,
        respondedAt: true,
        callAt: true,
        proposalAt: true,
        closedAt: true,
        status: true,
      }
    });

    const times = {
      toQualified: [] as number[],
      toContacted: [] as number[],
      toResponded: [] as number[],
      toWon: [] as number[],
    };

    leads.forEach(lead => {
      if (lead.qualifiedAt) {
        times.toQualified.push(daysBetween(lead.createdAt, lead.qualifiedAt));
      }
      if (lead.contactedAt && lead.qualifiedAt) {
        times.toContacted.push(daysBetween(lead.qualifiedAt, lead.contactedAt));
      }
      if (lead.respondedAt && lead.contactedAt) {
        times.toResponded.push(daysBetween(lead.contactedAt, lead.respondedAt));
      }
      if (lead.status === "WON" && lead.closedAt && lead.respondedAt) {
        times.toWon.push(daysBetween(lead.respondedAt, lead.closedAt));
      }
    });

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;

    return c.json({
      stages: [
        { stage: "New → Qualified", avgDays: avg(times.toQualified), count: times.toQualified.length },
        { stage: "Qualified → Contacted", avgDays: avg(times.toContacted), count: times.toContacted.length },
        { stage: "Contacted → Responded", avgDays: avg(times.toResponded), count: times.toResponded.length },
        { stage: "Responded → Won", avgDays: avg(times.toWon), count: times.toWon.length },
      ],
      totalAvg: avg([...times.toQualified, ...times.toContacted, ...times.toResponded, ...times.toWon])
    });
  })

  // CSV export
  .get("/export", async (c) => {
    const orgId = c.get("orgId");
    const type = c.req.query("type") || "leads"; // leads, timeline, sources
    
    if (type === "timeline") {
      const days = Number(c.req.query("days")) || 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const leads = await db.lead.findMany({
        where: { orgId, createdAt: { gte: since } },
        select: { createdAt: true, qualifiedAt: true, contactedAt: true, respondedAt: true, status: true }
      });
      
      const timeline: Record<string, any> = {};
      leads.forEach(lead => {
        const date = lead.createdAt.toISOString().split('T')[0];
        if (!timeline[date]) timeline[date] = { date, new: 0, qualified: 0, contacted: 0, responded: 0, won: 0 };
        timeline[date].new++;
        if (lead.qualifiedAt) timeline[date].qualified++;
        if (lead.contactedAt) timeline[date].contacted++;
        if (lead.respondedAt) timeline[date].responded++;
        if (lead.status === "WON") timeline[date].won++;
      });
      
      const csv = [
        "Date,New,Qualified,Contacted,Responded,Won",
        ...Object.values(timeline).map((d: any) => `${d.date},${d.new},${d.qualified},${d.contacted},${d.responded},${d.won}`)
      ].join("\n");
      
      c.header("Content-Type", "text/csv");
      c.header("Content-Disposition", `attachment; filename="hermes-timeline-${new Date().toISOString().split('T')[0]}.csv"`);
      return c.body(csv);
    }
    
    // Default: leads export
    const leads = await db.lead.findMany({
      where: { orgId },
      select: {
        id: true,
        title: true,
        source: true,
        status: true,
        score: true,
        author: true,
        email: true,
        company: true,
        createdAt: true,
        qualifiedAt: true,
        contactedAt: true,
        respondedAt: true,
      },
      orderBy: { createdAt: "desc" }
    });
    
    const csv = [
      "ID,Title,Source,Status,Score,Author,Email,Company,Created,Qualified,Contacted,Responded",
      ...leads.map(l => `"${l.id}","${l.title}","${l.source}","${l.status}",${l.score},"${l.author || ''}","${l.email || ''}","${l.company || ''}","${l.createdAt.toISOString()}","${l.qualifiedAt?.toISOString() || ''}","${l.contactedAt?.toISOString() || ''}","${l.respondedAt?.toISOString() || ''}"`)
    ].join("\n");
    
    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", `attachment; filename="hermes-leads-${new Date().toISOString().split('T')[0]}.csv"`);
    return c.body(csv);
  });

// Helper functions
function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
  return d.toISOString().split('T')[0];
}
