"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  addTeamMemberAction,
  removeTeamMemberAction,
} from "@/app/(app)/settings/organisation/actions";
import type { Database } from "@/types/database";

type MembershipRole = Database["public"]["Tables"]["memberships"]["Row"]["role"];

const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: "Owner",
  admin: "Admin",
  agent: "Agent",
  conveyancer: "Conveyancer",
  staff: "Staff",
};

interface TeamMemberRow {
  id: string;
  role: MembershipRole;
  status: "active" | "invited" | "removed";
  name: string;
}

export function TeamPanel({
  organisationId,
  isAdmin,
  members,
}: {
  organisationId: string;
  isAdmin: boolean;
  members: TeamMemberRow[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("agent");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addTeamMemberAction({ organisationId, email, role });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEmail("");
      setShowForm(false);
    });
  }

  function handleRemove(membershipId: string) {
    startTransition(async () => {
      await removeTeamMemberAction(membershipId);
    });
  }

  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {activeMembers.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{m.name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[m.role]}</p>
            </div>
            {isAdmin && m.role !== "owner" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={isPending}
                onClick={() => handleRemove(m.id)}
                aria-label="Remove teammate"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {isAdmin &&
        (showForm ? (
          <form onSubmit={handleAdd} className="space-y-2 border-t border-border pt-4">
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              They need an existing ChainLink account — inviting someone
              who hasn&apos;t signed up yet isn&apos;t supported here.
            </p>
            <Select value={role} onChange={(e) => setRole(e.target.value as MembershipRole)}>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="conveyancer">Conveyancer</option>
              <option value="staff">Staff</option>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Adding…" : "Add teammate"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add teammate
          </Button>
        ))}
    </div>
  );
}
