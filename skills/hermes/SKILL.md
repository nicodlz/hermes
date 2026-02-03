# Hermes CRM Skill

SDR Agent automation for lead management, outreach, and sales pipeline.

## Trigger

Use when the user asks about:
- "Check leads", "new leads", "lead pipeline"
- "Follow up", "send outreach", "contact leads"
- "Sales stats", "conversion rate", "deals"
- "Qualify leads", "score leads"
- Any sales development / SDR related tasks

## Configuration

Set the Hermes API URL in your environment:

```bash
export HERMES_API_URL="https://hermes.ndlz.net"
# or for local dev:
export HERMES_API_URL="http://localhost:3001"
```

## API Endpoints

### AI Agent Endpoints (Primary)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/digest` | GET | Daily summary with pending actions |
| `/api/ai/next-actions` | GET | What needs attention now |
| `/api/ai/qualify/:id` | POST | Score a lead with AI analysis |
| `/api/ai/outreach/:id` | POST | Generate outreach message from template |
| `/api/ai/message/:id/sent` | POST | Mark message as sent |
| `/api/ai/lead/:id/response` | POST | Record response received |

### Lead Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads` | GET | List leads (filters: status, minScore, source, search) |
| `/api/leads/:id` | GET | Get lead with notes, tasks, messages |
| `/api/leads` | POST | Create new lead |
| `/api/leads/:id` | PATCH | Update lead (status, contact info, etc.) |
| `/api/leads/:id/notes` | POST | Add note to lead |
| `/api/leads/stats/pipeline` | GET | Pipeline status counts |

### Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List tasks |
| `/api/tasks/pending` | GET | Pending tasks (for agent) |
| `/api/tasks/overdue` | GET | Overdue tasks |
| `/api/tasks/:id/complete` | POST | Mark task complete |

### Templates

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/templates` | GET | List templates |
| `/api/templates/:id/render` | POST | Render template with variables |

### Stats

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats/dashboard` | GET | Overview metrics |
| `/api/stats/funnel` | GET | Conversion funnel |
| `/api/stats/daily` | GET | Daily activity (last N days) |

## Usage Examples

### Daily Check-in

```bash
# Get today's digest
curl -s "$HERMES_API_URL/api/ai/digest" | jq

# Response:
# {
#   "date": "2026-02-03",
#   "summary": {
#     "newLeads": 5,
#     "qualifiedToday": 2,
#     "responsesToday": 1,
#     "pendingFollowups": 3,
#     "upcomingCalls": 0
#   },
#   "actions": {
#     "qualifyNew": true,
#     "sendFollowups": true,
#     "prepareCalls": false
#   }
# }
```

### Qualify a Lead

```bash
curl -X POST "$HERMES_API_URL/api/ai/qualify/lead123" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 35,
    "reasons": ["+hiring_tag", "+budget $1k", "+stack_match(react)"],
    "analysis": "Strong lead - explicit budget, matching stack, remote friendly",
    "aiModel": "claude-opus-4"
  }'
```

### Generate Outreach Message

```bash
curl -X POST "$HERMES_API_URL/api/ai/outreach/lead123" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "reddit-initial-outreach",
    "channel": "REDDIT_DM",
    "variables": {
      "author": "TechStartupCEO",
      "title": "Looking for React developer",
      "stack": "React, TypeScript, Node.js",
      "personalized_insight": "Your mention of real-time features aligns with my WebSocket experience"
    }
  }'
```

### Add Lead from Scraper

```bash
curl -X POST "$HERMES_API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "reddit-forhire",
    "sourceUrl": "https://reddit.com/r/forhire/comments/abc123",
    "title": "[Hiring] React Developer for MVP",
    "description": "Looking for experienced React dev...",
    "author": "startup_founder",
    "score": 0
  }'
```

## Workflow

### Morning Routine

1. **Check digest**: `GET /api/ai/digest`
2. **Qualify new leads**: For each in `toQualify`, call `/api/ai/qualify/:id`
3. **Send follow-ups**: For leads in `toFollowUp`, generate and send messages
4. **Update pipeline**: Review responded leads, schedule calls

### Lead Processing

```
SCRAPED → QUALIFIED → CONTACTED → RESPONDED → CALL → PROPOSAL → WON/LOST
           ↓            ↓
        ARCHIVED    FOLLOWUP_1 → FOLLOWUP_2 → ARCHIVED
```

### Scoring Rules

Default ICP (Ideal Customer Profile):
- Budget: $1k-10k
- Stack: React, TypeScript, Node.js, Next.js, Web3, Solidity
- Timeline: 2-6 weeks
- Remote/async friendly

Scoring:
- `+10` Explicit hiring tag
- `+10` Budget mentioned
- `+5` Remote position
- `+5` Per stack match
- `-20` Red flag (equity only, free test, etc.)
- **Qualify threshold: 15+**

## Integration with OpenClaw

### Cron Jobs

```yaml
# Daily digest at 9am
- schedule: { kind: "cron", expr: "0 9 * * *", tz: "Europe/Lisbon" }
  payload:
    kind: agentTurn
    message: "Check Hermes daily digest and report new leads"
  sessionTarget: isolated

# Lead scraper every 4h
- schedule: { kind: "every", everyMs: 14400000 }
  payload:
    kind: agentTurn
    message: "Run lead scraper and add new leads to Hermes"
  sessionTarget: isolated
```

### Heartbeat Integration

Add to HEARTBEAT.md:
```markdown
## 📊 Hermes CRM Check
Every few heartbeats, check:
- `GET /api/ai/next-actions` for pending work
- Process any high-priority items
```

## Files

- `scripts/import-leads.sh` — Import leads from JSON
- `scripts/export-leads.sh` — Export leads to CSV
- `scripts/sync-crm.sh` — Sync with external CRM (if configured)
