import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { DocumentCategory } from "@/types/chain";
import * as documentsRepo from "@/server/repositories/documents.repository";
import * as chainsRepo from "@/server/repositories/chains.repository";

type TypedClient = SupabaseClient<Database>;

export async function listDocuments(supabase: TypedClient, chainId: string) {
  const documents = await documentsRepo.listDocumentsForChain(supabase, chainId);

  // Small MVP tradeoff: one signed-URL call per document rather than a
  // batch API (Supabase Storage doesn't offer bulk signing). Fine at the
  // scale of a single chain's document list; revisit if a chain
  // accumulates hundreds of documents.
  const withUrls = await Promise.all(
    documents.map(async (doc) => ({
      ...doc,
      downloadUrl: await documentsRepo
        .createSignedDownloadUrl(supabase, doc.storage_path)
        .catch(() => null),
    }))
  );

  return withUrls;
}

/**
 * Records the metadata row for a file that has ALREADY been uploaded to
 * Storage by the browser client (see documents-panel.tsx) — this function
 * never touches file bytes itself. The category requirement for guests is
 * enforced by documents_guest_requires_category (0012); this just supplies
 * it when the caller is a guest uploading through the guest UI.
 */
export async function recordDocumentUpload(
  supabase: TypedClient,
  params: {
    chainId: string;
    title: string;
    storagePath: string;
    mimeType: string | null;
    sizeBytes: number | null;
    category: DocumentCategory | null;
    uploadedByParticipantId: string;
  }
) {
  const document = await documentsRepo.insertDocument(supabase, {
    chain_id: params.chainId,
    title: params.title,
    storage_path: params.storagePath,
    mime_type: params.mimeType,
    size_bytes: params.sizeBytes,
    category: params.category,
    visibility: "shared",
    uploaded_by_participant_id: params.uploadedByParticipantId,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.uploadedByParticipantId,
    action: "document.uploaded",
    entity_type: "document",
    entity_id: document.id,
    source: "manual",
    visibility: "shared",
    metadata: { title: params.title, category: params.category },
  });

  return document;
}
