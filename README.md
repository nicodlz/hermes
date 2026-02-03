# Hermes ⚡

> Modern CRM for AI-powered Sales Development Representatives (SDR)

Hermes is a lightweight, self-hosted CRM designed for solo developers and small teams who want to automate their outreach workflow using AI agents.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Hono](https://img.shields.io/badge/Hono-4.7-orange)
![React](https://img.shields.io/badge/React-19-61dafb)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- 📊 **Lead Pipeline** — Track leads from scrape to close with customizable stages
- 🤖 **AI-First API** — Endpoints designed for agent automation (OpenClaw, LangChain, etc.)
- 📧 **Template System** — Reusable outreach templates with variable substitution
- 📈 **Analytics** — Conversion funnel, response rates, and daily stats
- ✅ **Task Management** — Follow-ups, calls, and action items with due dates
- 🔌 **SQLite** — Zero-config database, portable, easy backups

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | [Hono](https://hono.dev) + [Zod](https://zod.dev) |
| Database | [Prisma](https://prisma.io) + SQLite |
| Frontend | [React 19](https://react.dev) + [TanStack Query](https://tanstack.com/query) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Build | [Turborepo](https://turbo.build) + [pnpm](https://pnpm.io) |

## Quick Start

```bash
# Clone
git clone https://github.com/nicodlz/hermes.git
cd hermes

# Install
pnpm install

# Setup database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start development
pnpm dev
```

- **API**: http://localhost:3001
- **Web**: http://localhost:5173

## API Reference

### AI Agent Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/digest` | GET | Daily summary with action items |
| `/api/ai/next-actions` | GET | Pending tasks and leads needing attention |
| `/api/ai/qualify/:id` | POST | Score a lead with AI analysis |
| `/api/ai/outreach/:id` | POST | Generate outreach from template |

### Lead Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads` | GET | List with filters (status, score, search) |
| `/api/leads/:id` | GET | Full details with notes and messages |
| `/api/leads` | POST | Create lead |
| `/api/leads/:id` | PATCH | Update status, contact info |
| `/api/leads/bulk` | POST | Batch create from scraper |

### Other Resources

- `/api/tasks` — Task management
- `/api/templates` — Message templates
- `/api/stats` — Analytics and metrics
- `/api/sources` — Scraping source config

See full documentation in [`skills/hermes/SKILL.md`](skills/hermes/SKILL.md).

## Lead Pipeline

```
NEW → QUALIFIED → CONTACTED → RESPONDED → CALL → PROPOSAL → WON
 ↓        ↓           ↓
ARCHIVED  ARCHIVED   FOLLOWUP_1 → FOLLOWUP_2 → LOST
```

## Scoring System

Default Ideal Customer Profile (ICP):

- **Budget**: $1k-10k
- **Stack**: React, TypeScript, Node.js, Next.js, Web3
- **Timeline**: 2-6 weeks
- **Work style**: Remote, async

Scoring rules:
- `+10` Has [Hiring] tag
- `+10` Budget mentioned
- `+5` Remote position
- `+5` Per matching technology
- `-20` Red flag (equity only, unpaid test, etc.)

**Qualify threshold: 15+**

## Deployment

### Docker

```bash
docker build -t hermes .
docker run -p 3001:3001 -v hermes-data:/app/data hermes
```

### Docker Compose

```bash
docker-compose up -d
```

### Coolify / Self-hosted

1. Connect repository
2. Build: `pnpm install && pnpm db:generate && pnpm build`
3. Start: `node apps/api/dist/server.js`
4. Add volume for `/app/data` (SQLite persistence)

## AI Agent Integration

### OpenClaw

Add the Hermes skill to your workspace:

```bash
cp -r skills/hermes ~/.openclaw/workspace/skills/
```

Example cron job for daily digest:

```yaml
schedule:
  kind: cron
  expr: "0 9 * * *"
  tz: "Europe/Lisbon"
payload:
  kind: agentTurn
  message: "Check Hermes daily digest: GET /api/ai/digest"
sessionTarget: isolated
```

### Other Agents

Any agent that can make HTTP requests works. Example with curl:

```bash
# Get what needs attention
curl http://localhost:3001/api/ai/next-actions

# Qualify a lead
curl -X POST http://localhost:3001/api/ai/qualify/abc123 \
  -H "Content-Type: application/json" \
  -d '{"score": 35, "reasons": ["+budget", "+remote"]}'
```

## Project Structure

```
hermes/
├── apps/
│   ├── api/          # Hono API server
│   └── web/          # React frontend
├── packages/
│   └── db/           # Prisma schema & client
├── skills/
│   └── hermes/       # OpenClaw skill
└── docker-compose.yml
```

## License

MIT © [Nicolas Timon](https://github.com/nicodlz)
