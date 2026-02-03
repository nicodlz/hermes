# Hermes 🏃‍♂️

**SDR Agent CRM** — A modern CRM optimized for AI-powered sales development.

## Features

- 📊 **Lead Management** — Track leads from scrape to close
- 🤖 **AI Integration** — Endpoints designed for OpenClaw automation
- 📧 **Templates** — Reusable outreach templates with variables
- 📈 **Analytics** — Conversion funnel and performance metrics
- ✅ **Tasks** — Follow-up reminders and action items

## Tech Stack

- **API**: Hono + Prisma + Zod
- **Web**: React + Vite + TanStack Query + Tailwind
- **DB**: SQLite (portable, zero-config)
- **Build**: Turborepo + pnpm

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate Prisma client & push schema
pnpm db:generate
pnpm db:push

# Seed default data
pnpm db:seed

# Start dev servers
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:5173

## API Endpoints

### Leads
- `GET /api/leads` — List leads (with filters)
- `GET /api/leads/:id` — Get lead with notes, tasks, messages
- `POST /api/leads` — Create lead
- `PATCH /api/leads/:id` — Update lead
- `POST /api/leads/:id/notes` — Add note

### AI Agent
- `GET /api/ai/next-actions` — Get pending work for AI
- `GET /api/ai/digest` — Daily summary
- `POST /api/ai/qualify/:id` — Score a lead
- `POST /api/ai/outreach/:id` — Generate outreach message

### Tasks
- `GET /api/tasks` — List tasks
- `GET /api/tasks/pending` — Pending tasks
- `POST /api/tasks/:id/complete` — Mark complete

### Stats
- `GET /api/stats/dashboard` — Overview metrics
- `GET /api/stats/funnel` — Conversion funnel

## Deployment

### Docker

```bash
docker build -t hermes .
docker run -p 3001:3001 -v hermes-data:/app/data hermes
```

### Coolify

1. Connect the repo
2. Set build command: `pnpm install && pnpm db:generate && pnpm build`
3. Set start command: `node apps/api/dist/server.js`
4. Add volume: `/app/data` for SQLite persistence

## OpenClaw Integration

Hermes is designed to be used with OpenClaw as an SDR agent:

```yaml
# Example: Daily digest job
schedule: "0 9 * * *"
payload:
  kind: agentTurn
  message: "Check Hermes digest: GET /api/ai/digest"
```

## License

MIT
