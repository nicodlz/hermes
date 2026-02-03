import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, TaskStatus, TaskType, Priority } from "@hermes/db";

const createTaskSchema = z.object({
  leadId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  type: z.nativeEnum(TaskType).default("OTHER"),
  priority: z.nativeEnum(Priority).default("MEDIUM"),
  dueAt: z.string().datetime().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(TaskType).optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueAt: z.string().datetime().optional(),
  aiExecuted: z.boolean().optional(),
  aiResult: z.string().optional(),
});

export const tasksRouter = new Hono()
  // List tasks
  .get("/", async (c) => {
    const status = c.req.query("status") as TaskStatus | undefined;
    const priority = c.req.query("priority") as Priority | undefined;
    const type = c.req.query("type") as TaskType | undefined;
    const leadId = c.req.query("leadId");

    const tasks = await db.task.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(type && { type }),
        ...(leadId && { leadId }),
      },
      include: { lead: { select: { id: true, title: true, author: true, status: true } } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    });

    return c.json(tasks);
  })

  // Get pending tasks (for AI agent)
  .get("/pending", async (c) => {
    const tasks = await db.task.findMany({
      where: { status: "PENDING" },
      include: { lead: true },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 10,
    });

    return c.json(tasks);
  })

  // Get overdue tasks
  .get("/overdue", async (c) => {
    const tasks = await db.task.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueAt: { lt: new Date() },
      },
      include: { lead: { select: { id: true, title: true, author: true } } },
      orderBy: { dueAt: "asc" },
    });

    return c.json(tasks);
  })

  // Create task
  .post("/", zValidator("json", createTaskSchema), async (c) => {
    const data = c.req.valid("json");
    const task = await db.task.create({
      data: {
        ...data,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      },
    });
    return c.json(task, 201);
  })

  // Update task
  .patch("/:id", zValidator("json", updateTaskSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const updates: Record<string, unknown> = { ...data };
    if (data.dueAt) updates.dueAt = new Date(data.dueAt);
    if (data.status === "COMPLETED") updates.completedAt = new Date();

    const task = await db.task.update({
      where: { id },
      data: updates,
    });

    return c.json(task);
  })

  // Complete task
  .post("/:id/complete", async (c) => {
    const id = c.req.param("id");
    const task = await db.task.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return c.json(task);
  })

  // Delete task
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.task.delete({ where: { id } });
    return c.json({ success: true });
  });
