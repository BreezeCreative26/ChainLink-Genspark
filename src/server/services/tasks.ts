import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import * as tasksRepo from "@/server/repositories/tasks.repository";
import * as chainsRepo from "@/server/repositories/chains.repository";

type TypedClient = SupabaseClient<Database>;

export async function listTasks(supabase: TypedClient, chainId: string) {
  return tasksRepo.listTasksForChain(supabase, chainId);
}

/**
 * Tasks default to 'internal' — most tasks are a firm's own working items
 * ("chase searches"), matching the schema default from
 * docs/data-model.md. A guest never reaches this function (no create UI
 * is shown to them — see tasks-panel.tsx), but nothing here special-cases
 * that; RLS (tasks_insert, 0008) and the org-visibility rule
 * (internal_task_requires_org) are what actually enforce it regardless.
 */
export async function createTask(
  supabase: TypedClient,
  params: {
    chainId: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    visibility: "shared" | "internal";
    organisationId?: string | null;
    createdByParticipantId: string;
  }
) {
  const task = await tasksRepo.insertTask(supabase, {
    chain_id: params.chainId,
    title: params.title,
    description: params.description ?? null,
    due_date: params.dueDate ?? null,
    visibility: params.visibility,
    organisation_id: params.visibility === "internal" ? params.organisationId ?? null : null,
    source: "manual",
    created_by_participant_id: params.createdByParticipantId,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.createdByParticipantId,
    action: "task.created",
    entity_type: "task",
    entity_id: task.id,
    source: "manual",
    visibility: params.visibility,
    organisation_id: params.visibility === "internal" ? params.organisationId ?? null : null,
    metadata: { title: params.title },
  });

  return task;
}

/**
 * The activity log entry mirrors the TASK's own visibility/organisation —
 * not a hardcoded choice — since a status change on a shared task should
 * be visible to whoever could see the task in the first place, and an
 * internal task's status change must carry the same organisation_id or
 * it would violate internal_activity_requires_org (0007).
 */
export async function updateTaskStatus(
  supabase: TypedClient,
  params: {
    chainId: string;
    taskId: string;
    taskTitle: string;
    status: Database["public"]["Tables"]["tasks"]["Row"]["status"];
    taskVisibility: "shared" | "internal";
    taskOrganisationId: string | null;
    actorParticipantId: string;
  }
) {
  await tasksRepo.updateTaskStatus(supabase, params.taskId, params.status);

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.actorParticipantId,
    action: "task.status_changed",
    entity_type: "task",
    entity_id: params.taskId,
    source: "manual",
    visibility: params.taskVisibility,
    organisation_id: params.taskVisibility === "internal" ? params.taskOrganisationId : null,
    metadata: { title: params.taskTitle, status: params.status },
  });
}
