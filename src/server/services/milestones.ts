import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import * as milestonesRepo from "@/server/repositories/milestones.repository";
import * as chainsRepo from "@/server/repositories/chains.repository";

type TypedClient = SupabaseClient<Database>;

export async function listMilestones(supabase: TypedClient, chainId: string) {
  return milestonesRepo.listMilestonesForChain(supabase, chainId);
}

/**
 * Confirms a milestone on behalf of the current user's participant record
 * on this chain, then logs it. The actual "is this allowed" question is
 * answered by the database (RLS + the guest-confirmation trigger in
 * 0012_guest_capabilities.sql) — this function does not re-implement that
 * check, so it stays correct even if new ways to call it are added later.
 */
export async function confirmMilestone(
  supabase: TypedClient,
  params: { chainId: string; milestoneId: string; milestoneTitle: string; myParticipantId: string }
) {
  await milestonesRepo.confirmMilestone(supabase, params.milestoneId, params.myParticipantId);

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.myParticipantId,
    action: "milestone.confirmed",
    entity_type: "milestone",
    entity_id: params.milestoneId,
    source: "manual",
    visibility: "shared",
    metadata: { title: params.milestoneTitle },
  });
}
