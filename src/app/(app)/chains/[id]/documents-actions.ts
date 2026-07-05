"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { recordDocumentUpload, getDocumentDownloadUrl } from "@/server/services/documents";
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

export async function getDocumentDownloadUrlAction(input: {
  documentId: string;
  viewerParticipantId: string | null;
  viewerAccessMode: "proxy" | "guest" | "connected" | null;
  viewerOrganisationId: string | null;
}) {
  const supabase = createClient();
  try {
    const url = await getDocumentDownloadUrl(supabase, input);
    return { url };
  } catch (err) {
    console.error("getDocumentDownloadUrlAction failed", err);
    return {
      error: err instanceof Error ? err.message : "Could not open this document.",
    };
  }
}
