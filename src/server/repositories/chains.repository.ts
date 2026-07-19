import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

/**
 * Raw Supabase access for chain-related tables. No business logic lives
 * here — see src/server/services/chains.ts for orchestration (e.g. working
 * out access_mode, writing the activity log entry). This split exists so
 * permission-sensitive queries live in one place rather than being
 * scattered across components (docs/DECISIONS.md, "Repository/service
 * layer" decision).
 */

export async function findActiveMembershipForRole(
  supabase: TypedClient,
  profileId: string
) {
  const { data, error } = await supabase
    .from("memberships")
    .select("organisation_id, role")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "agent", "conveyancer"])
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function insertChain(supabase: TypedClient, createdByProfileId: string) {
  const { data, error } = await supabase
    .from("chains")
    .insert({ created_by_profile_id: createdByProfileId })
    .select("id, chain_ref, status, created_at")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Creates a chain, the creator's own participant row, the first property,
 * and the first chain_node in a single atomic call via the
 * `create_chain_workspace` Postgres function (SECURITY DEFINER).
 *
 * This exists because the naive sequential-insert approach (chain, then
 * chain_participants, then properties, then chain_nodes as four separate
 * client-side inserts under RLS) has a chicken-and-egg gap: the
 * `properties_insert`/`chain_nodes_insert` policies require
 * `is_chain_member(chain_id)`, which itself requires an *active*
 * chain_participants row for the caller — but that row is only created by
 * the second insert in the sequence. Every step individually satisfies its
 * own policy in isolation, but PostgREST does not run them in the same
 * transaction as a later step's check in a way that lets this bootstrap
 * itself from nothing. A SECURITY DEFINER function sidesteps the ordering
 * problem entirely by doing all four inserts server-side under one
 * elevated-but-scoped transaction, still gated by the same role/ownership
 * checks internally.
 */
export async function insertChainWorkspace(
  supabase: TypedClient,
  input: {
    creatorRole: string;
    addressLine1: string;
    addressLine2?: string | null;
    city?: string | null;
    postcode?: string | null;
    listingPrice?: number | null;
  }
) {
  const { data, error } = await supabase.rpc("create_chain_workspace" as never, {
    p_creator_role: input.creatorRole,
    p_address_line1: input.addressLine1,
    p_address_line2: input.addressLine2 ?? null,
    p_city: input.city ?? null,
    p_postcode: input.postcode ?? null,
    p_listing_price: input.listingPrice ?? null,
  } as never);

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as {
    chain_id: string;
    chain_ref: string;
    chain_status: "active" | "stalled" | "completed" | "fallen_through";
    chain_created_at: string;
    participant_id: string;
    participant_role: string;
    access_mode: "proxy" | "guest" | "connected";
    organisation_id: string | null;
    property_id: string;
    chain_node_id: string;
  };

  if (!row) throw new Error("create_chain_workspace returned no row");

  return {
    chain: {
      id: row.chain_id,
      chain_ref: row.chain_ref,
      status: row.chain_status,
      created_at: row.chain_created_at,
    },
    participant: {
      id: row.participant_id,
      role: row.participant_role,
      access_mode: row.access_mode,
      organisation_id: row.organisation_id,
    },
    propertyId: row.property_id,
    chainNodeId: row.chain_node_id,
  };
}

export async function insertChainParticipant(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["chain_participants"]["Insert"]
) {
  // Postgres evaluates a table's SELECT policies against a row returned by
  // an INSERT ... RETURNING — not just the INSERT policy's WITH CHECK. For
  // a brand-new chain_participants row this collides with
  // chain_participants_select's is_chain_member(chain_id) check: at the
  // instant the row is being created, the inserting profile is not yet
  // "a member" by that policy's definition (same chicken-and-egg gap
  // already hit once for chains_insert — see insertChainWorkspace below).
  // PostgREST's .select() forces `Prefer: return=representation`, which is
  // exactly the RETURNING clause that triggers this — a plain insert with
  // no RETURNING does not re-check SELECT policies and succeeds every
  // time. Verified directly against the live project: identical insert
  // payload, only the return preference differed, one 42501s and the
  // other doesn't.
  //
  // Fix: insert with an explicit client-generated id and no .select(),
  // then fetch the row back in a SEPARATE statement afterwards. By that
  // point the row exists and the inserting profile genuinely is an active
  // member of the chain, so chain_participants_select (and
  // chain_participants_select_via_org) evaluate normally.
  const id = randomUUID();

  const { error: insertError } = await supabase
    .from("chain_participants")
    .insert({ ...input, id });

  if (insertError) throw insertError;

  const { data, error: selectError } = await supabase
    .from("chain_participants")
    .select("id, role, access_mode, organisation_id")
    .eq("id", id)
    .single();

  if (selectError) throw selectError;
  return data;
}

export async function getParticipantWorkspaceContext(
  supabase: TypedClient,
  participantId: string,
  chainId: string
) {
  const { data, error } = await supabase
    .from("chain_participants")
    .select("organisation_id")
    .eq("id", participantId)
    .eq("chain_id", chainId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getChainManagementContext(
  supabase: TypedClient,
  chainId: string,
  profileId: string
) {
  const [{ data: chain, error: chainError }, { data: participant, error: participantError }] =
    await Promise.all([
      supabase
        .from("chains")
        .select("created_by_profile_id")
        .eq("id", chainId)
        .maybeSingle(),
      supabase
        .from("chain_participants")
        .select("id, access_mode")
        .eq("chain_id", chainId)
        .eq("profile_id", profileId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle(),
    ]);

  if (chainError) throw chainError;
  if (participantError) throw participantError;

  return {
    participant,
    canManage: Boolean(
      participant &&
        (chain?.created_by_profile_id === profileId || participant.access_mode !== "guest")
    ),
  };
}

export async function listAssignableParticipants(
  supabase: TypedClient,
  chainId: string,
  participantIds: string[]
) {
  if (participantIds.length === 0) return [];

  const { data, error } = await supabase
    .from("chain_participants")
    .select("id, role")
    .eq("chain_id", chainId)
    .eq("status", "active")
    .in("id", participantIds);

  if (error) throw error;
  return data;
}

export async function updateChainNodeParticipants(
  _supabase: TypedClient,
  input: {
    chainId: string;
    nodeId: string;
    sellerParticipantId: string | null;
    buyerParticipantId: string | null;
  }
) {
  // This is the one compatibility write for installations that pre-date the
  // manager-scoped chain_nodes UPDATE policy in migration 0018. The service
  // calling this function has already authenticated the user, verified their
  // active participant record, checked creator/professional management rights,
  // and validated both participant IDs against this chain and side role. The
  // admin client is kept here, server-only, and the update is pinned to both
  // node ID and chain ID. Once every environment has 0018, this remains a
  // harmless narrow write rather than making production rollout order brittle.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chain_nodes")
    .update({
      seller_participant_id: input.sellerParticipantId,
      buyer_participant_id: input.buyerParticipantId,
    })
    .eq("id", input.nodeId)
    .eq("chain_id", input.chainId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Transaction not found");
}

export async function insertLinkedChainTransaction(
  supabase: TypedClient,
  input: {
    chainId: string;
    addressLine1: string;
    city?: string | null;
    postcode?: string | null;
    dependsOnNodeId?: string | null;
    sellerParticipantId?: string | null;
    buyerParticipantId?: string | null;
  }
) {
  const { data, error } = await supabase.rpc("create_linked_chain_transaction" as never, {
    p_chain_id: input.chainId,
    p_address_line1: input.addressLine1,
    p_city: input.city ?? null,
    p_postcode: input.postcode ?? null,
    p_depends_on_node_id: input.dependsOnNodeId ?? null,
    p_seller_participant_id: input.sellerParticipantId ?? null,
    p_buyer_participant_id: input.buyerParticipantId ?? null,
  } as never);

  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as {
    property_id: string;
    chain_node_id: string;
  } | null;
  if (!row) throw new Error("create_linked_chain_transaction returned no row");

  return { propertyId: row.property_id, id: row.chain_node_id };
}

export async function insertInvitation(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["invitations"]["Insert"]
) {
  const { error } = await supabase.from("invitations").insert(input);
  if (error) throw error;
}

export async function insertActivityLog(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["activity_logs"]["Insert"]
) {
  const { error } = await supabase.from("activity_logs").insert(input);
  if (error) throw error;
}

/**
 * Every chain the current user is an active participant on, with just
 * enough joined data for the chains list. RLS (chains_select policy)
 * already restricts this to chains the user can see — this query doesn't
 * need to (and shouldn't) duplicate that filtering itself.
 */
export async function listChainsForProfile(supabase: TypedClient, profileId: string) {
  const { data, error } = await supabase
    .from("chain_participants")
    .select(
      `
      role,
      access_mode,
      chains ( id, chain_ref, status, created_at ),
      chain_id
    `
    )
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("created_at", { foreignTable: "chains", ascending: false });

  if (error) throw error;
  return data;
}

export async function getChainByIdForProfile(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("chains")
    .select(
      `
      id, chain_ref, status, created_at, created_by_profile_id,
      chain_participants ( id, role, access_mode, organisation_id, status, profile_id, profiles ( full_name, email ) ),
      properties ( id, address_line1, address_line2, city, postcode, listing_price )
    `
    )
    .eq("id", chainId)
    .single();

  if (error) throw error;
  return data;
}

export async function getFirstPropertyAddress(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("address_line1, city")
    .eq("chain_id", chainId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listActivityForChain(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, action, entity_type, source, created_at, on_behalf_of_participant_id")
    .eq("chain_id", chainId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

/**
 * Every transaction (node) in this chain, with its property address, for
 * the "linked transactions" UI — the one part of the tree-based chain
 * topology (docs/data-model.md, "Chain Topology") that had no UI at all
 * before the commercial-grade audit, despite being a deliberate,
 * signature schema decision.
 */
export async function listChainNodesForChain(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("chain_nodes")
    .select(
      "id, sequence_index, depends_on_node_id, status, seller_participant_id, buyer_participant_id, properties ( address_line1, city, postcode )"
    )
    .eq("chain_id", chainId)
    .order("sequence_index", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * True if the user has 'connected' or 'proxy' standing on ANY chain —
 * i.e. they are not a pure guest anywhere. Used to gate the business
 * dashboard nav item (docs: "guests must not see business dashboards").
 * Being a guest on THIS chain doesn't matter here; this is deliberately
 * global, since Dashboard reflects a person's overall professional
 * standing, not any one chain.
 */
export async function hasNonGuestParticipation(supabase: TypedClient, profileId: string) {
  const { count, error } = await supabase
    .from("chain_participants")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("status", "active")
    .in("access_mode", ["connected", "proxy"]);

  if (error) throw error;
  return (count ?? 0) > 0;
}
