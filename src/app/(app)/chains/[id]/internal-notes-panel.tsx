"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { addInternalNoteAction } from "@/app/(app)/chains/[id]/internal-notes-actions";

interface InternalNoteRow {
  id: string;
  body: string;
  created_at: string;
  authorName: string;
}

export function InternalNotesPanel({
  chainId,
  organisationId,
  myParticipantId,
  readOnly,
  notes,
}: {
  chainId: string;
  organisationId: string;
  myParticipantId: string | null;
  readOnly: boolean;
  notes: InternalNoteRow[];
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!myParticipantId) {
      setError("You need an active participant record on this chain to add a note.");
      return;
    }

    startTransition(async () => {
      const result = await addInternalNoteAction({
        chainId,
        body,
        organisationId,
        myParticipantId,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setBody("");
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Only visible within your firm — never shown to other participants
        on this chain.
      </p>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No internal notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start gap-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px]">
                  {n.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{n.authorName}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-border pt-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add an internal note…"
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Posting…" : "Post note"}
        </Button>
        </form>
      )}
    </div>
  );
}
