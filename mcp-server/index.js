#!/usr/bin/env node
/**
 * Hermes MCP Server
 * Provides structured access to Hermes CRM project and API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Hermes API configuration
const HERMES_API_URL = process.env.HERMES_API_URL || 'https://hermes.ndlz.net';
const HERMES_API_KEY = process.env.HERMES_API_KEY || 'hms_821540f1e0971977622484d04492bb2cede73445';

// Initialize MCP server
const server = new Server(
  {
    name: 'hermes-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Helper: Read file with error handling
function readFile(relativePath) {
  try {
    const fullPath = join(PROJECT_ROOT, relativePath);
    return readFileSync(fullPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read ${relativePath}: ${error.message}`);
  }
}

// Helper: List directory recursively
function listDir(dir, baseDir = dir, extensions = []) {
  const files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(baseDir, fullPath);
      
      // Skip node_modules, .git, dist, .turbo
      if (['node_modules', '.git', 'dist', '.turbo', '.next'].includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        files.push(...listDir(fullPath, baseDir, extensions));
      } else if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(relativePath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

// Helper: Call Hermes API
async function callHermesAPI(endpoint, options = {}) {
  const url = `${HERMES_API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': HERMES_API_KEY,
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to call ${endpoint}: ${error.message}`);
  }
}

// Register resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'hermes://db/schema',
        name: 'Prisma Database Schema',
        description: 'Complete Prisma schema with all models',
        mimeType: 'text/plain',
      },
      {
        uri: 'hermes://api/routes',
        name: 'API Routes Structure',
        description: 'All API route handlers in the backend',
        mimeType: 'text/plain',
      },
      {
        uri: 'hermes://project/structure',
        name: 'Project Structure',
        description: 'Complete monorepo structure',
        mimeType: 'text/plain',
      },
      {
        uri: 'hermes://docs/deployment',
        name: 'Deployment Documentation',
        description: 'Deployment status and instructions',
        mimeType: 'text/markdown',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  if (uri === 'hermes://db/schema') {
    const schema = readFile('packages/db/prisma/schema.prisma');
    return {
      contents: [{
        uri,
        mimeType: 'text/plain',
        text: schema,
      }],
    };
  }
  
  if (uri === 'hermes://api/routes') {
    const routeFiles = listDir(join(PROJECT_ROOT, 'apps/api/src'), join(PROJECT_ROOT, 'apps/api/src'), ['.ts', '.tsx']);
    const routes = routeFiles.filter(f => f.includes('route') || f.includes('handler'));
    const content = routes.map(file => {
      try {
        const code = readFile(join('apps/api/src', file));
        return `\n// ${file}\n${code}`;
      } catch {
        return `\n// ${file}\n// (unreadable)`;
      }
    }).join('\n\n---\n');
    
    return {
      contents: [{
        uri,
        mimeType: 'text/plain',
        text: content || 'No route files found',
      }],
    };
  }
  
  if (uri === 'hermes://project/structure') {
    const files = listDir(PROJECT_ROOT, PROJECT_ROOT);
    const tree = files.map(f => `  ${f}`).join('\n');
    
    return {
      contents: [{
        uri,
        mimeType: 'text/plain',
        text: `Hermes Project Structure:\n\n${tree}`,
      }],
    };
  }
  
  if (uri === 'hermes://docs/deployment') {
    const content = readFile('DEPLOYMENT_STATUS.md');
    return {
      contents: [{
        uri,
        mimeType: 'text/markdown',
        text: content,
      }],
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_leads',
        description: 'List leads from Hermes CRM (via API)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of leads to fetch (default: 20)',
              default: 20,
            },
            source: {
              type: 'string',
              description: 'Filter by source (reddit, github, linkedin, etc.)',
            },
          },
        },
      },
      {
        name: 'get_lead',
        description: 'Get a specific lead by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Lead ID (cuid)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'create_lead',
        description: 'Create a new lead in Hermes',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Lead source',
            },
            sourceUrl: {
              type: 'string',
              description: 'URL where lead was found',
            },
            title: {
              type: 'string',
              description: 'Lead title/description',
            },
            email: {
              type: 'string',
              description: 'Email address (optional)',
            },
            company: {
              type: 'string',
              description: 'Company name (optional)',
            },
          },
          required: ['source', 'sourceUrl', 'title'],
        },
      },
      {
        name: 'read_api_route',
        description: 'Read a specific API route handler',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Route path relative to apps/api/src (e.g., "routes/leads.ts")',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'read_prisma_model',
        description: 'Extract a specific Prisma model definition',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Model name (e.g., "Lead", "User", "Organization")',
            },
          },
          required: ['model'],
        },
      },
      {
        name: 'exec_command',
        description: 'Execute a project command (build, typecheck, lint, test)',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Command to execute',
              enum: ['build', 'dev', 'typecheck', 'lint', 'test', 'db:generate'],
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'search_code',
        description: 'Search for a pattern in the codebase',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Search pattern (regex)',
            },
            path: {
              type: 'string',
              description: 'Path to search in (default: apps/)',
              default: 'apps/',
            },
          },
          required: ['pattern'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    if (name === 'list_leads') {
      const limit = args.limit || 20;
      const params = new URLSearchParams({ limit: limit.toString() });
      if (args.source) params.append('source', args.source);
      
      const data = await callHermesAPI(`/api/leads?${params}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }
    
    if (name === 'get_lead') {
      const data = await callHermesAPI(`/api/leads/${args.id}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }
    
    if (name === 'create_lead') {
      const data = await callHermesAPI('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          source: args.source,
          sourceUrl: args.sourceUrl,
          title: args.title,
          email: args.email,
          company: args.company,
        }),
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }
    
    if (name === 'read_api_route') {
      const routePath = join('apps/api/src', args.path);
      const content = readFile(routePath);
      return {
        content: [{ type: 'text', text: content }],
      };
    }
    
    if (name === 'read_prisma_model') {
      const schema = readFile('packages/db/prisma/schema.prisma');
      const modelRegex = new RegExp(`model ${args.model}\\s*{[^}]*}`, 's');
      const match = schema.match(modelRegex);
      
      if (!match) {
        throw new Error(`Model ${args.model} not found in schema`);
      }
      
      return {
        content: [{ type: 'text', text: match[0] }],
      };
    }
    
    if (name === 'exec_command') {
      const allowedCommands = {
        build: 'pnpm build',
        dev: 'pnpm dev',
        typecheck: 'pnpm typecheck',
        lint: 'pnpm lint',
        test: 'pnpm test',
        'db:generate': 'pnpm db:generate',
      };
      
      const cmd = allowedCommands[args.command];
      if (!cmd) {
        throw new Error(`Unknown command: ${args.command}`);
      }
      
      const { stdout, stderr } = await exec(cmd, { cwd: PROJECT_ROOT, timeout: 60000 });
      return {
        content: [{ 
          type: 'text', 
          text: `Command: ${cmd}\n\nStdout:\n${stdout}\n\nStderr:\n${stderr}` 
        }],
      };
    }
    
    if (name === 'search_code') {
      const searchPath = join(PROJECT_ROOT, args.path);
      const { stdout } = await exec(
        `grep -r "${args.pattern}" --include="*.ts" --include="*.tsx" . || true`,
        { cwd: searchPath, timeout: 30000 }
      );
      
      return {
        content: [{ type: 'text', text: stdout || 'No matches found' }],
      };
    }
    
    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hermes MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
