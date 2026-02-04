#!/bin/bash
# Hermes Production Setup Script
# 
# After deploying to Coolify, run this to create initial user and API key
#
# Prerequisites:
# 1. RESEND_API_KEY configured in Coolify
# 2. ADMIN_SECRET configured in Coolify
#
# Usage:
#   ./setup-production.sh

set -e

APP_URL="${APP_URL:-https://hermes.ndlz.net}"
ADMIN_SECRET="${ADMIN_SECRET:?ADMIN_SECRET environment variable required}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 Hermes Production Setup"
echo "=========================="
echo ""

# Check API is accessible
echo -n "Checking API health... "
if curl -s "$APP_URL/health" | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ API not responding${NC}"
    exit 1
fi

# Check admin status
echo -n "Checking admin API... "
STATUS=$(curl -s -H "X-Admin-Secret: $ADMIN_SECRET" "$APP_URL/api/admin/status")
if echo "$STATUS" | grep -q "adminConfigured"; then
    echo -e "${GREEN}✓${NC}"
    echo "$STATUS" | jq .
else
    echo -e "${RED}✗ Admin API not configured${NC}"
    exit 1
fi

# Create Nicolas user
echo ""
echo "Creating user: ndlz@pm.me with org 'Nicolas'..."
USER_RESULT=$(curl -s -X POST "$APP_URL/api/admin/users" \
    -H "X-Admin-Secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"email":"ndlz@pm.me","name":"Nicolas","orgName":"Nicolas"}')

if echo "$USER_RESULT" | grep -q '"id"'; then
    echo -e "${GREEN}✓ User created/found${NC}"
    echo "$USER_RESULT" | jq .
else
    echo -e "${RED}✗ Failed to create user${NC}"
    echo "$USER_RESULT"
    exit 1
fi

# Create API key for Atlas
echo ""
echo "Creating API key 'Atlas Agent' for ndlz@pm.me..."
KEY_RESULT=$(curl -s -X POST "$APP_URL/api/admin/api-keys" \
    -H "X-Admin-Secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"email":"ndlz@pm.me","name":"Atlas Agent"}')

if echo "$KEY_RESULT" | grep -q '"key"'; then
    echo -e "${GREEN}✓ API key created${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  SAVE THIS KEY - IT WILL ONLY BE SHOWN ONCE!${NC}"
    echo ""
    echo "$KEY_RESULT" | jq .
else
    echo -e "${RED}✗ Failed to create API key${NC}"
    echo "$KEY_RESULT"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Save the API key above"
echo "2. Configure Atlas with: X-API-Key: <your_key>"
echo "3. Test: curl -H 'X-API-Key: <key>' $APP_URL/api/leads"
