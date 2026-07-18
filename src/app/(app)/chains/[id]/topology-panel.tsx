"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleAlert,
  Home,
  Link2,
  Plus,
  UserRound,
  Users,
} from "lucide-react";

import { addLinkedTransactionAction } from "@/app/(app)/chains/[id]/topology-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface NodeRow {
  id: string;
  sequenceIndex: number | null;
  dependsOnNodeId: string | null;
  status: "active" | "exchanged" | "completed" | "fallen_through";
  sellerParticipantId: string | null;
  buyerParticipantId: string | null;
  address: string;
  postcode: string | null;
}

interface ParticipantRow {
  id: string;
  profileId: string;
  name: string;
  role: string;
  accessMode: string;
  isCurrentUser: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  seller: "Seller",
  buyer: "Buyer",
  sellers_agent: "Seller's agent",
  buyers_agent: "Buyer's agent",
  sellers_conveyancer: "Seller's conveyancer",
  buyers_conveyancer: "Buyer's conveyancer",
  broker: "Broker",
};

const ROLE_ORDER: Record<string, number> = {
  seller: 0,
  sellers_agent: 1,
  sellers_conveyancer: 2,
  broker: 3,
  buyers_conveyancer: 4,
  buyers_agent: 5,
  buyer: 6,
};

