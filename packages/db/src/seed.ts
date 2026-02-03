import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default templates (use upsert for SQLite compatibility)
  const templates = [
    {
      name: "Reddit Initial Outreach",
      type: "INITIAL_OUTREACH" as const,
      channel: "REDDIT_DM" as const,
      content: `Hey {{author}},

I saw your post about {{title}} and it caught my attention.

I'm a freelance developer specializing in {{stack}} and I've built similar projects before. I'd love to help you bring this to life.

A few quick thoughts:
- {{personalized_insight}}
- I work async (no meetings required) and can start this week
- Happy to share relevant portfolio pieces

Would you be open to a quick chat about the project scope?

Best,
Nicolas`,
      variables: JSON.stringify(["author", "title", "stack", "personalized_insight"]),
    },
    {
      name: "Follow-up Day 2",
      type: "FOLLOWUP_1" as const,
      channel: "REDDIT_DM" as const,
      content: `Hey {{author}},

Just following up on my message about {{title}}.

I know you're probably getting a lot of responses, so I wanted to quickly highlight what makes me different:
- I specialize in {{stack}} (your exact stack)
- I've shipped {{similar_project}} before
- I can start immediately and work async

Happy to jump on a quick call or just chat here if that's easier.

Nicolas`,
      variables: JSON.stringify(["author", "title", "stack", "similar_project"]),
    },
    {
      name: "Follow-up Day 7",
      type: "FOLLOWUP_2" as const,
      channel: "REDDIT_DM" as const,
      content: `Hey {{author}},

Last ping from me! If you've already found someone for {{title}}, no worries at all.

If you're still looking or want a second opinion on the project, I'm here. Sometimes having a fresh technical perspective helps.

Either way, good luck with the project!

Nicolas`,
      variables: JSON.stringify(["author", "title"]),
    },
    {
      name: "Proposal Template",
      type: "PROPOSAL" as const,
      channel: null,
      subject: "Proposal: {{title}}",
      content: `# Proposal: {{title}}

## Understanding

{{project_understanding}}

## Proposed Solution

{{solution}}

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
{{timeline_table}}

## Investment

**Total: {{amount}} {{currency}}**

Payment terms: {{payment_terms}}

## Why Me?

{{why_me}}

## Next Steps

1. Review this proposal
2. 15-min call to align on details
3. Sign agreement & deposit
4. Kick off!

Looking forward to working together.

— Nicolas`,
      variables: JSON.stringify([
        "title",
        "project_understanding",
        "solution",
        "timeline_table",
        "amount",
        "currency",
        "payment_terms",
        "why_me",
      ]),
    },
  ];

  for (const t of templates) {
    await db.template.upsert({
      where: { id: t.name.toLowerCase().replace(/\s+/g, "-") },
      create: { id: t.name.toLowerCase().replace(/\s+/g, "-"), ...t },
      update: {},
    });
  }

  // Create default sources
  const sources = [
    {
      id: "reddit-forhire",
      name: "Reddit r/forhire",
      type: "REDDIT" as const,
      config: JSON.stringify({
        subreddits: ["forhire", "remotejs", "reactjs", "nextjs", "webdev"],
        keywords: ["hiring", "looking for", "need developer", "freelance"],
        minScore: 1,
      }),
      schedule: "0 */4 * * *",
      isActive: true,
    },
    {
      id: "twitter-hiring",
      name: "Twitter #hiring",
      type: "TWITTER" as const,
      config: JSON.stringify({
        queries: [
          "#hiring #typescript #remote",
          "#hiring #react #developer",
          "#hiring #nextjs #freelance",
          "#hiring #web3 #solidity",
        ],
        minLikes: 5,
      }),
      schedule: "0 */6 * * *",
      isActive: true,
    },
    {
      id: "indiehackers",
      name: "IndieHackers",
      type: "INDIEHACKERS" as const,
      config: JSON.stringify({
        keywords: ["co-founder", "developer", "technical", "hiring"],
      }),
      schedule: "0 */12 * * *",
      isActive: true,
    },
  ];

  for (const s of sources) {
    await db.source.upsert({
      where: { id: s.id },
      create: s,
      update: {},
    });
  }

  // Create default settings
  const settings = [
    {
      key: "icp",
      value: JSON.stringify({
        budgetMin: 1000,
        budgetMax: 10000,
        stack: ["react", "typescript", "node", "nextjs", "web3", "solidity"],
        timeline: "2-6 weeks",
        redFlags: ["equity only", "budget < $500", "scope unclear", "free work to test"],
      }),
    },
    {
      key: "scoring",
      value: JSON.stringify({
        hasHiringTag: 10,
        hasBudget: 10,
        isRemote: 5,
        stackMatch: 5,
        redFlag: -20,
        qualifyThreshold: 15,
      }),
    },
    {
      key: "followup",
      value: JSON.stringify({
        day1: false,
        day2: true,
        day7: true,
        maxFollowups: 2,
      }),
    },
  ];

  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      create: s,
      update: {},
    });
  }

  console.log("✅ Database seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
