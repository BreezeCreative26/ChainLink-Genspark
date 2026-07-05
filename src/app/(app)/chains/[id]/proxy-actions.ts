"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { addProxyParticipant } from "@/server/services/proxy";
import { toActionError } from "@/lib/errors";

export async function addProxyParticipantAction(input: {
  chainId: string;
  fullName: string;
  role: "seller" | "buyer";
  managerParticipantId: string;
}) {
  const supabase = createClient();
  try {
    await addProxyParticipant(supabase, input);
  } catch (err) {
    return { error: toActionError(err, "Could not add this participant.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}
