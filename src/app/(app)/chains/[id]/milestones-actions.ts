"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  confirmMilestone,
  createMilestone,
  updateMilestoneStatus,
} from "@/server/services/milestones";
import { toActionError } from "@/lib/errors";
import type { Database } from "@/types/database";

type MilestoneStatus = Database["public"]["Tables"]["milestones"]["Row"]["status"];

export async function confirmMilestoneAction(input: {
  chainId: string;
  milestoneId: string;
  milestoneTitle: string;
  myParticipantId: string;
}) {
  const supabase = createClient();
  try {
    await confirmMilestone(supabase, input);
  } catch (err) {
    return { error: toActionError(err, "Could not confirm this milestone.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}

export async function createMilestoneAction(input: {
  chainId: string;
  title: string;
  dueDate: string | null;
  guestConfirmable: boolean;
  keepInternal: boolean;
  organisationId: string | null;
  createdByParticipantId: string;
}) {
  if (!input.title.trim()) {
    return { error: "Title is required." };
  }

  const supabase = createClient();
  try {
    await createMilestone(supabase, {
      chainId: input.chainId,
      title: input.title.trim(),
      dueDate: input.dueDate,
      guestConfirmable: input.guestConfirmable,
      visibility: input.keepInternal ? "internal" : "shared",
      organisationId: input.organisationId,
      createdByParticipantId: input.createdByParticipantId,
    });
  } catch (err) {
    return { error: toActionError(err, "Could not create the milestone.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}

export async function updateMilestoneStatusAction(input: {
  chainId: string;
  milestoneId: string;
  milestoneTitle: string;
  status: MilestoneStatus;
  myParticipantId: string;
}) {
  const supabase = createClient();
  try {
    await updateMilestoneStatus(supabase, input);
  } catch (err) {
    return { error: toActionError(err, "Could not update this milestone.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}
