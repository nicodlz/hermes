# Hermes MCP Server

Model Context Protocol server for structured access to the Hermes CRM project and API.

## Features

### Resources
- `hermes://db/schema` - Complete Prisma database schema
- `hermes://api/routes` - All API route handlers
- `hermes://project/structure` - Complete monorepo structure
- `hermes://docs/deployment` - Deployment documentation

### Tools

#### CRM Operations (via API)
- `list_leads` - List leads with optional filtering
- `get_lead` - Get a specific lead by ID
- `create_lead` - Create a new lead

#### Code Access
- `read_api_route` - Read a specific API route handler
- `read_prisma_model` - Extract a Prisma model definition
- `search_code` - Search for patterns in the codebase

#### Project Commands
- `exec_command` - Execute project commands (build, typecheck, lint, test, db:generate)

## Configuration

### Environment Variables

```bash
export HERMES_API_URL=https://hermes.ndlz.net
export HERMES_API_KEY=hms_821540f1e0971977622484d04492bb2cede73445
```

Or create a `.env` file in the mcp-server directory:
```
HERMES_API_URL=https://hermes.ndlz.net
HERMES_API_KEY=hms_821540f1e0971977622484d04492bb2cede73445
```

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hermes": {
      "command": "node",
      "args": ["/home/ubuntu/.openclaw/workspace/hermes/mcp-server/index.js"],
      "env": {
        "HERMES_API_URL": "https://hermes.ndlz.net",
        "HERMES_API_KEY": "hms_821540f1e0971977622484d04492bb2cede73445"
      }
    }
  }
}
```

### With OpenClaw

Add to OpenClaw config (if MCP support is available):

```json
{
  "mcp": {
    "servers": {
      "hermes": {
        "command": "node",
        "args": ["/home/ubuntu/.openclaw/workspace/hermes/mcp-server/index.js"],
        "cwd": "/home/ubuntu/.openclaw/workspace/hermes",
        "env": {
          "HERMES_API_URL": "https://hermes.ndlz.net",
          "HERMES_API_KEY": "hms_821540f1e0971977622484d04492bb2cede73445"
        }
      }
    }
  }
}
```

## Usage Examples

### List recent leads
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_leads",
    "arguments": {
      "limit": 10,
      "source": "linkedin"
    }
  }
}
```

### Create a new lead
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_lead",
    "arguments": {
      "source": "reddit",
      "sourceUrl": "https://reddit.com/r/forhire/...",
      "title": "Need React developer for crypto project",
      "company": "CryptoStartup Inc"
    }
  }
}
```

### Read Prisma Lead model
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "read_prisma_model",
    "arguments": {
      "model": "Lead"
    }
  }
}
```

### Read database schema
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/read",
  "params": {
    "uri": "hermes://db/schema"
  }
}
```

## Development

```bash
cd /home/ubuntu/.openclaw/workspace/hermes/mcp-server
npm install
npm start
```

## Security

- API access requires valid API key
- Only whitelisted commands can be executed
- Read-only access to codebase
- API calls go through Hermes API (no direct DB access)
- Timeout limits on all operations

## API Endpoints Used

- `GET /api/leads` - List leads
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create lead
- Other endpoints accessible via search_code tool

## Notes

- The server uses the production Hermes API by default
- All CRM operations are logged and tracked through the API
- Use read_prisma_model to understand data structures before creating leads
- Use search_code to find specific implementations or patterns
