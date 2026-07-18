import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

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
      "id, body, created_at, created_by_participant_id, chain_participants!notes_created_by_participant_id_fkey ( role, profiles ( full_name, email ) )"
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

/**
 * The firm-internal half of the same table — a firm's own working notes,
 * never visible to other participants on the chain. Found missing
 * entirely in the commercial-grade audit; the schema and RLS already
 * supported it, only the application code and UI didn't exist yet.
 */
export async function listInternalNotesForChain(
  supabase: TypedClient,
  chainId: string,
  organisationId: string
) {
  const { data, error } = await supabase
    .from("notes")
    .select(
      "id, body, created_at, created_by_participant_id, chain_participants!notes_created_by_participant_id_fkey ( role, profiles ( full_name, email ) )"
    )
    .eq("chain_id", chainId)
    .eq("visibility", "internal")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function insertInternalNote(
  supabase: TypedClient,
  input: { chainId: string; body: string; organisationId: string; createdByParticipantId: string }
) {
  const { data, error } = await supabase
    .from("notes")
    .insert({
      chain_id: input.chainId,
      body: input.body,
      visibility: "internal",
      organisation_id: input.organisationId,
      created_by_participant_id: input.createdByParticipantId,
      source: "manual",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
