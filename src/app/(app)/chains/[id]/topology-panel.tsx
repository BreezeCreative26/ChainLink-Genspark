"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  CircleAlert,
  Clock3,
  Home,
  Link2,
  Plus,
  UserRound,
  Users,
} from "lucide-react";

import {
  addLinkedTransactionAction,
  updateTransactionParticipantsAction,
} from "@/app/(app)/chains/[id]/topology-actions";
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

interface ProgressMilestone {
  id: string;
  chainNodeId: string | null;
  title: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  dueDate: string | null;
  completedAt: string | null;
  sequenceIndex: number | null;
  createdAt: string;
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
  canManage,
  nodes,
  participants,
  milestones,
}: {
  chainId: string;
  myParticipantId: string | null;
  canManage: boolean;
  nodes: NodeRow[];
  participants: ParticipantRow[];
  milestones: ProgressMilestone[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [dependsOn, setDependsOn] = useState(nodes[0]?.id ?? "");
  const [sellerParticipantId, setSellerParticipantId] = useState("");
  const [buyerParticipantId, setBuyerParticipantId] = useState("");
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
        sellerParticipantId: sellerParticipantId || null,
        buyerParticipantId: buyerParticipantId || null,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setAddressLine1("");
      setCity("");
      setPostcode("");
      setSellerParticipantId("");
      setBuyerParticipantId("");
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

      <ChainProgressBoard
        nodes={orderedNodes}
        participants={participants}
        milestones={milestones}
      />

      <div className="border-t border-border pt-5">
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
          {canManage && !showForm && nodes.length > 0 && (
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
                    {canManage && (
                      <TransactionAssignmentEditor
                        chainId={chainId}
                        node={node}
                        participants={participants}
                      />
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {canManage && showForm && (
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
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              aria-label="Seller for new transaction"
              value={sellerParticipantId}
              onChange={(event) => setSellerParticipantId(event.target.value)}
            >
              <option value="">Seller not assigned yet</option>
              {participants
                .filter((participant) => participant.role === "seller")
                .map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    Seller: {participant.name}
                  </option>
                ))}
            </Select>
            <Select
              aria-label="Buyer for new transaction"
              value={buyerParticipantId}
              onChange={(event) => setBuyerParticipantId(event.target.value)}
            >
              <option value="">Buyer not assigned yet</option>
              {participants
                .filter((participant) => participant.role === "buyer")
                .map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    Buyer: {participant.name}
                  </option>
                ))}
            </Select>
          </div>
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

function TransactionAssignmentEditor({
  chainId,
  node,
  participants,
}: {
  chainId: string;
  node: NodeRow;
  participants: ParticipantRow[];
}) {
  const [sellerParticipantId, setSellerParticipantId] = useState(
    node.sellerParticipantId ?? ""
  );
  const [buyerParticipantId, setBuyerParticipantId] = useState(
    node.buyerParticipantId ?? ""
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sellerOptions = participants.filter((participant) => participant.role === "seller");
  const buyerOptions = participants.filter((participant) => participant.role === "buyer");
  const unchanged =
    sellerParticipantId === (node.sellerParticipantId ?? "") &&
    buyerParticipantId === (node.buyerParticipantId ?? "");

  function saveAssignments() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateTransactionParticipantsAction({
        chainId,
        nodeId: node.id,
        sellerParticipantId: sellerParticipantId || null,
        buyerParticipantId: buyerParticipantId || null,
      });
      setMessage(result?.error ?? "Transaction parties updated.");
    });
  }

  return (
    <section className="border-t border-border bg-slate-50/70 px-4 py-3" aria-label="Assign transaction parties">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="space-y-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Seller
          <Select
            value={sellerParticipantId}
            onChange={(event) => {
              setSellerParticipantId(event.target.value);
              setMessage(null);
            }}
            className="mt-1 bg-white text-xs normal-case tracking-normal"
          >
            <option value="">Not assigned</option>
            {sellerOptions.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Buyer
          <Select
            value={buyerParticipantId}
            onChange={(event) => {
              setBuyerParticipantId(event.target.value);
              setMessage(null);
            }}
            className="mt-1 bg-white text-xs normal-case tracking-normal"
          >
            <option value="">Not assigned</option>
            {buyerOptions.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.name}
              </option>
            ))}
          </Select>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || unchanged}
          onClick={saveAssignments}
        >
          {isPending ? "Saving…" : "Save parties"}
        </Button>
      </div>
      {message && (
        <p
          className={cn(
            "mt-2 text-xs",
            message === "Transaction parties updated." ? "text-emerald-700" : "text-destructive"
          )}
          role="status"
        >
          {message}
        </p>
      )}
      {(sellerOptions.length === 0 || buyerOptions.length === 0) && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Invite the missing seller or buyer, then return here to attach them to this transaction.
        </p>
      )}
    </section>
  );
}

