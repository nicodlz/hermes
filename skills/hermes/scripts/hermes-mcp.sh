#!/bin/bash
# Hermes CRM MCP Wrapper - Uses MCP server for operations

MCP_SERVER="${MCP_SERVER:-/home/ubuntu/.openclaw/workspace/hermes/mcp-server/index.js}"
HERMES_API_URL="${HERMES_API_URL:-https://hermes.ndlz.net}"
HERMES_API_KEY="${HERMES_API_KEY:-hms_821540f1e0971977622484d04492bb2cede73445}"

export HERMES_API_URL
export HERMES_API_KEY

# Helper: Call MCP tool
call_mcp_tool() {
    local tool_name="$1"
    local arguments="$2"
    
    local request=$(jq -n \
        --arg tool "$tool_name" \
        --argjson args "$arguments" \
        '{
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: $tool,
                arguments: $args
            }
        }')
    
    echo "$request" | node "$MCP_SERVER" 2>/dev/null | jq -r '.result.content[0].text'
}

# Helper: Read MCP resource
read_mcp_resource() {
    local uri="$1"
    
    local request=$(jq -n \
        --arg uri "$uri" \
        '{
            jsonrpc: "2.0",
            id: 1,
            method: "resources/read",
            params: {
                uri: $uri
            }
        }')
    
    echo "$request" | node "$MCP_SERVER" 2>/dev/null | jq -r '.result.contents[0].text'
}

usage() {
    echo "Usage: hermes-mcp.sh <command> [options]"
    echo ""
    echo "Commands (via MCP):"
    echo "  leads [limit] [source]  List leads"
    echo "  lead <id>               Get lead details"
    echo "  create <source> <url> <title>  Create new lead"
    echo "  schema                  Show database schema"
    echo "  model <name>            Show Prisma model (e.g., Lead, User)"
    echo "  route <path>            Read API route handler"
    echo "  search <pattern>        Search code for pattern"
    echo "  structure               Show project structure"
    echo ""
    exit 1
}

case "$1" in
    leads)
        limit="${2:-20}"
        source="$3"
        if [ -n "$source" ]; then
            args=$(jq -n --arg limit "$limit" --arg source "$source" '{limit: ($limit|tonumber), source: $source}')
        else
            args=$(jq -n --arg limit "$limit" '{limit: ($limit|tonumber)}')
        fi
        call_mcp_tool "list_leads" "$args" | jq
        ;;
    lead)
        [ -z "$2" ] && echo "Error: lead ID required" && exit 1
        args=$(jq -n --arg id "$2" '{id: $id}')
        call_mcp_tool "get_lead" "$args" | jq
        ;;
    create)
        [ -z "$2" ] && echo "Error: source required" && exit 1
        [ -z "$3" ] && echo "Error: sourceUrl required" && exit 1
        [ -z "$4" ] && echo "Error: title required" && exit 1
        args=$(jq -n \
            --arg source "$2" \
            --arg url "$3" \
            --arg title "$4" \
            '{source: $source, sourceUrl: $url, title: $title}')
        call_mcp_tool "create_lead" "$args" | jq
        ;;
    schema)
        read_mcp_resource "hermes://db/schema"
        ;;
    model)
        [ -z "$2" ] && echo "Error: model name required" && exit 1
        args=$(jq -n --arg model "$2" '{model: $model}')
        call_mcp_tool "read_prisma_model" "$args"
        ;;
    route)
        [ -z "$2" ] && echo "Error: route path required" && exit 1
        args=$(jq -n --arg path "$2" '{path: $path}')
        call_mcp_tool "read_api_route" "$args"
        ;;
    search)
        [ -z "$2" ] && echo "Error: search pattern required" && exit 1
        args=$(jq -n --arg pattern "$2" '{pattern: $pattern}')
        call_mcp_tool "search_code" "$args"
        ;;
    structure)
        read_mcp_resource "hermes://project/structure" | head -50
        ;;
    *)
        usage
        ;;
esac
