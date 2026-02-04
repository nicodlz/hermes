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

// Email templates based on sales best practices
// Short subjects (< 7 words), personal tone, specific references, single CTA
const TEMPLATES = {
  // For generic startup/company leads
  startup: {
    subject: "Quick question about {company}",
    body: `Hey {firstName},

Saw {observation} — looks like you're building something interesting.

I'm a freelance dev specializing in React/TypeScript. Helped a few startups ship faster without cutting corners.

Worth a quick 15-min chat to see if I can help?

— Nicolas`
  },
  
  // For hiring posts (Reddit, HN, etc.)
  hiring_post: {
    subject: "Re: {title}",
    body: `Hey {firstName},

Your post caught my eye — especially {observation}.

I specialize in exactly that stack: React, TypeScript, Next.js.

Quick questions:
- Remote async OK?
- Timeline you're targeting?

Happy to jump on a quick call if easier.

— Nicolas`
  },
  
  // For Web3/blockchain projects
  web3: {
    subject: "Saw {company} — quick question",
    body: `Hey {firstName},

Checked out {product} — {observation}.

I do Web3 full-stack: Solidity smart contracts + React/TypeScript frontend.

If you need dev help (audits, new features, frontend), happy to chat.

— Nicolas`
  },
  
  // For technical/specific problem posts
  problem_solver: {
    subject: "{problem} → might have a fix",
    body: `Hey {firstName},

Saw you're dealing with {observation}. Been there.

Built something similar recently — solved it with {solution}. Happy to share what worked.

15 min call if you want to dig in?

— Nicolas`
  },
  
  // First follow-up (3-5 days after)
  followup_1: {
    subject: "Re: {prevSubject}",
    body: `Hey {firstName},

Following up in case my last message got buried.

Still around if you need React/TypeScript help. No worries if timing's not right.

— Nicolas`
  },
  
  // Second follow-up / breakup (7-10 days after)
  followup_2: {
    subject: "Closing the loop",
    body: `Hey {firstName},

Last ping from me — I'll assume the timing isn't right.

If things change down the road, feel free to reach out. Good luck with {company}!

— Nicolas`
  },
  
  // Ultra-short for high volume
  short: {
    subject: "{role} help?",
    body: `Hey {firstName},

Saw you need a {stack} dev. That's my specialty.

Recent work: built production React/TypeScript apps for startups.

Open to chat?

— Nicolas`
  }
};

// Detect template type from lead
function detectTemplateType(lead: any): keyof typeof TEMPLATES {
  const text = `${lead.title || ''} ${lead.description || ''} ${lead.source || ''}`.toLowerCase();
  
  // Web3/blockchain specific
  if (text.includes('web3') || text.includes('solidity') || text.includes('blockchain') || 
      text.includes('smart contract') || text.includes('defi') || text.includes('nft')) {
    return 'web3';
  }
  
  // Problem-solving (bug, issue, stuck, help needed)
  if (text.includes('stuck') || text.includes('issue') || text.includes('bug') || 
      text.includes('problem') || text.includes('help needed') || text.includes('struggling')) {
    return 'problem_solver';
  }
  
  // Hiring posts
  if (text.includes('[hiring]') || text.includes('hiring') || text.includes('looking for') ||
      text.includes('need a dev') || text.includes('seeking freelancer')) {
    return 'hiring_post';
  }
  
  // Default to startup template
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

// Extract key info from description
function extractObservation(description: string | null, maxLen = 60): string {
  if (!description) return 'your project';
  // Try to get the first meaningful sentence
  const firstSentence = description.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= maxLen) {
    return firstSentence.toLowerCase();
  }
  return description.substring(0, maxLen).trim() + '...';
}

// Detect stack from description
function extractStack(description: string | null): string {
  if (!description) return 'React/TypeScript';
  const text = description.toLowerCase();
  const stacks: string[] = [];
  
  if (text.includes('react')) stacks.push('React');
  if (text.includes('typescript') || text.includes('ts')) stacks.push('TypeScript');
  if (text.includes('next') || text.includes('nextjs')) stacks.push('Next.js');
  if (text.includes('node')) stacks.push('Node.js');
  if (text.includes('solidity')) stacks.push('Solidity');
  if (text.includes('web3')) stacks.push('Web3');
  
  return stacks.length > 0 ? stacks.slice(0, 3).join('/') : 'React/TypeScript';
}

// Generate email draft for a lead
function generateEmailDraft(lead: any, templateType?: keyof typeof TEMPLATES) {
  const type = templateType || detectTemplateType(lead);
  const template = TEMPLATES[type];
  
  const firstName = extractFirstName(lead);
  const company = lead.company || lead.title?.split(/[-|:]/)[0]?.trim() || 'your project';
  const observation = extractObservation(lead.description);
  const title = lead.title || 'your post';
  const product = lead.company || lead.title?.split(/[-|:]/)[0]?.trim() || 'your product';
  const role = lead.title?.replace(/\[Hiring\]/gi, '').replace(/\[.*?\]/g, '').trim() || 'the role';
  const stack = extractStack(lead.description);
  const problem = lead.title?.replace(/\[.*?\]/g, '').trim() || 'this challenge';
  
  const replacements: Record<string, string> = {
    '{firstName}': firstName,
    '{company}': company,
    '{observation}': observation,
    '{title}': title,
    '{product}': product,
    '{role}': role,
    '{stack}': stack,
    '{problem}': problem,
    '{solution}': 'a custom approach', // Generic, user should personalize
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
