# Hermes Deployment Guide

## Coolify Setup

### 1. Create Application

1. Go to https://coolify.ndlz.net
2. Create new application → GitHub repository
3. Select `nicodlz/hermes`
4. Build pack: **Dockerfile**
5. Port: **3001**

### 2. Environment Variables

Configure these in Coolify → Application → Environment Variables:

```env
# Required
DATABASE_URL=file:/app/data/hermes.db

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=hermes@ndlz.net

# App URL (for magic links)
APP_URL=https://hermes.ndlz.net

# Admin API (for creating users/API keys)
# Generate with: openssl rand -hex 32
ADMIN_SECRET=<generate-a-secret>
```

### 3. Persistent Storage

Add volume mount:
- Source: `hermes-data`
- Destination: `/app/data`

This persists the SQLite database between deployments.

### 4. Domain

Configure domain: `hermes.ndlz.net`

### 5. Auto Deploy

Enable "Auto Deploy" for automatic deployments on push to main.

## Post-Deployment Setup

After first deployment, create the initial user and API key:

### Option A: Using the setup script

```bash
export ADMIN_SECRET="your-admin-secret"
./scripts/setup-production.sh
```

### Option B: Using curl

```bash
# Create user
curl -X POST https://hermes.ndlz.net/api/admin/users \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"ndlz@pm.me","name":"Nicolas","orgName":"Nicolas"}'

# Create API key for Atlas
curl -X POST https://hermes.ndlz.net/api/admin/api-keys \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"ndlz@pm.me","name":"Atlas Agent"}'
```

**Important:** Save the API key returned - it's only shown once!

## Using the API Key

### With curl

```bash
curl https://hermes.ndlz.net/api/leads \
  -H "X-API-Key: hms_xxxxxxxxxxxx"
```

### With OpenClaw/Atlas

Add to your agent configuration:

```yaml
hermes:
  url: https://hermes.ndlz.net
  headers:
    X-API-Key: hms_xxxxxxxxxxxx
```

## Magic Link Authentication (Web UI)

1. Go to https://hermes.ndlz.net/login
2. Enter your email
3. Check inbox for magic link
4. Click link to login (creates 30-day session)

## Troubleshooting

### Email not sending

Check RESEND_API_KEY is set correctly:
```bash
curl -X POST https://hermes.ndlz.net/api/admin/status \
  -H "X-Admin-Secret: $ADMIN_SECRET"
```

Look for `resendConfigured: true`.

### Admin API returns 503

ADMIN_SECRET not configured. Add it to environment variables.

### Database reset on redeploy

Volume not mounted. Ensure `/app/data` is a persistent volume.
