#!/bin/bash
# Hermes CRM CLI - Wrapper for common operations

HERMES_API_URL="${HERMES_API_URL:-https://hermes.ndlz.net}"

usage() {
    echo "Usage: hermes-cli.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  digest          Get daily digest"
    echo "  actions         Get next actions for AI agent"
    echo "  leads [status]  List leads (optional status filter)"
    echo "  lead <id>       Get lead details"
    echo "  qualify <id> <score> <reasons...>  Qualify a lead"
    echo "  stats           Get dashboard stats"
    echo "  funnel          Get conversion funnel"
    echo "  tasks           List pending tasks"
    echo "  complete <id>   Complete a task"
    echo ""
    exit 1
}

case "$1" in
    digest)
        curl -s "$HERMES_API_URL/api/ai/digest" | jq
        ;;
    actions)
        curl -s "$HERMES_API_URL/api/ai/next-actions" | jq
        ;;
    leads)
        if [ -n "$2" ]; then
            curl -s "$HERMES_API_URL/api/leads?status=$2" | jq '.leads'
        else
            curl -s "$HERMES_API_URL/api/leads" | jq '.leads'
        fi
        ;;
    lead)
        [ -z "$2" ] && echo "Error: lead ID required" && exit 1
        curl -s "$HERMES_API_URL/api/leads/$2" | jq
        ;;
    qualify)
        [ -z "$2" ] && echo "Error: lead ID required" && exit 1
        [ -z "$3" ] && echo "Error: score required" && exit 1
        shift 2
        score="$1"
        shift
        reasons=$(printf '%s\n' "$@" | jq -R . | jq -s .)
        curl -s -X POST "$HERMES_API_URL/api/ai/qualify/$2" \
            -H "Content-Type: application/json" \
            -d "{\"score\": $score, \"reasons\": $reasons}" | jq
        ;;
    stats)
        curl -s "$HERMES_API_URL/api/stats/dashboard" | jq
        ;;
    funnel)
        curl -s "$HERMES_API_URL/api/stats/funnel" | jq
        ;;
    tasks)
        curl -s "$HERMES_API_URL/api/tasks/pending" | jq
        ;;
    complete)
        [ -z "$2" ] && echo "Error: task ID required" && exit 1
        curl -s -X POST "$HERMES_API_URL/api/tasks/$2/complete" | jq
        ;;
    *)
        usage
        ;;
esac
