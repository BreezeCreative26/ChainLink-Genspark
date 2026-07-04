import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

/**
 * "Comments" and firm "notes" are the same table, distinguished only by
 * visibility (docs/DECISIONS.md, "Guest experience"). This lists the
 * shared ones only — the ones anyone on the chain, including guests, can
 * see — regardless of who's asking, since RLS already scopes shared rows
 * to any chain member.
 */
export async function listSharedNotesForChain(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("notes")
    .select(
      "id, body, created_at, created_by_participant_id, chain_participants ( role, profiles ( full_name, email ) )"
    )
    .eq("chain_id", chainId)
    .eq("visibility", "shared")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function insertComment(
  supabase: TypedClient,
  input: { chainId: string; body: string; createdByParticipantId: string }
) {
  const { data, error } = await supabase
    .from("notes")
    .insert({
      chain_id: input.chainId,
      body: input.body,
      visibility: "shared",
      created_by_participant_id: input.createdByParticipantId,
      source: "manual",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
