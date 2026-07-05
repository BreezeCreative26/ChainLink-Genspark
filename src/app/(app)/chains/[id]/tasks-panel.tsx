"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createTaskAction, updateTaskStatusAction } from "@/app/(app)/chains/[id]/tasks-actions";
import type { Database } from "@/types/database";

type TaskStatus = Database["public"]["Tables"]["tasks"]["Row"]["status"];

interface TaskRow {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  visibility: "shared" | "internal";
  organisation_id: string | null;
}

const STATUS_OPTIONS: TaskStatus[] = ["open", "in_progress", "done"];

export function TasksPanel({
  chainId,
  myParticipantId,
  myOrganisationId,
  tasks,
}: {
  chainId: string;
  myParticipantId: string | null;
  myOrganisationId: string | null;
  tasks: TaskRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [keepInternal, setKeepInternal] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(task: TaskRow, status: TaskStatus) {
    if (!myParticipantId) return;
    startTransition(async () => {
      await updateTaskStatusAction({
        chainId,
        taskId: task.id,
        taskTitle: task.title,
        status,
        taskVisibility: task.visibility,
        taskOrganisationId: task.organisation_id,
        actorParticipantId: myParticipantId,
      });
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!myParticipantId) {
      setError("You need an active participant record on this chain to add a task.");
      return;
    }
    startTransition(async () => {
      const result = await createTaskAction({
        chainId,
        title,
        dueDate: dueDate || null,
        keepInternal: keepInternal && Boolean(myOrganisationId),
        organisationId: myOrganisationId,
        createdByParticipantId: myParticipantId,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      setDueDate("");
      setShowForm(false);
    });
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          No tasks yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{t.title}</p>
                <div className="flex items-center gap-2">
                  {t.due_date && (
                    <p className="text-xs text-muted-foreground">
                      Due {new Date(t.due_date).toLocaleDateString("en-GB")}
                    </p>
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    {t.visibility}
                  </Badge>
                </div>
              </div>
              <Select
                className="w-32 shrink-0"
                value={t.status}
                disabled={isPending}
                onChange={(e) => handleStatusChange(t, e.target.value as TaskStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form onSubmit={handleCreate} className="space-y-2 border-t border-border pt-4">
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          {myOrganisationId && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={keepInternal}
                onChange={(e) => setKeepInternal(e.target.checked)}
              />
              Keep internal to my firm
            </label>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding…" : "Add task"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      )}
    </div>
  );
}
