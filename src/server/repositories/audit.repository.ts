import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

/**
 * The full audit trail for a chain — every action the viewer's RLS
 * entitles them to see (shared, plus their own firm's internal entries),
 * with actor/on-behalf-of identity resolved for display. This is
 * deliberately a superset of the casual "Activity" card shown to everyone
 * including guests — see docs/DECISIONS.md ("Document handling") for why
 * this is gated to non-guests at the page level.
 */
export async function listFullAuditLog(supabase: TypedClient, chainId: string, limit = 200) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select(
      `
      id, action, entity_type, entity_id, source, visibility, created_at,
      actor:chain_participants!actor_participant_id ( role, profiles ( full_name, email ) ),
      on_behalf_of:chain_participants!on_behalf_of_participant_id ( role, profiles ( full_name, email ) )
    `
    )
    .eq("chain_id", chainId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
