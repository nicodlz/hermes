# Lead Enrichment - Email Finder

## Overview

The lead enrichment feature automatically finds email addresses for leads using Hunter.io API. This helps you quickly get contact information without manual research.

## Features

- ✅ One-click email finder button in lead detail page
- ✅ Automatic domain extraction from company name/website
- ✅ Name parsing (first/last name from author field)
- ✅ Logging of all enrichment attempts
- ✅ Rate limit protection (prevents duplicate requests within 24h)
- ✅ Confidence scoring
- ✅ Source tracking (manual vs enriched)

## Setup

### 1. Get a Hunter.io API Key (Free Tier)

1. Go to [Hunter.io](https://hunter.io/)
2. Sign up for a free account
3. Navigate to [API Keys](https://hunter.io/api-keys)
4. Copy your API key
5. **Note:** Free tier includes **25 requests/month** (no credit card required)

### 2. Configure Environment Variable

Add the API key to your `.env` file:

```bash
# Enrichment APIs
HUNTER_API_KEY=your_hunter_api_key_here
```

### 3. Restart API Server

```bash
cd apps/api
pnpm dev
```

## Usage

### From UI

1. Open a lead detail page
2. If no email exists, you'll see a "Find Email" button in the Contact Info section
3. Click the button to trigger enrichment
4. Results appear immediately:
   - ✅ Email found → automatically saved to lead
   - ❌ Not found → error message shown
   - ⏱️ Rate limited → try again in 24h

### From API

```bash
curl -X POST https://hermes.ndlz.net/api/leads/:id/enrich \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response (success):**
```json
{
  "success": true,
  "email": "john@example.com",
  "confidence": 95,
  "source": "hunter.io"
}
```

**Response (not found):**
```json
{
  "success": false,
  "message": "No email found",
  "source": "hunter.io"
}
```

**Response (error):**
```json
{
  "error": "Cannot enrich: no company domain available"
}
```

## How It Works

### 1. Domain Extraction
The system extracts domain from:
- Lead's `company` field (e.g., "Acme Corp" → "acme.com")
- Lead's `website` field (e.g., "https://acme.com" → "acme.com")
- Author URL (if not social media)

### 2. Name Parsing
Extracts first/last name from lead's `author` field:
- "John Doe" → firstName: "John", lastName: "Doe"
- "Alice" → firstName: "Alice", lastName: ""

### 3. Hunter.io API Call
Calls Hunter.io Email Finder API:
```
GET https://api.hunter.io/v2/email-finder
  ?domain=acme.com
  &first_name=John
  &last_name=Doe
  &api_key=YOUR_KEY
```

### 4. Result Storage
- Updates `Lead.email`, `Lead.emailSource`, `Lead.emailEnrichedAt`
- Logs attempt in `EnrichmentLog` table
- Prevents duplicate requests within 24 hours

## Database Schema

### Lead Table Updates
```prisma
model Lead {
  email           String?
  emailSource     String?     // "hunter.io", "manual", "scraped"
  emailEnrichedAt DateTime?
  enrichments     EnrichmentLog[]
}
```

### EnrichmentLog Table
```prisma
model EnrichmentLog {
  id          String   @id
  leadId      String
  provider    String   // "hunter.io"
  status      String   // "success", "not_found", "rate_limited", "error"
  emailFound  String?
  confidence  Int?     // 0-100
  result      String?  // Full JSON response
  createdAt   DateTime
}
```

## Rate Limits

### Hunter.io Free Tier
- **25 requests/month**
- No credit card required
- Resets monthly

### Protection Mechanisms
1. **24h cooldown**: Prevents duplicate enrichment of same lead within 24 hours
2. **Logging**: All attempts logged to track usage
3. **Error handling**: Rate limit errors return 429 status

### Monitoring Usage

Check your remaining quota:
```bash
curl https://api.hunter.io/v2/account?api_key=YOUR_KEY
```

View enrichment logs:
```sql
SELECT * FROM EnrichmentLog 
WHERE createdAt > datetime('now', '-30 days')
ORDER BY createdAt DESC;
```

## Troubleshooting

### "HUNTER_API_KEY not configured"
- Ensure `.env` file has `HUNTER_API_KEY=...`
- Restart API server after adding key

### "Cannot enrich: no company domain available"
- Lead must have `company` or `website` field populated
- Manually add company name before enriching

### "Cannot enrich: no author name available"
- Lead must have `author` field populated
- Manually add contact name before enriching

### "Rate limit exceeded"
- Free tier: 25 requests/month
- Wait for monthly reset or upgrade plan
- Check usage: `SELECT COUNT(*) FROM EnrichmentLog WHERE status='success' AND createdAt > datetime('now', '-30 days')`

### "No email found"
- Hunter.io couldn't find email for this person/company
- Try alternative: LinkedIn, manual research, other tools
- Check if domain is correct (typos, .com vs .io, etc.)

## Future Enhancements

- [ ] Add Tomba.io as fallback provider (50 free searches/month)
- [ ] LinkedIn scraping integration
- [ ] Bulk enrichment for multiple leads
- [ ] Email verification (check deliverability)
- [ ] Alternative email pattern guessing (firstname.lastname@domain.com)
- [ ] Phone number enrichment
- [ ] Company data enrichment (size, industry, funding)

## Alternatives to Hunter.io

If you need more free quota:

1. **Tomba.io** - 50 free searches/month, no CC required
2. **Derrick App** - 200 credits/month permanently free
3. **Snov.io** - 50 credits/month free tier
4. **Apollo.io** - 10,000 credits/year free tier

To switch providers, modify `apps/api/src/lib/enrichment.ts`.
