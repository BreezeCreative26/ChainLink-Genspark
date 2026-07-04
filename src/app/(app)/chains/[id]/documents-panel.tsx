"use client";

import { useState, useTransition } from "react";
import { Upload, FileText, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { recordDocumentUploadAction } from "@/app/(app)/chains/[id]/documents-actions";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/types/chain";

interface DocumentRow {
  id: string;
  title: string;
  category: DocumentCategory | null;
  downloadUrl: string | null;
  created_at: string;
}

export function DocumentsPanel({
  chainId,
  myParticipantId,
  documents,
}: {
  chainId: string;
  myParticipantId: string | null;
  documents: DocumentRow[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("id_verification");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose a file to upload.");
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
              {doc.downloadUrl && (
                <a
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={`Open ${doc.title}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleUpload} className="space-y-2 border-t border-border pt-4">
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Input
          placeholder="Document title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
        >
          {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={isPending}>
          <Upload className="h-4 w-4" /> {isPending ? "Uploading…" : "Upload document"}
        </Button>
      </form>
    </div>
  );
}