function ChainProgressBoard({
  nodes,
  participants,
  milestones,
}: {
  nodes: NodeRow[];
  participants: ParticipantRow[];
  milestones: ProgressMilestone[];
}) {
  const stages = useMemo(() => {
    const byTitle = new Map<
      string,
      { title: string; sequenceIndex: number; createdAt: string }
    >();

    for (const milestone of milestones) {
      const existing = byTitle.get(milestone.title);
      const sequenceIndex = milestone.sequenceIndex ?? 10_000;
      if (!existing || sequenceIndex < existing.sequenceIndex) {
        byTitle.set(milestone.title, {
          title: milestone.title,
          sequenceIndex,
          createdAt: milestone.createdAt,
        });
      }
    }

    return [...byTitle.values()].sort(
      (a, b) =>
        a.sequenceIndex - b.sequenceIndex ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.title.localeCompare(b.title)
    );
  }, [milestones]);

  function participantForNodeSide(node: NodeRow, side: "seller" | "buyer") {
    const participantId =
      side === "seller" ? node.sellerParticipantId : node.buyerParticipantId;
    const explicit = participants.find((participant) => participant.id === participantId);
    if (explicit) return explicit;

    if (nodes.length === 1) {
      const matches = participants.filter((participant) => participant.role === side);
      if (matches.length === 1) return matches[0];
    }

    return undefined;
  }

  function milestoneFor(nodeId: string, title: string) {
    return milestones.find(
      (milestone) => milestone.chainNodeId === nodeId && milestone.title === title
    ) ?? milestones.find(
      (milestone) => milestone.chainNodeId === null && milestone.title === title
    );
  }

  const totalSteps = nodes.length * stages.length;
  const completedSteps = nodes.reduce(
    (total, node) =>
      total +
      stages.filter(
        (stage) => milestoneFor(node.id, stage.title)?.status === "completed"
      ).length,
    0
  );
  const blockedSteps = nodes.reduce(
    (total, node) =>
      total +
      stages.filter(
        (stage) => milestoneFor(node.id, stage.title)?.status === "blocked"
      ).length,
    0
  );
  const overallProgress =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  if (nodes.length === 0 || stages.length === 0) {
    return (
      <section aria-labelledby="customer-progress-title">
        <div className="mb-3">
          <h3 id="customer-progress-title" className="text-sm font-semibold text-foreground">
            Customer progress
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each row will show one transaction moving through every conveyancing stage.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {nodes.length === 0 ? "No customer transactions yet" : "No progress stages set up yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a property transaction and milestones to build the full-chain view.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="customer-progress-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="customer-progress-title" className="text-sm font-semibold text-foreground">
            Customer progress
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One row per customer transaction. Read from left to right to see the complete chain.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight text-foreground">{overallProgress}%</p>
          <p className="text-[11px] text-muted-foreground">
            {completedSteps} of {totalSteps} steps complete
          </p>
        </div>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-label="Overall chain progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={overallProgress}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {blockedSteps > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <CircleAlert className="h-4 w-4 shrink-0" />
          {blockedSteps} {blockedSteps === 1 ? "step is" : "steps are"} currently blocking the chain.
        </div>
      )}

      <ol className="space-y-4" aria-label="Every transaction and conveyancing stage">
        {nodes.map((node, nodeIndex) => {
          const seller = participantForNodeSide(node, "seller");
          const buyer = participantForNodeSide(node, "buyer");
          const nodeMilestones = stages.map((stage) => ({
            stage,
            milestone: milestoneFor(node.id, stage.title),
          }));
          const current =
            nodeMilestones.find(({ milestone }) => milestone?.status === "blocked") ??
            nodeMilestones.find(({ milestone }) => milestone?.status === "in_progress") ??
            nodeMilestones.find(({ milestone }) => milestone?.status !== "completed") ??
            nodeMilestones[nodeMilestones.length - 1];
          const nodeComplete = nodeMilestones.filter(
            ({ milestone }) => milestone?.status === "completed"
          ).length;
          const nodeProgress = Math.round((nodeComplete / stages.length) * 100);

          return (
            <li key={node.id} className="relative">
              {nodeIndex > 0 && (
                <div className="mx-auto -mt-4 flex h-8 w-px items-center justify-center bg-primary/25" aria-hidden="true">
                  <ArrowDown className="h-4 w-4 shrink-0 text-primary" />
                </div>
              )}
              <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <header className="grid gap-4 border-b border-border bg-muted/25 p-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.65fr)] md:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                      {nodeIndex + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Property transaction
                      </p>
                      <h4 className="mt-0.5 truncate text-sm font-semibold text-foreground">{node.address}</h4>
                      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <span className={seller ? "text-foreground" : "text-amber-700"}>
                          {seller?.name ?? "Seller not assigned"}
                        </span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        <span className={buyer ? "text-foreground" : "text-amber-700"}>
                          {buyer?.name ?? "Buyer not assigned"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/80 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {current?.milestone?.status === "blocked" ? "Blocked at" : "Current stage"}
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {nodeProgress === 100 ? "All stages complete" : current?.stage.title ?? "Not started"}
                        </p>
                      </div>
                      <Badge variant={nodeProgress === 100 ? "success" : current?.milestone?.status === "blocked" ? "destructive" : "outline"}>
                        {nodeProgress}%
                      </Badge>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" aria-label={`${nodeProgress}% complete`}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${nodeProgress}%` }} />
                    </div>
                  </div>
                </header>

                <ol className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={`Stages for ${node.address}`}>
                  {nodeMilestones.map(({ stage, milestone }, stageIndex) => {
                    const overdue =
                      Boolean(milestone?.dueDate) &&
                      milestone?.status !== "completed" &&
                      new Date(`${milestone!.dueDate}T23:59:59`).getTime() < Date.now();
                    const isCurrent = current?.stage.title === stage.title && nodeProgress < 100;

                    return (
                      <li
                        key={stage.title}
                        className={cn(
                          "min-h-24 bg-card p-3",
                          progressStatusClass(milestone?.status, "cell"),
                          isCurrent && "ring-2 ring-inset ring-primary/35"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-muted-foreground shadow-sm ring-1 ring-border">
                            {stageIndex + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold leading-snug text-foreground">{stage.title}</p>
                              <ProgressIcon status={milestone?.status} />
                            </div>
                            <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                              {progressStatusLabel(milestone?.status)}
                            </p>
                            {milestone?.dueDate && (
                              <p className={cn("mt-1 text-[10px]", overdue ? "font-semibold text-red-700" : "text-muted-foreground")}>
                                {overdue ? "Overdue" : "Due"} {formatDueDate(milestone.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </article>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        {([
          ["completed", "Complete"],
          ["in_progress", "In progress"],
          ["blocked", "Blocked"],
          ["pending", "Not started"],
        ] as const).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", progressStatusClass(status, "dot"))} />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProgressIcon({ status }: { status: ProgressMilestone["status"] | undefined }) {
  if (status === "completed") {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />;
  }
  if (status === "in_progress") {
    return <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />;
  }
  if (status === "blocked") {
    return <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />;
  }
  return <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />;
}

function progressStatusLabel(status: ProgressMilestone["status"] | undefined) {
  if (status === "completed") return "Complete";
  if (status === "in_progress") return "In progress";
  if (status === "blocked") return "Blocked";
  return "Not started";
}

function progressStatusClass(
  status: ProgressMilestone["status"] | undefined,
  element: "bar" | "cell" | "dot"
) {
  if (element === "cell") {
    if (status === "completed") return "bg-emerald-50/70";
    if (status === "in_progress") return "bg-amber-50/80";
    if (status === "blocked") return "bg-red-50/80";
    return "bg-card";
  }

  if (status === "completed") return "bg-emerald-500";
  if (status === "in_progress") return "bg-amber-500";
  if (status === "blocked") return "bg-red-500";
  return "bg-slate-200";
}

function formatDueDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
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
