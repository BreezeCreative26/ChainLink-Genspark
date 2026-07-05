"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createTask, updateTaskStatus } from "@/server/services/tasks";
import { toActionError } from "@/lib/errors";
import type { Database } from "@/types/database";

type TaskStatus = Database["public"]["Tables"]["tasks"]["Row"]["status"];

export async function createTaskAction(input: {
  chainId: string;
  title: string;
  dueDate: string | null;
  keepInternal: boolean;
  organisationId: string | null;
  createdByParticipantId: string;
}) {
  if (!input.title.trim()) {
    return { error: "Title is required." };
  }

  const supabase = createClient();
  try {
    await createTask(supabase, {
      chainId: input.chainId,
      title: input.title.trim(),
      dueDate: input.dueDate,
      visibility: input.keepInternal ? "internal" : "shared",
      organisationId: input.organisationId,
      createdByParticipantId: input.createdByParticipantId,
    });
  } catch (err) {
    return { error: toActionError(err, "Could not create the task.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}

export async function updateTaskStatusAction(input: {
  chainId: string;
  taskId: string;
  taskTitle: string;
  status: TaskStatus;
  taskVisibility: "shared" | "internal";
  taskOrganisationId: string | null;
  actorParticipantId: string;
}) {
  const supabase = createClient();
  try {
    await updateTaskStatus(supabase, input);
  } catch (err) {
    return { error: toActionError(err, "Could not update this task.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}
