"use client";

import { useState, useTransition } from "react";
import { Plus, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addLinkedTransactionAction } from "@/app/(app)/chains/[id]/topology-actions";

interface NodeRow {
  id: string;
  sequenceIndex: number | null;
  dependsOnNodeId: string | null;
  address: string;
}

export function TopologyPanel({
  chainId,
  myParticipantId,
  readOnly,
  nodes,
}: {
  chainId: string;
  myParticipantId: string | null;
  readOnly: boolean;
  nodes: NodeRow[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [dependsOn, setDependsOn] = useState(nodes[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function nodeLabel(id: string | null) {
    return nodes.find((n) => n.id === id)?.address ?? "—";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="space-y-4">
      <ul className="space-y-2">
        {nodes.map((n) => (
          <li key={n.id} className="flex items-center gap-2 text-sm text-foreground">
            <span>{n.address}</span>
            {n.dependsOnNodeId && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3" /> depends on {nodeLabel(n.dependsOnNodeId)}
              </span>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (showForm ? (
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            E.g. the seller&apos;s own onward purchase — a second property
            whose completion depends on this chain.
          </p>
          <Input
            placeholder="Address line 1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input
              placeholder="Postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
          </div>
          <Select value={dependsOn} onChange={(e) => setDependsOn(e.target.value)}>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                Depends on: {n.address}
              </option>
            ))}
          </Select>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding…" : "Add transaction"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add linked transaction
        </Button>
      ))}
    </div>
  );
}
