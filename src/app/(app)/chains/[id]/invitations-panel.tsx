"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  inviteParticipantAction,
  revokeInvitationAction,
} from "@/app/(app)/chains/[id]/invitations-actions";
import type { ChainParticipantRole, InvitationStatus } from "@/types/chain";

const ROLE_LABELS: Record<ChainParticipantRole, string> = {
  seller: "Seller",
  buyer: "Buyer",
  sellers_agent: "Seller's agent",
  buyers_agent: "Buyer's agent",
  sellers_conveyancer: "Seller's conveyancer",
  buyers_conveyancer: "Buyer's conveyancer",
  broker: "Broker",
};

const STATUS_BADGE: Record<
  InvitationStatus,
  { label: string; variant: "secondary" | "success" | "destructive" | "outline" }
> = {
  invited: { label: "Invited", variant: "secondary" },
  viewed: { label: "Viewed", variant: "secondary" },
  accepted: { label: "Accepted", variant: "success" },
  linked: { label: "Linked to firm", variant: "success" },
  declined: { label: "Declined", variant: "destructive" },
  inactive: { label: "Inactive", variant: "outline" },
};

interface InvitationRow {
  id: string;
  email: string;
  role: ChainParticipantRole;
  status: InvitationStatus;
  created_at: string;
}

export function InvitationsPanel({
  chainId,
  myParticipantId,
  readOnly,
  invitations,
}: {
  chainId: string;
  myParticipantId: string | null;
  readOnly: boolean;
  invitations: InvitationRow[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ChainParticipantRole>("buyer");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!myParticipantId) {
      setError("You need an active participant record on this chain to invite others.");
      return;
    }

    startTransition(async () => {
      const result = await inviteParticipantAction({
        chainId,
        invitedByParticipantId: myParticipantId,
        email,
        role,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEmail("");
      setShowForm(false);
    });
  }

  function handleRevoke(invitationId: string) {
    startTransition(async () => {
      await revokeInvitationAction(chainId, invitationId);
    });
  }

  return (
    <div className="space-y-4">
      {invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
      ) : (
        <ul className="space-y-3">
          {invitations.map((inv) => {
            const badge = STATUS_BADGE[inv.status];
            const canRevoke = inv.status === "invited" || inv.status === "viewed";
            return (
              <li key={inv.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[inv.role]}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={badge.variant} className="text-[10px]">
                    {badge.label}
                  </Badge>
                  {canRevoke && !readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isPending}
                      onClick={() => handleRevoke(inv.id)}
                      aria-label="Revoke invitation"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (showForm ? (
        <form onSubmit={handleInvite} className="space-y-2 border-t border-border pt-4">
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as ChainParticipantRole)}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Sending…" : "Send invite"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Invite someone
        </Button>
      ))}
    </div>
  );
}
