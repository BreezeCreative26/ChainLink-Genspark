"use client";

import { useState, useTransition } from "react";
import { Upload, FileText, ExternalLink, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  recordDocumentUploadAction,
  getDocumentDownloadUrlAction,
} from "@/app/(app)/chains/[id]/documents-actions";
import { validateDocumentFile } from "@/lib/document-access";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/types/chain";

interface DocumentRow {
  id: string;
  title: string;
  category: DocumentCategory | null;
  created_at: string;
}

export function DocumentsPanel({
  chainId,
  myParticipantId,
  myAccessMode,
  myOrganisationId,
  documents,
  allowedCategories,
}: {
  chainId: string;
  myParticipantId: string | null;
  myAccessMode: "proxy" | "guest" | "connected" | null;
  myOrganisationId: string | null;
  documents: DocumentRow[];
  allowedCategories: DocumentCategory[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>(
    allowedCategories[0] ?? "other"
  );
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sharesSensitiveNote = category === "id_docs";

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    const validationError = validateDocumentFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!myParticipantId) {
      setError("You need an active participant record on this chain to upload.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const path = `${chainId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("chain-documents")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const result = await recordDocumentUploadAction({
        chainId,
        title: title.trim() || file.name,
        storagePath: path,
        mimeType: file.type || null,
        sizeBytes: file.size,
        category,
        uploadedByParticipantId: myParticipantId,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setFile(null);
      setTitle("");
    });
  }

  function handleOpen(doc: DocumentRow) {
    setOpeningId(doc.id);
    startTransition(async () => {
      const result = await getDocumentDownloadUrlAction({
        documentId: doc.id,
        viewerParticipantId: myParticipantId,
        viewerAccessMode: myAccessMode,
        viewerOrganisationId: myOrganisationId,
      });
      setOpeningId(null);
      if (result.error || !result.url) {
        setError(result.error ?? "Could not open this document.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm text-foreground">{doc.title}</span>
                {doc.category && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {DOCUMENT_CATEGORY_LABELS[doc.category]}
                  </Badge>
                )}
              </div>
              <button
                onClick={() => handleOpen(doc)}
                disabled={isPending && openingId === doc.id}
                className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-50"
                aria-label={`Open ${doc.title}`}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleUpload} className="space-y-2 border-t border-border pt-4">
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Input
          placeholder="Document title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
        >
          {allowedCategories.map((value) => (
            <option key={value} value={value}>
              {DOCUMENT_CATEGORY_LABELS[value]}
            </option>
          ))}
        </Select>

        {sharesSensitiveNote && (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 translate-y-0.5" />
            <span>
              ID documents are currently visible to everyone on this chain,
              not just your own side. Avoid uploading anything more
              sensitive than necessary until per-participant document
              access is available.
            </span>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={isPending}>
          <Upload className="h-4 w-4" /> {isPending ? "Uploading…" : "Upload document"}
        </Button>
        <p className="text-[11px] text-muted-foreground">PDF, JPEG, PNG, HEIC, or Word — up to 20MB.</p>
      </form>
    </div>
  );
}
