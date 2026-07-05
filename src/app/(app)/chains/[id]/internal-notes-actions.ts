"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { addInternalNote } from "@/server/services/notes";
import { toActionError } from "@/lib/errors";

export async function addInternalNoteAction(input: {
  chainId: string;
  body: string;
  organisationId: string;
  myParticipantId: string;
}) {
  if (!input.body.trim()) {
    return { error: "Note can't be empty." };
  }

  const supabase = createClient();
  try {
    await addInternalNote(supabase, {
      chainId: input.chainId,
      body: input.body.trim(),
      organisationId: input.organisationId,
      myParticipantId: input.myParticipantId,
    });
  } catch (err) {
    return { error: toActionError(err, "Could not post note.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}
