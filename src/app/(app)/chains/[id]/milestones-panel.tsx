"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmMilestoneAction } from "@/app/(app)/chains/[id]/milestones-actions";
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

export function MilestonesPanel({
  chainId,
  myParticipantId,
  isGuest,
  milestones,
}: {
  chainId: string;
  myParticipantId: string | null;
  isGuest: boolean;
  milestones: MilestoneRow[];
}) {
  const [isPending, startTransition] = useTransition();

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

  if (milestones.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        No milestones yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {milestones.map((m) => {
        const Icon = STATUS_ICON[m.status];
        // A guest can confirm ONLY milestones flagged guest_confirmable
        // that are still outstanding — this mirrors the database's own
        // enforcement (0012_guest_capabilities.sql) so the button never
        // offers an action the server would refuse.
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
            ) : (
              <span className="text-xs capitalize text-muted-foreground">
                {m.status.replace("_", " ")}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
