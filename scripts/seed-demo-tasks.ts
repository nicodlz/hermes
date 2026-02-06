/**
 * Seed demo tasks for testing
 */

import { db } from "@hermes/db";

async function main() {
  console.log("Seeding demo tasks...");

  // Get first lead
  const lead = await db.lead.findFirst();
  
  if (!lead) {
    console.log("⚠ No leads found. Create some leads first.");
    return;
  }

  console.log(`Using lead: ${lead.title}`);

  // Create demo tasks
  const tasks = [
    {
      leadId: lead.id,
      title: "Send initial outreach email",
      description: "Use Reddit initial outreach template",
      type: "EMAIL" as const,
      priority: "HIGH" as const,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
    {
      leadId: lead.id,
      title: "Research company background",
      description: "Check LinkedIn, website, and previous work",
      type: "RESEARCH" as const,
      priority: "MEDIUM" as const,
    },
    {
      leadId: lead.id,
      title: "Follow-up if no response",
      description: "Send follow-up email after 3 days",
      type: "FOLLOWUP" as const,
      priority: "MEDIUM" as const,
      dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    },
  ];

  for (const task of tasks) {
    const created = await db.task.create({ data: task });
    console.log(`✓ Created: ${created.title}`);
  }

  console.log(`\n✅ Seeded ${tasks.length} demo tasks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
