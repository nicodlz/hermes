# Lead Enrichment - Quick Start Guide

## ✅ What Was Implemented

### Backend (API)
1. **New endpoint**: `POST /api/leads/:id/enrich`
   - Extracts domain from company/website
   - Parses name from author field
   - Calls Hunter.io Email Finder API
   - Updates lead with email + source + timestamp
   - Logs all attempts in database

2. **New library**: `apps/api/src/lib/enrichment.ts`
   - `findEmailWithHunter()` - Hunter.io integration
   - `extractDomain()` - Smart domain extraction
   - `parseName()` - Name parsing (first/last)
   - `extractLinkedInUsername()` - LinkedIn URL parsing

3. **Database changes**: `packages/db/prisma/schema.prisma`
   - Added `Lead.emailSource` (string)
   - Added `Lead.emailEnrichedAt` (datetime)
   - Created `EnrichmentLog` table for audit trail

### Frontend (UI)
1. **Button in LeadDetail page**
   - "Find Email" button appears when no email exists
   - Shows loading spinner while enriching
   - Auto-updates lead data on success
   - Displays error/success alerts

2. **Enhanced display**
   - Shows email source (hunter.io, manual, etc.)
   - Shows enrichment date
   - Small text under email field

### Documentation
- `docs/ENRICHMENT.md` - Full documentation
- `docs/ENRICHMENT_QUICKSTART.md` - This file

## 🚀 How to Test

### Prerequisites
1. Get a free Hunter.io API key:
   - Visit https://hunter.io/
   - Sign up (no credit card required)
   - Go to https://hunter.io/api-keys
   - Copy your API key

2. Add to `.env` file:
   ```bash
   HUNTER_API_KEY=your_key_here
   ```

3. Restart API server:
   ```bash
   cd apps/api
   pnpm dev
   ```

### Test Flow

#### 1. Create a test lead (or use existing)
Make sure lead has:
- **Company name** (e.g., "Stripe", "GitHub", "Shopify")
- **Author name** (e.g., "John Doe", "Patrick Collison")

Example via API:
```bash
curl -X POST https://hermes.ndlz.net/api/leads \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "sourceUrl": "https://example.com/test",
    "title": "Test Lead for Enrichment",
    "author": "Patrick Collison",
    "company": "Stripe",
    "score": 50
  }'
```

#### 2. Open lead detail page
Navigate to: `https://hermes.ndlz.net/leads/:id`

#### 3. Click "Find Email" button
- Button visible in "Contact Info" section
- Spinner appears while searching
- Result shown via alert

#### 4. Check database logs
```sql
-- View enrichment attempts
SELECT * FROM EnrichmentLog 
ORDER BY createdAt DESC 
LIMIT 10;

-- Check lead was updated
SELECT id, author, company, email, emailSource, emailEnrichedAt 
FROM Lead 
WHERE email IS NOT NULL;
```

### Expected Results

**✅ Success scenario:**
```
Alert: "✅ Email found: patrick@stripe.com
        Confidence: 95%
        Source: hunter.io"

Lead updated with:
- email = "patrick@stripe.com"
- emailSource = "hunter.io"
- emailEnrichedAt = "2026-02-04T12:30:00Z"
```

**❌ No email found:**
```
Alert: "❌ No email found"
(Still logged in EnrichmentLog with status="not_found")
```

**⚠️ Missing data:**
```
Alert: "❌ Error: Cannot enrich: no company domain available"
(Need to add company field first)
```

**⏱️ Rate limit (24h cooldown):**
```
Alert: "❌ Error: Lead was already enriched in the last 24 hours"
(Prevents duplicate API calls)
```

## 📊 Monitoring Usage

### Check Hunter.io quota
```bash
curl "https://api.hunter.io/v2/account?api_key=YOUR_KEY"
```

Response shows:
```json
{
  "data": {
    "requests": {
      "searches": {
        "used": 5,
        "available": 25  // Free tier limit
      }
    }
  }
}
```

### Check local enrichment logs
```sql
-- Count enrichments this month
SELECT 
  status,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM EnrichmentLog 
WHERE createdAt > datetime('now', '-30 days')
GROUP BY status;

-- Recent enrichments with results
SELECT 
  l.author,
  l.company,
  el.emailFound,
  el.confidence,
  el.status,
  el.createdAt
FROM EnrichmentLog el
JOIN Lead l ON l.id = el.leadId
ORDER BY el.createdAt DESC
LIMIT 20;
```

## 🔧 Troubleshooting

### Button not appearing?
- Check if lead already has email (button only shows when email is empty)
- Try refreshing the page

### "HUNTER_API_KEY not configured" error?
1. Check `.env` file exists in project root
2. Verify `HUNTER_API_KEY=...` is set
3. Restart API server: `cd apps/api && pnpm dev`

### "Cannot enrich: no company domain available"
1. Edit lead and add Company field
2. OR add Website field
3. Domain will be auto-extracted

### "No email found" but you know email exists?
Possible reasons:
- Hunter.io doesn't have data for this person/company
- Name/domain mismatch
- Email uses non-standard pattern
- Company uses alias domain

Try:
- Verify company domain is correct (e.g., "stripe.com" not "stripe.net")
- Check name spelling
- Add email manually if you found it elsewhere

### Rate limit exceeded (429 error)?
- Free tier: 25 requests/month
- Check usage: `curl "https://api.hunter.io/v2/account?api_key=YOUR_KEY"`
- Wait for monthly reset OR upgrade plan
- Alternative: manually add emails

## 🎯 Next Steps

After testing:
1. **Add real Hunter.io API key** to production `.env`
2. **Monitor usage** to stay within free tier (25/month)
3. **Document in team wiki** how to use feature
4. **Optional**: Add other providers (Tomba.io, Apollo.io) for more quota

## 🔐 Security Notes

- ✅ API key stored in `.env` (not committed to git)
- ✅ Server-side only (not exposed to frontend)
- ✅ Organization-scoped (users can only enrich own leads)
- ✅ Rate limiting (24h cooldown prevents abuse)
- ✅ Audit trail (all attempts logged)

## 📈 Future Improvements (Not Implemented Yet)

- [ ] Bulk enrichment (enrich 10+ leads at once)
- [ ] Email verification (check if email is deliverable)
- [ ] Fallback to Tomba.io if Hunter fails
- [ ] LinkedIn profile scraping
- [ ] Phone number enrichment
- [ ] Company data enrichment (employee count, funding, etc.)
- [ ] Auto-enrichment on lead creation
- [ ] Weekly enrichment quota reports

---

**Questions?** Check full docs: `docs/ENRICHMENT.md`
