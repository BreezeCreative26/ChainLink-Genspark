import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import * as notesRepo from "@/server/repositories/notes.repository";
import * as chainsRepo from "@/server/repositories/chains.repository";

type TypedClient = SupabaseClient<Database>;

export async function listComments(supabase: TypedClient, chainId: string) {
  return notesRepo.listSharedNotesForChain(supabase, chainId);
}

export async function addComment(
  supabase: TypedClient,
  params: { chainId: string; body: string; myParticipantId: string }
) {
  const note = await notesRepo.insertComment(supabase, {
    chainId: params.chainId,
    body: params.body,
    createdByParticipantId: params.myParticipantId,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.myParticipantId,
    action: "comment.added",
    entity_type: "note",
    entity_id: note.id,
    source: "manual",
    visibility: "shared",
  });
}

export async function listInternalNotes(
  supabase: TypedClient,
  chainId: string,
  organisationId: string
) {
  return notesRepo.listInternalNotesForChain(supabase, chainId, organisationId);
}

export async function addInternalNote(
  supabase: TypedClient,
  params: { chainId: string; body: string; organisationId: string; myParticipantId: string }
) {
  const note = await notesRepo.insertInternalNote(supabase, {
    chainId: params.chainId,
    body: params.body,
    organisationId: params.organisationId,
    createdByParticipantId: params.myParticipantId,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.myParticipantId,
    action: "note.added",
    entity_type: "note",
    entity_id: note.id,
    source: "manual",
    visibility: "internal",
    organisation_id: params.organisationId,
  });
}
