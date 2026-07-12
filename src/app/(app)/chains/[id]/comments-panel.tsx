"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { addCommentAction } from "@/app/(app)/chains/[id]/comments-actions";

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  authorName: string;
}

export function CommentsPanel({
  chainId,
  myParticipantId,
  readOnly,
  comments,
}: {
  chainId: string;
  myParticipantId: string | null;
  readOnly: boolean;
  comments: CommentRow[];
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!myParticipantId) {
      setError("You need an active participant record on this chain to comment.");
      return;
    }

    startTransition(async () => {
      const result = await addCommentAction({ chainId, body, myParticipantId });
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
        Visible to everyone on this chain, including guests.
      </p>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px]">
                  {c.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{c.authorName}</p>
                <p className="text-sm text-muted-foreground">{c.body}</p>
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
          placeholder="Add a comment…"
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Posting…" : "Post comment"}
        </Button>
        </form>
      )}
    </div>
  );
}
