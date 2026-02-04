/**
 * Cold Outreach API Routes
 *
 * Provides email drafting and sending for leads:
 * - Generate personalized email drafts
 * - Send emails via Resend
 * - Track email status
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, MessageChannel, MessageDirection, MessageStatus } from "@hermes/db";
import type { AuthContext } from "../middleware/auth.js";

const outreach = new Hono<AuthContext>();

// Email templates for different scenarios
const TEMPLATES = {
  startup: {
    subject: "{company} - dev React freelance dispo",
    body: `Hey {firstName},

J'ai vu {observation} — ça a l'air prometteur.

Je suis dev freelance spécialisé React/TypeScript. J'aide des startups à shipper vite sans compromettre la qualité.

Si vous cherchez du renfort dev (court ou long terme), je serais dispo pour un quick call de 15 min.

— Nicolas`
  },
  hiring_post: {
    subject: "Re: {title}",
    body: `Hey {firstName},

J'ai vu ton post pour {role}.

Je suis dispo et mon stack match: React, TypeScript, Next.js, Web3/Solidity.

Quelques questions rapides:
- C'est du remote async OK ?
- Quelle timeline vous visez ?
- Budget range ?

Dispo pour un call si plus simple.

— Nicolas`
  },
  web3: {
    subject: "{company} - dev Solidity/React dispo",
    body: `Hey {firstName},

J'ai checké {product} — {observation}.

Je suis dev spécialisé Web3: Solidity, smart contracts, + frontend React/TypeScript.

Si vous avez besoin de renfort dev (audit, nouvelles features, frontend), je suis dispo pour discuter.

— Nicolas`
  },
  followup: {
    subject: "Re: {prevSubject}",
    body: `Hey {firstName},

Je relance juste au cas où mon message serait passé à la trappe.

Toujours dispo si vous cherchez du renfort dev React/TypeScript.

— Nicolas`
  }
};

// Detect template type from lead
function detectTemplateType(lead: any): keyof typeof TEMPLATES {
  const text = `${lead.title || ''} ${lead.description || ''} ${lead.source || ''}`.toLowerCase();
  
  if (text.includes('web3') || text.includes('solidity') || text.includes('blockchain')) {
    return 'web3';
  }
  if (text.includes('[hiring]') || text.includes('hiring')) {
    return 'hiring_post';
  }
  return 'startup';
}

// Extract first name from various formats
function extractFirstName(lead: any): string {
  if (lead.author) {
    // Reddit: u/username -> username
    const name = lead.author.replace(/^u\//, '').replace(/^@/, '');
    return name.split(/[_\s]/)[0] || 'there';
  }
  return 'there';
}

// Generate email draft for a lead
function generateEmailDraft(lead: any, templateType?: keyof typeof TEMPLATES) {
  const type = templateType || detectTemplateType(lead);
  const template = TEMPLATES[type];
  
  const firstName = extractFirstName(lead);
  const company = lead.company || lead.title?.split(/[-|]/)[0]?.trim() || 'your company';
  const observation = lead.description?.substring(0, 80) || 'votre projet';
  const title = lead.title || 'votre post';
  const product = lead.company || lead.title?.split(/[-|]/)[0]?.trim() || 'votre produit';
  const role = lead.title?.replace(/\[Hiring\]/gi, '').trim() || 'le poste';
  
  const replacements: Record<string, string> = {
    '{firstName}': firstName,
    '{company}': company,
    '{observation}': observation,
    '{title}': title,
    '{product}': product,
    '{role}': role,
    '{prevSubject}': title
  };
  
  let subject = template.subject;
  let body = template.body;
  
  for (const [key, value] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  
  return { subject, body, templateType: type };
}

// ============================================
// ROUTES
// ============================================

// GET /outreach/leads/:id/draft - Generate email draft
outreach.get("/leads/:id/draft", async (c) => {
  const { id } = c.req.param();
  const { orgId } = c.var;
  const templateType = c.req.query('template') as keyof typeof TEMPLATES | undefined;
  
  const lead = await db.lead.findFirst({
    where: { id, orgId },
    include: {
      messages: {
        where: { status: 'DRAFT', channel: 'EMAIL' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }
  
  // Return existing draft if any
  if (lead.messages.length > 0 && !templateType) {
    const draft = lead.messages[0];
    return c.json({
      id: draft.id,
      subject: draft.subject,
      body: draft.content,
      templateType: null,
      isExisting: true
    });
  }
  
  // Generate new draft
  const { subject, body, templateType: detectedType } = generateEmailDraft(lead, templateType);
  
  return c.json({
    subject,
    body,
    templateType: detectedType,
    recipientEmail: lead.email,
    recipientName: extractFirstName(lead),
    isExisting: false
  });
});

// POST /outreach/leads/:id/draft - Save email draft
const saveDraftSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  recipientEmail: z.string().email().optional()
});

outreach.post("/leads/:id/draft", zValidator("json", saveDraftSchema), async (c) => {
  const { id } = c.req.param();
  const { orgId } = c.var;
  const { subject, body, recipientEmail } = c.req.valid("json");
  
  const lead = await db.lead.findFirst({
    where: { id, orgId }
  });
  
  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }
  
  // Update lead email if provided
  if (recipientEmail && !lead.email) {
    await db.lead.update({
      where: { id },
      data: { email: recipientEmail }
    });
  }
  
  // Upsert draft message
  const existingDraft = await db.message.findFirst({
    where: { leadId: id, status: 'DRAFT', channel: 'EMAIL' }
  });
  
  if (existingDraft) {
    const updated = await db.message.update({
      where: { id: existingDraft.id },
      data: { subject, content: body }
    });
    return c.json(updated);
  }
  
  const message = await db.message.create({
    data: {
      leadId: id,
      channel: 'EMAIL',
      direction: 'OUTBOUND',
      subject,
      content: body,
      status: 'DRAFT'
    }
  });
  
  return c.json(message, 201);
});

// POST /outreach/leads/:id/send - Send email via Resend
const sendEmailSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  recipientEmail: z.string().email(),
  recipientName: z.string().optional()
});

outreach.post("/leads/:id/send", zValidator("json", sendEmailSchema), async (c) => {
  const { id } = c.req.param();
  const { orgId } = c.var;
  const { subject, body, recipientEmail, recipientName } = c.req.valid("json");
  
  const lead = await db.lead.findFirst({
    where: { id, orgId }
  });
  
  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }
  
  // Check for Resend API key
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return c.json({ error: "RESEND_API_KEY not configured" }, 500);
  }
  
  try {
    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'hermes@ndlz.net',
        to: recipientEmail,
        subject: subject,
        text: body,
        // Add reply-to for responses
        reply_to: process.env.RESEND_REPLY_TO || 'ndlz@pm.me'
      })
    });
    
    const result = await response.json() as { id?: string; message?: string };
    
    if (!response.ok) {
      console.error('Resend error:', result);
      return c.json({ error: result.message || 'Failed to send email' }, 500);
    }
    
    // Save sent message
    const message = await db.message.create({
      data: {
        leadId: id,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        subject,
        content: body,
        status: 'SENT',
        sentAt: new Date(),
        externalId: result.id || null
      }
    });
    
    // Update lead status
    await db.lead.update({
      where: { id },
      data: {
        email: recipientEmail,
        status: lead.status === 'NEW' || lead.status === 'QUALIFIED' ? 'CONTACTED' : lead.status,
        contactedAt: lead.contactedAt || new Date()
      }
    });
    
    // Delete any existing draft
    await db.message.deleteMany({
      where: { leadId: id, status: 'DRAFT', channel: 'EMAIL' }
    });
    
    return c.json({
      success: true,
      messageId: message.id,
      resendId: result.id || ''
    });
    
  } catch (error: any) {
    console.error('Send email error:', error);
    return c.json({ error: error.message || 'Failed to send email' }, 500);
  }
});

// GET /outreach/leads/:id/messages - Get all messages for a lead
outreach.get("/leads/:id/messages", async (c) => {
  const { id } = c.req.param();
  const { orgId } = c.var;
  
  const lead = await db.lead.findFirst({
    where: { id, orgId }
  });
  
  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }
  
  const messages = await db.message.findMany({
    where: { leadId: id },
    orderBy: { createdAt: 'desc' }
  });
  
  return c.json(messages);
});

// GET /outreach/templates - List available templates
outreach.get("/templates", async (c) => {
  const templates = Object.entries(TEMPLATES).map(([key, value]) => ({
    id: key,
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    subject: value.subject,
    preview: value.body.substring(0, 100) + '...'
  }));
  
  return c.json(templates);
});

export { outreach };
