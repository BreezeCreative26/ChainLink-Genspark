"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { recordDocumentUpload } from "@/server/services/documents";
import type { DocumentCategory } from "@/types/chain";

export async function recordDocumentUploadAction(input: {
  chainId: string;
  title: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  category: DocumentCategory;
  uploadedByParticipantId: string;
}) {
  const supabase = createClient();
  try {
    await recordDocumentUpload(supabase, input);
  } catch (err) {
    console.error("recordDocumentUploadAction failed", err);
    return {
      error:
        err instanceof Error ? err.message : "Could not save the document record.",
    };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}
