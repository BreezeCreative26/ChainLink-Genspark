import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

export async function listMilestonesForChain(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("milestones")
    .select(
      "id, title, status, due_date, completed_at, visibility, guest_confirmable, created_at"
    )
    .eq("chain_id", chainId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * The only mutation exposed for milestones so far — deliberately narrow.
 * RLS (milestones_update) plus the guest-confirmation trigger
 * (0012_guest_capabilities.sql) are what actually make this safe for a
 * guest to call; this function does not itself distinguish "is this
 * person a guest" — the database enforces that regardless of caller.
 */
export async function confirmMilestone(
  supabase: TypedClient,
  milestoneId: string,
  recordedByParticipantId: string
) {
  const { error } = await supabase
    .from("milestones")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      source: "manual",
      recorded_by_participant_id: recordedByParticipantId,
    })
    .eq("id", milestoneId);

  if (error) throw error;
}
