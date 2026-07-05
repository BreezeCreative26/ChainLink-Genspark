import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";

import type { Database } from "@/types/database";
import type { DocumentCategory } from "@/types/chain";
import * as documentsRepo from "@/server/repositories/documents.repository";
import * as chainsRepo from "@/server/repositories/chains.repository";

type TypedClient = SupabaseClient<Database>;

export async function listDocuments(supabase: TypedClient, chainId: string) {
  return documentsRepo.listDocumentsForChain(supabase, chainId);
}

/**
 * Generates a fresh signed URL on demand, at the moment someone actually
 * opens a document — logged as 'document.viewed'. This replaced an
 * earlier approach that pre-generated a URL for every document on every
 * page load, which had two problems: it couldn't distinguish "the list
 * rendered" from "someone actually looked at this file" for audit
 * purposes, and it logged nothing at all. Access to sensitive documents
 * (ID, contract packs) is exactly the kind of action worth a real audit
 * trail — see docs/DECISIONS.md ("Document handling").
 */
export async function getDocumentDownloadUrl(
  supabase: TypedClient,
  params: {
    documentId: string;
    viewerParticipantId: string | null;
    viewerAccessMode: "proxy" | "guest" | "connected" | null;
    viewerOrganisationId: string | null;
  }
) {
  const doc = await documentsRepo.getDocumentById(supabase, params.documentId);
  if (!doc) throw new AppError("Document not found.");

  const url = await documentsRepo.createSignedDownloadUrl(supabase, doc.storage_path);

  // Routine professional views stay out of the shared feed everyone
  // (including the other side) sees, logged instead as internal to the
  // viewer's own firm — a guest has no firm to attribute it to, so shared
  // is their only option, and that's fine: a guest viewing something
  // already shared with them isn't sensitive information.
  const isGuestViewer = params.viewerAccessMode === "guest" || !params.viewerOrganisationId;

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: doc.chain_id,
    actor_participant_id: params.viewerParticipantId,
    action: "document.viewed",
    entity_type: "document",
    entity_id: doc.id,
    source: "manual",
    visibility: isGuestViewer ? "shared" : "internal",
    organisation_id: isGuestViewer ? null : params.viewerOrganisationId,
    metadata: { title: doc.title },
  });

  return url;
}

/**
 * Records the metadata row for a file that has ALREADY been uploaded to
 * Storage by the browser client (see documents-panel.tsx) — this function
 * never touches file bytes itself. Category restrictions (which
 * categories a guest may use, which require a conveyancer role) are
 * enforced by documents_guest_category_restricted and
 * documents_conveyancer_only_categories (0015) — this function supplies
 * whatever category the UI collected and lets the database be the actual
 * authority on whether it's allowed.
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
