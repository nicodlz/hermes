#!/bin/bash
# Test script for Hermes MCP Server

echo "Testing Hermes MCP Server..."
echo ""

export HERMES_API_URL=https://hermes.ndlz.net
export HERMES_API_KEY=hms_821540f1e0971977622484d04492bb2cede73445

# Test 1: List resources
echo "=== Test 1: List resources ==="
echo '{"jsonrpc": "2.0", "id": 1, "method": "resources/list"}' | node index.js 2>/dev/null | jq '.'

echo ""
echo "=== Test 2: List tools ==="
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}' | node index.js 2>/dev/null | jq '.result.tools[].name'

echo ""
echo "=== Test 3: Read Prisma schema (first 50 lines) ==="
echo '{"jsonrpc": "2.0", "id": 3, "method": "resources/read", "params": {"uri": "hermes://db/schema"}}' | node index.js 2>/dev/null | jq -r '.result.contents[0].text' | head -50

echo ""
echo "=== Test 4: Read Lead model ==="
echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "read_prisma_model", "arguments": {"model": "Lead"}}}' | node index.js 2>/dev/null | jq -r '.result.content[0].text'

echo ""
echo "=== Test 5: List recent leads (via API) ==="
echo '{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "list_leads", "arguments": {"limit": 5}}}' | node index.js 2>/dev/null | jq '.'

echo ""
echo "Done!"
