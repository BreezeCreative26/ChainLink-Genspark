import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

export async function getOrganisationBillingRow(supabase: TypedClient, organisationId: string) {
  const { data, error } = await supabase
    .from("organisations")
    .select(
      "id, name, plan, subscription_status, current_period_end, trial_ends_at"
    )
    .eq("id", organisationId)
    .single();

  if (error) throw error;
  return data;
}

export async function countActiveMemberships(supabase: TypedClient, organisationId: string) {
  const { count, error } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", organisationId)
    .eq("status", "active");

  if (error) throw error;
  return count ?? 0;
}

export async function countBranches(supabase: TypedClient, organisationId: string) {
  const { count, error } = await supabase
    .from("branches")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", organisationId);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Distinct chains the organisation is connected to — the same definition
 * of "in scope" used by the business dashboard
 * (src/server/services/dashboard.ts), so usage-vs-limit numbers here
 * always match what the dashboard actually shows.
 */
export async function countActiveConnectedChains(supabase: TypedClient, organisationId: string) {
  const { data, error } = await supabase
    .from("chain_participants")
    .select("chain_id")
    .eq("organisation_id", organisationId)
    .eq("access_mode", "connected")
    .eq("status", "active");

  if (error) throw error;
  return new Set(data.map((r) => r.chain_id)).size;
}
