"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { confirmMilestone } from "@/server/services/milestones";
import { toActionError } from "@/lib/errors";

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
