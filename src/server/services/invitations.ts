import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type {
  AcceptDecision,
  AccountMatch,
  ChainParticipantRole,
} from "@/types/chain";
import * as invitationsRepo from "@/server/repositories/invitations.repository";
import * as chainsRepo from "@/server/repositories/chains.repository";

type TypedClient = SupabaseClient<Database>;

/**
 * Sends a chain invitation and records the audit trail entry for it.
 * Reused both at chain-creation time and for ad-hoc invites from the chain
 * detail page, so "an invite was sent" is logged consistently either way.
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

  return invitation;
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
    throw new Error("checkInvitationForCurrentUser requires an authenticated session");
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

  const accountMatch: AccountMatch | null = membership
    ? {
        organisationId: membership.organisation_id,
        organisationName:
          (Array.isArray(membership.organisations)
            ? membership.organisations[0]?.name
            : membership.organisations?.name) ?? "your firm",
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
    throw new Error(
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
  if (!user) throw new Error("Not authenticated");

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
    throw new Error(
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
