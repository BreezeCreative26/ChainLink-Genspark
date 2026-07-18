import "server-only";

import { Resend } from "resend";

/**
 * Thin wrapper around Resend for the app's only transactional email so
 * far: chain invitations. Kept as one small module rather than spreading
 * `new Resend(...)` calls around, so there's a single place to swap
 * providers or add templates later.
 *
 * Fails loudly if RESEND_API_KEY/INVITE_EMAIL_FROM aren't set, but the
 * caller (sendInvitation) treats an email failure as non-fatal — the
 * invitation row already exists and is still usable via its link, so a
 * flaky email provider should never block the invite from being created.
 */

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

const ROLE_LABELS: Record<string, string> = {
  seller: "Seller",
  buyer: "Buyer",
  sellers_agent: "Seller's agent",
  buyers_agent: "Buyer's agent",
  sellers_conveyancer: "Seller's conveyancer",
  buyers_conveyancer: "Buyer's conveyancer",
  broker: "Broker",
};

export interface InvitationEmailParams {
  toEmail: string;
  role: string;
  chainRef: string;
  propertyAddress: string | null;
  inviterName: string | null;
  inviteUrl: string;
}

/**
 * Sends the "you've been invited to a ChainLink chain" email. Returns
 * `{ sent: true }` on success or `{ sent: false, reason }` on any failure
 * (missing config, Resend API error) — never throws, since a failed email
 * must not roll back or block invitation creation.
 */
export async function sendInvitationEmail(
  params: InvitationEmailParams
): Promise<{ sent: true } | { sent: false; reason: string }> {
  const resend = getClient();
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  const from = process.env.INVITE_EMAIL_FROM?.trim();
  if (!from) {
    return { sent: false, reason: "INVITE_EMAIL_FROM is not configured" };
  }

  const roleLabel = ROLE_LABELS[params.role] ?? params.role;
  const subjectAddress = params.propertyAddress ?? params.chainRef;

  const inviterLine = params.inviterName
    ? `${params.inviterName} has invited you`
    : "You've been invited";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">${inviterLine} to join a property chain</h1>
      <p style="font-size: 15px; line-height: 1.5; color: #444;">
        You've been added as <strong>${roleLabel}</strong> on
        <strong>${escapeHtml(subjectAddress)}</strong> (Chain ${escapeHtml(params.chainRef)}) on ChainLink.
      </p>
      <p style="margin: 28px 0;">
        <a href="${params.inviteUrl}"
           style="background: #111827; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-size: 15px; display: inline-block;">
          View invitation
        </a>
      </p>
      <p style="font-size: 13px; color: #888; line-height: 1.5;">
        This invite expires in 14 days. If the button above doesn't work, copy
        this link into your browser:<br />
        <span style="word-break: break-all;">${params.inviteUrl}</span>
      </p>
    </div>
  `.trim();

  const text = `${inviterLine} to join a property chain.

You've been added as ${roleLabel} on ${subjectAddress} (Chain ${params.chainRef}) on ChainLink.

View your invitation: ${params.inviteUrl}

This invite expires in 14 days.`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: params.toEmail,
      subject: `You've been invited to a property chain on ChainLink`,
      html,
      text,
    });

    if (error) {
      return { sent: false, reason: error.message };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "Unknown error sending email",
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