const STATUS_LABELS: Record<NodeRow["status"], string> = {
  active: "In progress",
  exchanged: "Exchanged",
  completed: "Complete",
  fallen_through: "Fallen through",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

export function TopologyPanel({
  chainId,
  myParticipantId,
  readOnly,
  nodes,
  participants,
}: {
  chainId: string;
  myParticipantId: string | null;
  readOnly: boolean;
  nodes: NodeRow[];
  participants: ParticipantRow[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [dependsOn, setDependsOn] = useState(nodes[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const orderedParticipants = useMemo(
    () =>
      [...participants].sort(
        (a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
      ),
    [participants]
  );

  const orderedNodes = useMemo(
    () =>
      [...nodes].sort(
        (a, b) =>
          (a.sequenceIndex ?? Number.MAX_SAFE_INTEGER) -
          (b.sequenceIndex ?? Number.MAX_SAFE_INTEGER)
      ),
    [nodes]
  );

  function nodeLabel(id: string | null) {
    return nodes.find((node) => node.id === id)?.address ?? "another transaction";
  }

  function participantForSide(
    node: NodeRow,
    side: "seller" | "buyer"
  ): ParticipantRow | undefined {
    const explicitId =
      side === "seller" ? node.sellerParticipantId : node.buyerParticipantId;
    const explicit = participants.find((participant) => participant.id === explicitId);
    if (explicit) return explicit;

    // Older single-property chains did not always populate the node-side IDs.
    // The chain-level role is unambiguous in this shape, so keep the visual
    // useful without pretending we can infer sides on a branching chain.
    if (nodes.length === 1) {
      const candidates = participants.filter((participant) => participant.role === side);
      if (candidates.length === 1) return candidates[0];
    }

    return undefined;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!myParticipantId) {
      setError("You need an active participant record on this chain to add a transaction.");
      return;
    }
    if (!dependsOn) {
      setError("Choose which existing transaction this depends on.");
      return;
    }

    startTransition(async () => {
      const result = await addLinkedTransactionAction({
        chainId,
        addressLine1,
        city,
        postcode,
        dependsOnNodeId: dependsOn,
        actorParticipantId: myParticipantId,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setAddressLine1("");
      setCity("");
      setPostcode("");
      setShowForm(false);
    });
  }

  return (
    <section aria-label="Chain visual" className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="accent" className="gap-1.5">
          <Users className="h-3 w-3" />
          {participants.length} {participants.length === 1 ? "person" : "people"}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <Home className="h-3 w-3" />
          {nodes.length} {nodes.length === 1 ? "transaction" : "transactions"}
        </Badge>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live chain
        </span>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">People in this chain</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Everyone below has accepted access to this workspace.
            </p>
          </div>
        </div>

        {orderedParticipants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No active participants are connected yet.
          </div>
        ) : (
          <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {orderedParticipants.map((participant) => (
              <li
                key={participant.id}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border bg-card px-3 py-3 shadow-sm",
                  participant.isCurrentUser
                    ? "border-primary/40 bg-accent/45 ring-1 ring-primary/10"
                    : "border-border"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    participant.isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {initials(participant.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {participant.isCurrentUser ? "You" : participant.name}
                    </span>
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Connected" />
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[participant.role] ?? participant.role}
                    {participant.isCurrentUser && participant.name
                      ? ` · ${participant.name}`
                      : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="border-t border-border pt-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Transaction path</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Arrows show which property must progress before the next can complete.
            </p>
          </div>
          {!readOnly && !showForm && nodes.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add transaction
            </Button>
          )}
        </div>

        {orderedNodes.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">This chain has no property transaction.</p>
                <p className="mt-0.5 text-xs text-amber-800">
                  Add the first property before tracking the chain path.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ol className="space-y-0">
            {orderedNodes.map((node, index) => {
              const seller = participantForSide(node, "seller");
              const buyer = participantForSide(node, "buyer");
              const statusVariant =
                node.status === "completed"
                  ? "success"
                  : node.status === "fallen_through"
                    ? "destructive"
                    : node.status === "exchanged"
                      ? "accent"
                      : "secondary";

              return (
                <li key={node.id}>
                  {index > 0 && (
                    <div className="relative ml-6 flex h-10 items-center sm:ml-8">
                      <span className="absolute bottom-0 left-0 top-0 w-px bg-primary/25" />
                      <span className="flex items-center gap-2 pl-4 text-[11px] text-muted-foreground">
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        Depends on {nodeLabel(node.dependsOnNodeId)}
                      </span>
                    </div>
                  )}

                  <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3.5">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                          <Home className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {node.address}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {node.postcode ?? `Transaction ${index + 1}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusVariant}>{STATUS_LABELS[node.status]}</Badge>
                    </header>

                    <div className="grid items-center gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_1fr]">
                      <SidePerson label="Selling" participant={seller} align="left" />
                      <div className="flex items-center justify-center text-primary" aria-hidden="true">
                        <span className="hidden h-px w-8 bg-primary/30 sm:block" />
                        <ArrowRight className="h-4 w-4" />
                        <span className="hidden h-px w-8 bg-primary/30 sm:block" />
                      </div>
                      <SidePerson label="Buying" participant={buyer} align="right" />
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {!readOnly && showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-2">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Add an onward transaction</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add another property whose completion relies on one already in this chain.
              </p>
            </div>
          </div>
          <Input
            placeholder="Address line 1"
            value={addressLine1}
            onChange={(event) => setAddressLine1(event.target.value)}
            required
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="City"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
            <Input
              placeholder="Postcode"
              value={postcode}
              onChange={(event) => setPostcode(event.target.value)}
            />
          </div>
          <Select value={dependsOn} onChange={(event) => setDependsOn(event.target.value)}>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                Depends on: {node.address}
              </option>
            ))}
          </Select>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding…" : "Add to chain"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function SidePerson({
  label,
  participant,
  align,
}: {
  label: string;
  participant: ParticipantRow | undefined;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex items-center gap-2", align === "right" && "sm:flex-row-reverse")}>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          participant ? "bg-accent text-accent-foreground" : "border border-dashed border-border text-muted-foreground"
        )}
      >
        {participant ? (
          <span className="text-[10px] font-semibold">{initials(participant.name)}</span>
        ) : (
          <UserRound className="h-3.5 w-3.5" />
        )}
      </span>
      <span className={cn("min-w-0", align === "right" && "sm:text-right")}>
        <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="block truncate text-xs font-medium text-foreground">
          {participant
            ? participant.isCurrentUser
              ? "You"
              : participant.name
            : `${label === "Selling" ? "Seller" : "Buyer"} not connected`}
        </span>
      </span>
    </div>
  );
}
