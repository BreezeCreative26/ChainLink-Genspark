"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createChainAction } from "@/app/(app)/chains/actions";
import type {
  ChainCreatorRole,
  ChainParticipantRole,
  InitialInvitationInput,
} from "@/types/chain";

const CREATOR_ROLE_OPTIONS: { value: ChainCreatorRole; label: string }[] = [
  { value: "sellers_agent", label: "Seller's estate agent" },
  { value: "seller", label: "Seller" },
  { value: "buyer", label: "Buyer" },
];

const INVITEE_ROLE_OPTIONS: { value: ChainParticipantRole; label: string }[] = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "buyers_agent", label: "Buyer's estate agent" },
  { value: "sellers_agent", label: "Seller's estate agent" },
  { value: "sellers_conveyancer", label: "Seller's conveyancer" },
  { value: "buyers_conveyancer", label: "Buyer's conveyancer" },
  { value: "broker", label: "Broker / progression staff" },
];

export function NewChainForm() {
  const [creatorRole, setCreatorRole] = useState<ChainCreatorRole>("sellers_agent");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [invitations, setInvitations] = useState<InitialInvitationInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addInvitationRow() {
    setInvitations((prev) => [...prev, { email: "", role: "buyer" }]);
  }

  function updateInvitation(index: number, patch: Partial<InitialInvitationInput>) {
    setInvitations((prev) =>
      prev.map((inv, i) => (i === index ? { ...inv, ...patch } : inv))
    );
  }

  function removeInvitation(index: number) {
    setInvitations((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!addressLine1.trim()) {
      setError("Property address is required.");
      return;
    }

    startTransition(async () => {
      const result = await createChainAction({
        creatorRole,
        property: {
          addressLine1: addressLine1.trim(),
          city: city.trim() || undefined,
          postcode: postcode.trim() || undefined,
          listingPrice: listingPrice ? Number(listingPrice) : undefined,
        },
        initialInvitations: invitations.filter((i) => i.email.trim()),
      });

      // A successful create redirects server-side and never returns here.
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your role on this chain</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={creatorRole}
            onChange={(e) => setCreatorRole(e.target.value as ChainCreatorRole)}
          >
            {CREATOR_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            If you have a ChainLink business account, this chain will
            automatically appear on your firm&apos;s dashboard.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Address line 1
            </label>
            <Input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="14 Mill Lane"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chester" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Postcode</label>
              <Input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="CH1 2AB"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Listing price (optional)
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              placeholder="285000"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite others (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Anyone you add here gets an email invitation scoped to this
            chain. They won&apos;t need a ChainLink account to join.
          </p>

          {invitations.map((inv, index) => (
            <div key={index} className="flex items-start gap-2">
              <Input
                type="email"
                placeholder="name@example.com"
                value={inv.email}
                onChange={(e) => updateInvitation(index, { email: e.target.value })}
                className="flex-1"
              />
              <Select
                value={inv.role}
                onChange={(e) =>
                  updateInvitation(index, {
                    role: e.target.value as ChainParticipantRole,
                  })
                }
                className="w-56 shrink-0"
              >
                {INVITEE_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeInvitation(index)}
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addInvitationRow}>
            <Plus className="h-4 w-4" /> Add a participant
          </Button>

          <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Adding someone without an email (proxy mode, e.g. tracking
            updates on behalf of a party who won&apos;t use ChainLink
            directly) is coming in a future update.
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating chain…" : "Create chain"}
        </Button>
      </div>
    </form>
  );
}
