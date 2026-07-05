import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

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

export async function insertChainParticipant(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["chain_participants"]["Insert"]
) {
  const { data, error } = await supabase
    .from("chain_participants")
    .insert(input)
    .select("id, role, access_mode, organisation_id")
    .single();

  if (error) throw error;
  return data;
}

export async function insertProperty(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["properties"]["Insert"]
) {
  const { data, error } = await supabase
    .from("properties")
    .insert(input)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function insertChainNode(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["chain_nodes"]["Insert"]
) {
  const { data, error } = await supabase
    .from("chain_nodes")
    .insert(input)
    .select("id")
    .single();

  if (error) throw error;
  return data;
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
      id, chain_ref, status, created_at,
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
    .select("id, sequence_index, depends_on_node_id, properties ( address_line1, city )")
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
