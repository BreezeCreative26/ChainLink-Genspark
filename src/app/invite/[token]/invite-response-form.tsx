"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/app/invite/[token]/actions";
import type { AccountMatch } from "@/types/chain";

export function InviteResponseForm({
  token,
  accountMatch,
}: {
  token: string;
  accountMatch: AccountMatch | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAccept(decision: "link" | "guest") {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvitationAction(token, decision);
      if (result?.error) setError(result.error);
    });
  }

  function handleDecline() {
    setError(null);
    startTransition(async () => {
      const result = await declineInvitationAction(token);
      if (result?.error) {
        setError(result.error);
      } else {
        setDeclined(true);
      }
    });
  }

  if (declined) {
    return (
      <p className="text-sm text-muted-foreground">
        You&apos;ve declined this invitation. No further action is needed.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {accountMatch ? (
        <>
          <p className="text-sm text-foreground">
            You&apos;re part of <strong>{accountMatch.organisationName}</strong> on
            ChainLink. Would you like this chain to appear on your firm&apos;s
            dashboard too?
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => handleAccept("link")} disabled={isPending}>
              Yes, link to {accountMatch.organisationName}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAccept("guest")}
              disabled={isPending}
            >
              No, just add me personally
            </Button>
          </div>
        </>
      ) : (
        <Button onClick={() => handleAccept("guest")} disabled={isPending}>
          Accept invitation
        </Button>
      )}

      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDecline}
          disabled={isPending}
          className="text-muted-foreground"
        >
          Decline invitation
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
