import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

// ── Session-scoped (RLS-governed) ──────────────────────────────────────

export async function insertInvitation(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["invitations"]["Insert"]
) {
  const { data, error } = await supabase
    .from("invitations")
    .insert(input)
    .select("id, email, role, token")
    .single();

  if (error) throw error;
  return data;
}

export async function listInvitationsForChain(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, status, created_at, expires_at")
    .eq("chain_id", chainId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function revokeInvitation(supabase: TypedClient, invitationId: string) {
  const { error } = await supabase
    .from("invitations")
    .update({ status: "inactive" })
    .eq("id", invitationId)
    .in("status", ["invited", "viewed"]); // no-op if already resolved

  if (error) throw error;
}

/**
 * Fetches an invitation by token for the purpose of *acting on it*
 * (accept/decline) — the caller must already be authenticated, and RLS
 * (invitations_update_by_recipient) is what actually gates this to the
 * right person. This is a plain session-scoped select, not the admin one.
 */
export async function getInvitationByTokenForRecipient(
  supabase: TypedClient,
  token: string
) {
  const { data, error } = await supabase
    .from("invitations")
    .select(
      "id, chain_id, email, role, status, expires_at, invited_by_participant_id"
    )
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function markInvitationResolved(
  supabase: TypedClient,
  invitationId: string,
  outcome: {
    status: "accepted" | "linked" | "declined";
    resultingParticipantId?: string;
  }
) {
  const patch: Database["public"]["Tables"]["invitations"]["Update"] = {
    status: outcome.status,
  };
  if (outcome.status === "declined") {
    patch.declined_at = new Date().toISOString();
  } else {
    patch.accepted_at = new Date().toISOString();
    patch.resulting_participant_id = outcome.resultingParticipantId;
  }

  const { error } = await supabase
    .from("invitations")
    .update(patch)
    .eq("id", invitationId);

  if (error) throw error;
}

export async function findActiveMembershipMatchingRole(
  supabase: TypedClient,
  profileId: string,
  invitationRole: Database["public"]["Tables"]["chain_participants"]["Row"]["role"]
) {
  const relevantMembershipRoles =
    invitationRole === "sellers_agent" || invitationRole === "buyers_agent"
      ? (["agent", "admin", "owner"] as const)
      : invitationRole === "sellers_conveyancer" || invitationRole === "buyers_conveyancer"
        ? (["conveyancer", "admin", "owner"] as const)
        : (["admin", "owner", "staff"] as const); // broker / other

  const { data, error } = await supabase
    .from("memberships")
    .select("organisation_id, organisations ( name )")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .in("role", relevantMembershipRoles as unknown as string[])
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getInviterProfileId(supabase: TypedClient, participantId: string) {
  const { data, error } = await supabase
    .from("chain_participants")
    .select("profile_id")
    .eq("id", participantId)
    .maybeSingle();

  if (error) throw error;
  return data?.profile_id ?? null;
}

export async function insertNotification(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["notifications"]["Insert"]
) {
  const { error } = await supabase.from("notifications").insert(input);
  if (error) throw error;
}

// ── Service-role (pre-login only — see src/lib/supabase/admin.ts) ───────

/**
 * The ONLY thing this returns is display data for the "you've been
 * invited" screen — never a profile_id, organisation_id, or anything an
 * unauthenticated visitor shouldn't see. Nothing here grants access; it
 * only lets someone decide whether to log in and respond.
 */
export async function getInvitationForDisplay(token: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("invitations")
    .select(
      `
      status, expires_at, role,
      chains ( chain_ref, properties ( address_line1, city ) ),
      invited_by_participant_id
    `
    )
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  let inviterName: string | null = null;
  if (data.invited_by_participant_id) {
    const { data: inviterParticipant } = await admin
      .from("chain_participants")
      .select("profile_id, profiles ( full_name, email )")
      .eq("id", data.invited_by_participant_id)
      .maybeSingle();

    const inviterProfile = Array.isArray(inviterParticipant?.profiles)
      ? inviterParticipant?.profiles[0]
      : inviterParticipant?.profiles;
    inviterName = inviterProfile?.full_name ?? inviterProfile?.email ?? null;
  }

  const chain = Array.isArray(data.chains) ? data.chains[0] : data.chains;
  const property = chain?.properties
    ? Array.isArray(chain.properties)
      ? chain.properties[0]
      : chain.properties
    : null;

  return {
    status: data.status,
    expiresAt: data.expires_at,
    role: data.role,
    chainRef: chain?.chain_ref ?? "",
    propertyAddress: property
      ? [property.address_line1, property.city].filter(Boolean).join(", ")
      : null,
    inviterName,
  };
}

/**
 * Marks an invitation as viewed. Narrow, idempotent (only moves
 * 'invited' -> 'viewed'; never overwrites a later state), and — like the
 * lookup above — runs before any session exists, which is why it needs the
 * admin client rather than the recipient-scoped RLS policy.
 */
export async function markInvitationViewed(token: string) {
  const admin = createAdminClient();
  await admin
    .from("invitations")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("token", token)
    .eq("status", "invited");
}
