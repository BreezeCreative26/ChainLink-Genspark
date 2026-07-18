import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";

import type { Database } from "@/types/database";
import type {
  AcceptDecision,
  AccountMatch,
  ChainParticipantRole,
} from "@/types/chain";
import * as invitationsRepo from "@/server/repositories/invitations.repository";
import * as chainsRepo from "@/server/repositories/chains.repository";
import { sendInvitationEmail } from "@/server/services/email";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

/**
 * Sends a chain invitation: creates the invitations row, records the audit
 * trail entry, and emails the invitee a link to respond. Reused both at
 * chain-creation time and for ad-hoc invites from the chain detail page,
 * so "an invite was sent" is logged consistently either way.
 *
 * The email is best-effort: if it fails to send (missing API key, provider
 * error, etc.) the invitation itself is NOT rolled back — it already
 * exists and is still fully usable via its link, so a flaky email
 * provider must never block invite creation. The failure is logged to the
 * server console and surfaced on the returned object so callers can warn
 * the inviter (e.g. "invite created, but the email couldn't be sent — copy
 * the link instead") rather than silently pretending delivery succeeded.
 */
export async function sendInvitation(
  supabase: TypedClient,
  params: {
    chainId: string;
    email: string;
    role: ChainParticipantRole;
    invitedByParticipantId: string;
  }
) {
  const invitation = await invitationsRepo.insertInvitation(supabase, {
    chain_id: params.chainId,
    email: params.email,
    role: params.role,
    invited_by_participant_id: params.invitedByParticipantId,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.invitedByParticipantId,
    action: "invitation.sent",
    entity_type: "invitation",
    entity_id: invitation.id,
    source: "manual",
    visibility: "shared",
  });

  const emailResult = await deliverInvitationEmail(supabase, {
    chainId: params.chainId,
    invitedByParticipantId: params.invitedByParticipantId,
    toEmail: invitation.email,
    role: invitation.role,
    token: invitation.token,
  });

  if (!emailResult.sent) {
    console.error(
      `[invitations] Failed to email invitation ${invitation.id} to ${invitation.email}: ${emailResult.reason}`
    );
  }

  return { ...invitation, emailSent: emailResult.sent };
}

async function deliverInvitationEmail(
  supabase: TypedClient,
  params: {
    chainId: string;
    invitedByParticipantId: string;
    toEmail: string;
    role: ChainParticipantRole;
    token: string;
  }
): Promise<{ sent: true } | { sent: false; reason: string }> {
  const [chainHeader, property, inviterProfileId] = await Promise.all([
    chainsRepo.getChainByIdForProfile(supabase, params.chainId).catch(() => null),
    chainsRepo.getFirstPropertyAddress(supabase, params.chainId).catch(() => null),
    invitationsRepo.getInviterProfileId(supabase, params.invitedByParticipantId),
  ]);

  let inviterName: string | null = null;
  if (inviterProfileId) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", inviterProfileId)
      .maybeSingle();
    inviterName = data?.full_name ?? data?.email ?? null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const inviteUrl = `${appUrl.replace(/\/$/, "")}/invite/${params.token}`;

  return sendInvitationEmail({
    toEmail: params.toEmail,
    role: params.role,
    chainRef: chainHeader?.chain_ref ?? "—",
    propertyAddress: property
      ? [property.address_line1, property.city].filter(Boolean).join(", ")
      : null,
    inviterName,
    inviteUrl,
  });
}

export async function listInvitations(supabase: TypedClient, chainId: string) {
  return invitationsRepo.listInvitationsForChain(supabase, chainId);
}

export async function revokeInvitation(supabase: TypedClient, invitationId: string) {
  return invitationsRepo.revokeInvitation(supabase, invitationId);
}

/**
 * The result of trying to respond to an invitation. `notFound` covers both
 * "no such token" and "already resolved/expired" — deliberately not
 * distinguished in the UI-facing result, so we don't leak which tokens
 * exist. `emailMismatch` is the core safety check: the invite is real, but
 * the signed-in person is not who it was sent to.
 */
export type InvitationCheckResult =
  | { outcome: "not_found" }
  | { outcome: "email_mismatch"; invitedEmail: string }
  | {
      outcome: "ready";
      invitationId: string;
      chainId: string;
      role: ChainParticipantRole;
      invitedByParticipantId: string;
      accountMatch: AccountMatch | null;
    };

/**
 * Validates an invitation against the *currently authenticated* user and
 * looks for a matching firm membership. This is read-only — it never
 * creates a participant or changes the invitation's status. Call this to
 * decide what to show the signed-in person before they choose accept,
 * decline, or link.
 */
