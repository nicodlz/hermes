# Hermes CRM Skill

SDR Agent automation for lead management, outreach, and sales pipeline.

## Trigger

Use when the user asks about:
- "Check leads", "new leads", "lead pipeline"
- "Follow up", "send outreach", "contact leads"
- "Sales stats", "conversion rate", "deals"
- "Qualify leads", "score leads"
- "CRM", "pipeline", "prospects"
- Any sales development / SDR related tasks

## Access Methods

### 🎯 **Recommended: MCP Server** (Primary)

The Hermes MCP server provides structured access to the CRM and codebase.

**Resources:**
- `hermes://db/schema` - Complete Prisma database schema
- `hermes://api/routes` - All API route handlers
- `hermes://project/structure` - Project structure
- `hermes://docs/deployment` - Deployment documentation

**Tools:**
- `list_leads` - List leads with optional filtering
- `get_lead` - Get lead details by ID
- `create_lead` - Create new lead
- `read_api_route` - Read API route source
- `read_prisma_model` - Extract Prisma model definition
- `search_code` - Search codebase for patterns
- `exec_command` - Run project commands

**MCP Wrapper Script:**
```bash
# Use the MCP wrapper for common operations
./scripts/hermes-mcp.sh leads              # List 20 recent leads
./scripts/hermes-mcp.sh leads 10 linkedin  # Filter by source
./scripts/hermes-mcp.sh lead <id>          # Get lead details
./scripts/hermes-mcp.sh create reddit "https://..." "Title"
./scripts/hermes-mcp.sh schema             # Show DB schema
./scripts/hermes-mcp.sh model Lead         # Show Lead model
./scripts/hermes-mcp.sh route routes/leads.ts
./scripts/hermes-mcp.sh search "score"
./scripts/hermes-mcp.sh structure
```

### 📡 Direct API Access (Legacy)

For operations not yet in MCP (digest, qualify, outreach):
```bash
./scripts/hermes-cli.sh digest      # Daily digest
./scripts/hermes-cli.sh actions     # What needs attention now
./scripts/hermes-cli.sh stats       # Dashboard stats
./scripts/hermes-cli.sh funnel      # Conversion funnel
./scripts/hermes-cli.sh tasks       # Pending tasks
```

## Configuration

**MCP Server:**
```bash
export HERMES_API_URL="https://hermes.ndlz.net"
export HERMES_API_KEY="hms_821540f1e0971977622484d04492bb2cede73445"
```

MCP server auto-configured with these env vars.

## Usage Examples

### List Recent Leads (MCP)

```bash
./scripts/hermes-mcp.sh leads 10
```

Returns:
```json
{
  "leads": [
    {
      "id": "cml8ai9p7...",
      "source": "linkedin",
      "title": "CTO at StartupX",
      "score": 13,
      "status": "NEW"
    }
  ],
  "total": 127
}
```

### Get Lead Details (MCP)

```bash
./scripts/hermes-mcp.sh lead cml8ai9p70005mw01j0jrnp44
```

Returns full lead with notes, tasks, messages.

### Create Lead (MCP)

```bash
./scripts/hermes-mcp.sh create \
  "reddit" \
  "https://reddit.com/r/forhire/..." \
  "React developer needed for crypto project"
```

### Read Database Schema (MCP)

```bash
./scripts/hermes-mcp.sh schema | head -50
```

Shows Prisma schema with all models.

### Search Codebase (MCP)

```bash
./scripts/hermes-mcp.sh search "scoreReasons"
```

Finds all occurrences in TypeScript files.

### Direct API (Legacy)

```bash
# Daily digest (not in MCP yet)
./scripts/hermes-cli.sh digest

# Get next actions (AI-specific endpoint)
./scripts/hermes-cli.sh actions

# Dashboard stats
./scripts/hermes-cli.sh stats
```

## API Endpoints

### AI Agent Endpoints (Direct API)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/digest` | GET | Daily summary with pending actions |
| `/api/ai/next-actions` | GET | What needs attention now |
| `/api/ai/qualify/:id` | POST | Score a lead with AI analysis |
| `/api/ai/outreach/:id` | POST | Generate outreach message from template |

### Lead Management (via MCP)

| MCP Tool | Equivalent Endpoint | Description |
|----------|---------------------|-------------|
| `list_leads` | `GET /api/leads` | List leads with filters |
| `get_lead` | `GET /api/leads/:id` | Get lead with relations |
| `create_lead` | `POST /api/leads` | Create new lead |

### Code Access (via MCP)

| MCP Tool | Description |
|----------|-------------|
| `read_api_route` | Read route handler source |
| `read_prisma_model` | Extract model from schema |
| `search_code` | Grep codebase |

## Workflow

### Morning Routine

1. **Check digest**: `./scripts/hermes-cli.sh digest`
2. **List new leads**: `./scripts/hermes-mcp.sh leads 20`
3. **Review qualified leads**: Filter by score ≥15
4. **Send follow-ups**: For leads in `CONTACTED` status

### Lead Processing Flow

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

### Using MCP in Agent Tasks

When OpenClaw supports MCP, you can call tools directly:
```json
{
  "mcp_call": {
    "server": "hermes",
    "tool": "list_leads",
    "arguments": {
      "limit": 10,
      "source": "linkedin"
    }
  }
}
```

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
    message: "Run lead scraper and add new leads to Hermes via MCP"
  sessionTarget: isolated
```

### Heartbeat Integration

Add to HEARTBEAT.md:
```markdown
## 📊 Hermes CRM Check
Every few heartbeats, check:
- `./scripts/hermes-mcp.sh leads 10` for recent leads
- `./scripts/hermes-cli.sh actions` for pending work
- Process any high-priority items
```

## Files

- `scripts/hermes-mcp.sh` — **MCP wrapper (recommended)**
- `scripts/hermes-cli.sh` — Direct API wrapper (legacy)
- `../../mcp-server/` — MCP server implementation

## Migration Notes

**MCP covers:**
- ✅ Lead listing, creation, retrieval
- ✅ Database schema access
- ✅ Code search and inspection
- ✅ Project structure

**Still needs direct API:**
- ⏳ AI digest, next-actions
- ⏳ Lead qualification (POST /api/ai/qualify)
- ⏳ Outreach generation
- ⏳ Dashboard stats, funnel

**Future:** Add AI-specific tools to MCP server.
