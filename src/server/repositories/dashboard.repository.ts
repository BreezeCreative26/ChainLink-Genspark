import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

export async function getActiveMemberships(supabase: TypedClient, profileId: string) {
  const { data, error } = await supabase
    .from("memberships")
    .select("organisation_id, branch_id, role")
    .eq("profile_id", profileId)
    .eq("status", "active");

  if (error) throw error;
  return data;
}

export async function getOrganisationName(supabase: TypedClient, organisationId: string) {
  const { data, error } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", organisationId)
    .maybeSingle();

  if (error) throw error;
  return data?.name ?? null;
}

export async function getBranchesForOrganisation(supabase: TypedClient, organisationId: string) {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name")
    .eq("organisation_id", organisationId);

  if (error) throw error;
  return data;
}

/**
 * Every chain_id the given organisation is connected to, plus which
 * profile is connected on each (used to derive branch scoping — a chain's
 * "branch" is inferred from its connected team member's branch, since
 * chains themselves don't carry a branch_id).
 */
export async function listOrgConnectedChainParticipants(
  supabase: TypedClient,
  organisationId: string
) {
  const { data, error } = await supabase
    .from("chain_participants")
    .select("chain_id, profile_id")
    .eq("organisation_id", organisationId)
    .eq("access_mode", "connected")
    .eq("status", "active");

  if (error) throw error;
  return data;
}

export async function listSoloChainIds(supabase: TypedClient, profileId: string) {
  const { data, error } = await supabase
    .from("chain_participants")
    .select("chain_id")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .in("access_mode", ["connected", "proxy"]);

  if (error) throw error;
  return data.map((r) => r.chain_id);
}

export async function listChainsSummary(supabase: TypedClient, chainIds: string[]) {
  if (chainIds.length === 0) return [];

  const { data, error } = await supabase
    .from("chains")
    .select("id, chain_ref, status, properties ( address_line1, city )")
    .in("id", chainIds);

  if (error) throw error;
  return data;
}

export async function listLastActivityPerChain(supabase: TypedClient, chainIds: string[]) {
  if (chainIds.length === 0) return [];

  const { data, error } = await supabase
    .from("activity_logs")
    .select("chain_id, created_at")
    .in("chain_id", chainIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function listOverdueMilestones(supabase: TypedClient, chainIds: string[]) {
  if (chainIds.length === 0) return [];

  const { data, error } = await supabase
    .from("milestones")
    .select("id, title, due_date, chain_id")
    .in("chain_id", chainIds)
    .neq("status", "completed")
    .not("due_date", "is", null)
    .lt("due_date", new Date().toISOString().slice(0, 10));

  if (error) throw error;
  return data;
}

export async function listOverdueTasks(supabase: TypedClient, chainIds: string[]) {
  if (chainIds.length === 0) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, chain_id")
    .in("chain_id", chainIds)
    .neq("status", "done")
    .not("due_date", "is", null)
    .lt("due_date", new Date().toISOString().slice(0, 10));

  if (error) throw error;
  return data;
}

export async function listUpcomingMilestones(supabase: TypedClient, chainIds: string[]) {
  if (chainIds.length === 0) return [];

  const { data, error } = await supabase
    .from("milestones")
    .select("id, title, due_date, chain_id")
    .in("chain_id", chainIds)
    .neq("status", "completed")
    .not("due_date", "is", null)
    .gte("due_date", new Date().toISOString().slice(0, 10))
    .ilike("title", "completion%")
    .order("due_date", { ascending: true })
    .limit(10);

  if (error) throw error;
  return data;
}

export async function listPendingInvitations(supabase: TypedClient, chainIds: string[]) {
  if (chainIds.length === 0) return [];

  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, status, created_at, chain_id")
    .in("chain_id", chainIds)
    .in("status", ["invited", "viewed"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function listRecentActivity(
  supabase: TypedClient,
  chainIds: string[],
  limit: number
) {
  if (chainIds.length === 0) return [];

  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, action, created_at, chain_id")
    .in("chain_id", chainIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
