import type { AccessMode, ChainParticipantRole, DocumentCategory } from "@/types/chain";

const GUEST_ALLOWED: DocumentCategory[] = ["id_docs", "sales_forms", "other"];

const CONVEYANCER_ONLY: DocumentCategory[] = ["contract_pack", "search_results"];

const ALL_CATEGORIES: DocumentCategory[] = [
  "memorandum_of_sale",
  "id_docs",
  "sales_forms",
  "epc",
  "contract_pack",
  "search_results",
  "mortgage_offer",
  "other",
];

/**
 * Mirrors the storage.buckets limits set in
 * 0015_document_categories_and_rules.sql — checked client-side for
 * immediate feedback, enforced server-side (by Storage itself) regardless.
 */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large — the limit is 20MB.";
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return "That file type isn't supported. Use PDF, JPEG, PNG, HEIC, or Word.";
  }
  return null;
}

/**
 * Mirrors the database's role-based upload rules
 * (0015_document_categories_and_rules.sql) so the upload form only ever
 * offers categories the server will actually accept. This is a UX
 * convenience, not the enforcement — the database is the source of truth
 * and re-checks this independently regardless of what the client sends.
 *
 * COMPLIANCE NOTE: as in the migration, this specific mapping is a product
 * default subject to legal review, not a compliance ruling.
 */
export function getAllowedDocumentCategories(
  accessMode: AccessMode | null,
  role: ChainParticipantRole | null
): DocumentCategory[] {
  if (accessMode === "guest" || accessMode === null) {
    return GUEST_ALLOWED;
  }

  const isConveyancer = role === "sellers_conveyancer" || role === "buyers_conveyancer";
  if (isConveyancer) {
    return ALL_CATEGORIES;
  }

  return ALL_CATEGORIES.filter((c) => !CONVEYANCER_ONLY.includes(c));
}
