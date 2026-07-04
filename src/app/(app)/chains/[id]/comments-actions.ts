"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { addComment } from "@/server/services/notes";

export async function addCommentAction(input: {
  chainId: string;
  body: string;
  myParticipantId: string;
}) {
  if (!input.body.trim()) {
    return { error: "Comment can't be empty." };
  }

  const supabase = createClient();
  try {
    await addComment(supabase, {
      chainId: input.chainId,
      body: input.body.trim(),
      myParticipantId: input.myParticipantId,
    });
  } catch (err) {
    console.error("addCommentAction failed", err);
    return { error: err instanceof Error ? err.message : "Could not post comment." };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}