export async function checkInvitationForCurrentUser(
  supabase: TypedClient,
  token: string
): Promise<InvitationCheckResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError("You need to be logged in to respond to this invitation.");
  }

  const invitation = await invitationsRepo.getInvitationByTokenForRecipient(
    supabase,
    token
  );

  if (!invitation || !["invited", "viewed"].includes(invitation.status)) {
    return { outcome: "not_found" };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { outcome: "not_found" };
  }

  // The safeguard: compare the AUTHENTICATED session's email against the
  // invitation's email. Never trust a value from a form for this check —
  // auth.uid() -> user.email is the only thing that can't be spoofed by
  // whoever is currently signed in.
  if (invitation.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { outcome: "email_mismatch", invitedEmail: invitation.email };
  }

  const membership = await invitationsRepo.findActiveMembershipMatchingRole(
    supabase,
    user.id,
    invitation.role
  );

  const organisationName = membership
    ? await invitationsRepo.getOrganisationName(supabase, membership.organisation_id)
    : null;

  const accountMatch: AccountMatch | null = membership
    ? {
        organisationId: membership.organisation_id,
        organisationName: organisationName ?? "your firm",
      }
    : null;

  return {
    outcome: "ready",
    invitationId: invitation.id,
    chainId: invitation.chain_id,
    role: invitation.role,
    invitedByParticipantId: invitation.invited_by_participant_id,
    accountMatch,
  };
}

/**
 * Actually resolves the invitation: creates the chain_participants row,
 * marks the invitation accepted/linked, logs activity, and notifies the
 * original inviter. Re-runs the email-match check itself rather than
 * trusting the caller to have already checked it — this function is the
 * one that actually grants access, so it does not rely on a separate
 * function having validated anything first.
 */
export async function acceptInvitation(
  supabase: TypedClient,
  token: string,
  decision: AcceptDecision
) {
  const check = await checkInvitationForCurrentUser(supabase, token);

  if (check.outcome !== "ready") {
    throw new AppError(
      check.outcome === "email_mismatch"
        ? "This invitation was sent to a different email address."
        : "This invitation is no longer available."
    );
  }

  // 'link' is only honoured if a match actually exists — a client can't
  // force a link that checkInvitationForCurrentUser didn't itself find.
  const shouldLink = decision === "link" && check.accountMatch !== null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("Not authenticated");

  const participant = await chainsRepo.insertChainParticipant(supabase, {
    chain_id: check.chainId,
    profile_id: user.id,
    role: check.role,
    access_mode: shouldLink ? "connected" : "guest",
    organisation_id: shouldLink ? check.accountMatch!.organisationId : null,
  });

  await invitationsRepo.markInvitationResolved(supabase, check.invitationId, {
    status: shouldLink ? "linked" : "accepted",
    resultingParticipantId: participant.id,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: check.chainId,
    actor_participant_id: participant.id,
    action: shouldLink ? "invitation.linked" : "invitation.accepted",
    entity_type: "invitation",
    entity_id: check.invitationId,
    source: "manual",
    visibility: "shared",
  });

  const inviterProfileId = await invitationsRepo.getInviterProfileId(
    supabase,
    check.invitedByParticipantId
  );
  if (inviterProfileId) {
    await invitationsRepo.insertNotification(supabase, {
      profile_id: inviterProfileId,
      chain_id: check.chainId,
      title: shouldLink
        ? "Invitation linked to a firm workspace"
        : "Invitation accepted",
      body: shouldLink
        ? `Your invitation was accepted and linked to ${check.accountMatch?.organisationName}.`
        : "Your invitation was accepted.",
      link_path: `/chains/${check.chainId}`,
    });
  }

  return { chainId: check.chainId };
}

export async function declineInvitation(supabase: TypedClient, token: string) {
  const check = await checkInvitationForCurrentUser(supabase, token);

  if (check.outcome !== "ready") {
    throw new AppError(
      check.outcome === "email_mismatch"
        ? "This invitation was sent to a different email address."
        : "This invitation is no longer available."
    );
  }

  await invitationsRepo.markInvitationResolved(supabase, check.invitationId, {
    status: "declined",
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: check.chainId,
    action: "invitation.declined",
    entity_type: "invitation",
    entity_id: check.invitationId,
    source: "manual",
    visibility: "shared",
  });

  const inviterProfileId = await invitationsRepo.getInviterProfileId(
    supabase,
    check.invitedByParticipantId
  );
  if (inviterProfileId) {
    await invitationsRepo.insertNotification(supabase, {
      profile_id: inviterProfileId,
      chain_id: check.chainId,
      title: "Invitation declined",
      body: "An invitation you sent was declined.",
      link_path: `/chains/${check.chainId}`,
    });
  }
}

/**
 * Pre-login display lookup + "viewed" tracking. Safe to call from an
 * unauthenticated page — see src/server/repositories/invitations.repository.ts
 * for why this goes through the service-role client instead of the normal
 * one.
 */
export async function getInvitationForDisplayAndMarkViewed(token: string) {
  const invitation = await invitationsRepo.getInvitationForDisplay(token);
  if (invitation && invitation.status === "invited") {
    await invitationsRepo.markInvitationViewed(token);
  }
  return invitation;
}
