"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Clock, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  confirmMilestoneAction,
  createMilestoneAction,
  updateMilestoneStatusAction,
} from "@/app/(app)/chains/[id]/milestones-actions";
import type { MilestoneStatus } from "@/types/chain";

interface MilestoneRow {
  id: string;
  title: string;
  status: MilestoneStatus;
  due_date: string | null;
  guest_confirmable: boolean;
}

const STATUS_ICON: Record<MilestoneStatus, typeof Circle> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  blocked: Circle,
};

const STATUS_OPTIONS: MilestoneStatus[] = ["pending", "in_progress", "completed", "blocked"];

export function MilestonesPanel({
  chainId,
  myParticipantId,
  myOrganisationId,
  isGuest,
  readOnly,
  milestones,
}: {
  chainId: string;
  myParticipantId: string | null;
  myOrganisationId: string | null;
  isGuest: boolean;
  readOnly: boolean;
  milestones: MilestoneRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [guestConfirmable, setGuestConfirmable] = useState(false);
  const [keepInternal, setKeepInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm(milestone: MilestoneRow) {
    if (!myParticipantId) return;
    startTransition(async () => {
      await confirmMilestoneAction({
        chainId,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        myParticipantId,
      });
    });
  }

  function handleStatusChange(milestone: MilestoneRow, status: MilestoneStatus) {
    if (!myParticipantId) return;
    startTransition(async () => {
      await updateMilestoneStatusAction({
        chainId,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        status,
        myParticipantId,
      });
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!myParticipantId) {
      setError("You need an active participant record on this chain to add a milestone.");
      return;
    }
    startTransition(async () => {
      const result = await createMilestoneAction({
        chainId,
        title,
        dueDate: dueDate || null,
        guestConfirmable,
        keepInternal,
        organisationId: myOrganisationId,
        createdByParticipantId: myParticipantId,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      setDueDate("");
      setGuestConfirmable(false);
      setKeepInternal(false);
      setShowForm(false);
    });
  }

  return (
    <div className="space-y-4">
      {milestones.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          No milestones yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {milestones.map((m) => {
            const Icon = STATUS_ICON[m.status];
            // A guest can confirm ONLY milestones flagged guest_confirmable
            // that are still outstanding — mirrors the database's own
            // enforcement (0012_guest_capabilities.sql).
            const canConfirm = isGuest && m.guest_confirmable && m.status !== "completed";

            return (
              <li key={m.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon
                    className={
                      m.status === "completed"
                        ? "h-4 w-4 text-success"
                        : "h-4 w-4 text-muted-foreground"
                    }
                  />
                  <span className="text-sm text-foreground">{m.title}</span>
                  {m.guest_confirmable && (
                    <Badge variant="outline" className="text-[10px]">
                      Guest-confirmable
                    </Badge>
                  )}
                </div>
                {canConfirm ? (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleConfirm(m)}>
                    Confirm
                  </Button>
                ) : isGuest || readOnly ? (
                  <span className="text-xs capitalize text-muted-foreground">
                    {m.status.replace("_", " ")}
                  </span>
                ) : (
                  <Select
                    className="w-40"
                    value={m.status}
                    disabled={isPending}
                    onChange={(e) => handleStatusChange(m, e.target.value as MilestoneStatus)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </Select>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!isGuest && !readOnly &&
        (showForm ? (
          <form onSubmit={handleCreate} className="space-y-2 border-t border-border pt-4">
            <Input
              placeholder="Milestone title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={guestConfirmable}
                onChange={(e) => setGuestConfirmable(e.target.checked)}
              />
              Let guests confirm this themselves
            </label>
            {myOrganisationId && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={keepInternal}
                  onChange={(e) => setKeepInternal(e.target.checked)}
                />
                Keep internal to my firm (not visible to other participants)
              </label>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Adding…" : "Add milestone"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add milestone
          </Button>
        ))}
    </div>
  );
}
