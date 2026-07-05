"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addProxyParticipantAction } from "@/app/(app)/chains/[id]/proxy-actions";

export function AddProxyParticipantForm({
  chainId,
  managerParticipantId,
}: {
  chainId: string;
  managerParticipantId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"seller" | "buyer">("seller");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addProxyParticipantAction({
        chainId,
        fullName,
        role,
        managerParticipantId,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setFullName("");
      setShowForm(false);
    });
  }

  if (!showForm) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4" /> Add someone without email
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t border-border pt-3">
      <p className="text-xs text-muted-foreground">
        For someone who won&apos;t use ChainLink themselves — you&apos;ll
        enter updates on their behalf.
      </p>
      <Input
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Select value={role} onChange={(e) => setRole(e.target.value as "seller" | "buyer")}>
        <option value="seller">Seller</option>
        <option value="buyer">Buyer</option>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Adding…" : "Add"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
