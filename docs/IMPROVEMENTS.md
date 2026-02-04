# Hermes CRM — Proposed Improvements

> Atlas's research notes — Feb 2026

## Based on 2025 B2B Sales Research

### 1. Multi-Stakeholder Tracking (High Priority)

**Problem:** Modern B2B deals involve 10-11 stakeholders on average. Current schema tracks one lead = one contact.

**Proposed Solution:** Add `Contact` model to track multiple people per lead.

```prisma
model Contact {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  name      String
  email     String?
  phone     String?
  role      String?  // CTO, PM, Founder, Finance, etc.
  channel   String?  // Preferred contact channel
  
  // Engagement tracking
  lastTouchAt DateTime?
  touchCount  Int      @default(0)
  sentiment   String?  // positive, neutral, negative
  
  isPrimary   Boolean  @default(false)  // Main champion
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Benefits:**
- Track all stakeholders per deal
- Monitor engagement per person
- Identify at-risk deals (only one contact engaged)
- Better handoff to AE with full committee map

### 2. Objection Tracking

**Problem:** Can't analyze common objections across leads.

**Proposed Solution:** Add objection tagging to notes.

```typescript
// In leads.ts — Add objection field to notes
const noteSchema = z.object({
  content: z.string(),
  type: z.enum(["MANUAL", "AI_ANALYSIS", "AI_RESEARCH", "SYSTEM"]),
  objection: z.enum([
    "BUDGET", "TIMING", "COMPETITION", 
    "INTERNAL", "TRUST", "SCOPE"
  ]).optional(),
});
```

**Benefits:**
- Identify most common objections
- Improve messaging based on patterns
- Track objection resolution rates

### 3. Template Performance Dashboard

**Problem:** Template model has `replyRate` but no automated tracking.

**Proposed Solution:** Auto-update template stats when message status changes.

```typescript
// In messages route — on reply detected
if (data.status === "REPLIED" && existing.templateId) {
  await db.template.update({
    where: { id: existing.templateId },
    data: { 
      usageCount: { increment: 1 },
      // Recalculate reply rate...
    }
  });
}
```

### 4. Buying Signal Detection

**Problem:** No automated way to flag "hot" leads based on behavior.

**Proposed Solution:** Add computed `heatScore` based on engagement.

Factors:
- Multiple stakeholders engaged (+20)
- Quick response time (+15)
- Asked about pricing (+10)
- Clicked proposal link (+10)
- Second response (+10)
- Went cold after interest (-15)

### 5. Pipeline Velocity Metrics

Add to stats dashboard:
- Average days per stage
- Conversion rate per stage
- Stuck deals (no movement in X days)
- Win rate by source
- Average deal value by source

### 6. AI Integration Points

**Current:** Notes can be AI-generated.

**Add:**
- Auto-qualify leads on import (AI scoring)
- Auto-draft first message based on lead content
- Auto-research company/person before outreach
- Suggest next best action per lead

---

## Quick Wins (No Schema Changes)

### A. Improve Lead Scoring API

Add endpoint to bulk-rescore leads with current algorithm:

```
POST /api/leads/rescore
```

### B. Add Stale Lead Detection

Flag leads with no activity in 7+ days:

```
GET /api/leads?stale=true
```

### C. Template Variable Preview

Preview template with lead data before sending:

```
POST /api/templates/:id/preview
Body: { leadId: "..." }
```

---

## Implementation Priority

1. **Multi-stakeholder tracking** — Biggest impact on win rate
2. **Template performance** — Data-driven optimization
3. **Stale lead detection** — Low effort, high value
4. **Objection tracking** — Pattern recognition
5. **Buying signals** — Advanced, phase 2

---

*These improvements align with 2025 SDR best practices. Happy to implement any of these with Nicolas's approval.*
