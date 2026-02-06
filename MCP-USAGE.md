# Hermes MCP Quick Reference

## For Atlas (AI Agent)

When working with Hermes CRM, **use MCP first** for all operations.

### Quick Commands

```bash
# List recent leads
cd /home/ubuntu/.openclaw/workspace/hermes/skills/hermes
./scripts/hermes-mcp.sh leads 10

# Get lead details
./scripts/hermes-mcp.sh lead <id>

# Create lead
./scripts/hermes-mcp.sh create reddit "https://..." "Title"

# Check database schema
./scripts/hermes-mcp.sh schema | head -50

# Find Lead model definition
./scripts/hermes-mcp.sh model Lead

# Read an API route
./scripts/hermes-mcp.sh route routes/leads.ts

# Search for pattern
./scripts/hermes-mcp.sh search "scoreReasons"
```

### When to Use Direct API (hermes-cli.sh)

Only for operations not yet in MCP:
```bash
./scripts/hermes-cli.sh digest    # AI daily digest
./scripts/hermes-cli.sh actions   # Next actions
./scripts/hermes-cli.sh stats     # Dashboard stats
./scripts/hermes-cli.sh funnel    # Conversion funnel
```

### MCP Server Location

```
/home/ubuntu/.openclaw/workspace/hermes/mcp-server/index.js
```

### Environment Variables

Already configured in MCP wrapper:
```bash
HERMES_API_URL=https://hermes.ndlz.net
HERMES_API_KEY=hms_821540f1e0971977622484d04492bb2cede73445
```

### Direct MCP Call (Advanced)

```bash
cd /home/ubuntu/.openclaw/workspace/hermes/mcp-server

# List tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | \
  HERMES_API_URL=https://hermes.ndlz.net \
  HERMES_API_KEY=hms_821540f1e0971977622484d04492bb2cede73445 \
  node index.js 2>/dev/null | jq

# Call a tool
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list_leads", "arguments": {"limit": 5}}}' | \
  HERMES_API_URL=https://hermes.ndlz.net \
  HERMES_API_KEY=hms_821540f1e0971977622484d04492bb2cede73445 \
  node index.js 2>/dev/null | jq -r '.result.content[0].text' | jq
```

## Migration Status

### ✅ Available via MCP
- Lead listing, creation, retrieval
- Database schema access
- Code search and inspection
- Project structure
- Prisma model extraction
- API route reading

### ⏳ Still Direct API
- AI digest (`/api/ai/digest`)
- Next actions (`/api/ai/next-actions`)
- Lead qualification (`POST /api/ai/qualify/:id`)
- Outreach generation (`POST /api/ai/outreach/:id`)
- Dashboard stats (`/api/stats/dashboard`)
- Conversion funnel (`/api/stats/funnel`)

### 📋 Future Additions
- `qualify_lead` MCP tool
- `generate_outreach` MCP tool
- `get_digest` MCP tool
- `get_stats` MCP tool
