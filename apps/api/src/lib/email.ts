/**
 * Email Service
 * 
 * Sends emails via Resend API
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "hermes@ndlz.net";
const APP_URL = process.env.APP_URL || "https://hermes.ndlz.net";

export interface MagicLinkEmailOptions {
  to: string;
  token: string;
  isNewUser: boolean;
}

/**
 * Send a magic link email for authentication
 */
export async function sendMagicLinkEmail({ to, token, isNewUser }: MagicLinkEmailOptions): Promise<void> {
  const magicLink = `${APP_URL}/auth/verify?token=${token}`;
  
  const subject = isNewUser 
    ? "Welcome to Hermes - Confirm your account"
    : "Sign in to Hermes";
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <span style="font-size: 32px;">⚡</span>
    <h1 style="margin: 10px 0 0; color: #1e293b; font-size: 24px;">Hermes</h1>
  </div>
  
  <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 20px;">
      ${isNewUser ? "Welcome to Hermes!" : "Sign in to your account"}
    </h2>
    <p style="margin: 0 0 20px; color: #64748b;">
      ${isNewUser 
        ? "Click the button below to confirm your account and get started."
        : "Click the button below to sign in to your account."}
    </p>
    <a href="${magicLink}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
      ${isNewUser ? "Confirm Account" : "Sign In"}
    </a>
  </div>
  
  <p style="color: #94a3b8; font-size: 14px; margin: 0;">
    This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  
  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
    Can't click the button? Copy and paste this link:<br>
    <a href="${magicLink}" style="color: #64748b; word-break: break-all;">${magicLink}</a>
  </p>
</body>
</html>
  `.trim();

  const text = `
${isNewUser ? "Welcome to Hermes!" : "Sign in to Hermes"}

${isNewUser 
  ? "Click the link below to confirm your account and get started:"
  : "Click the link below to sign in to your account:"}

${magicLink}

This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
  `.trim();

  // In development without API key, just log the link
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Magic link for ${to}: ${magicLink}`);
    console.log(`[DEV] Token: ${token}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Verify email service is configured
 */
export async function verifyEmailConnection(): Promise<boolean> {
  return !!process.env.RESEND_API_KEY;
}
