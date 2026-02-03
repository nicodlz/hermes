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
    
    const [
      total,
      qualified,
      contacted,
      responded,
      calls,
      proposals,
      won,
    ] = await Promise.all([
      db.lead.count({ where: { orgId } }),
      db.lead.count({ where: { orgId, qualifiedAt: { not: null } } }),
      db.lead.count({ where: { orgId, contactedAt: { not: null } } }),
      db.lead.count({ where: { orgId, respondedAt: { not: null } } }),
      db.lead.count({ where: { orgId, callAt: { not: null } } }),
      db.lead.count({ where: { orgId, proposalAt: { not: null } } }),
      db.lead.count({ where: { orgId, status: "WON" } }),
    ]);

    const funnel = [
      { stage: "Scraped", count: total, rate: 100 },
      { stage: "Qualified", count: qualified, rate: total ? Math.round((qualified / total) * 100) : 0 },
      { stage: "Contacted", count: contacted, rate: qualified ? Math.round((contacted / qualified) * 100) : 0 },
      { stage: "Responded", count: responded, rate: contacted ? Math.round((responded / contacted) * 100) : 0 },
      { stage: "Calls", count: calls, rate: responded ? Math.round((calls / responded) * 100) : 0 },
      { stage: "Proposals", count: proposals, rate: calls ? Math.round((proposals / calls) * 100) : 0 },
      { stage: "Won", count: won, rate: proposals ? Math.round((won / proposals) * 100) : 0 },
    ];

    return c.json(funnel);
  });
