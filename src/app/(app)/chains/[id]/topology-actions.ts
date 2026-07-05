"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { addLinkedTransaction } from "@/server/services/chains";
import { toActionError } from "@/lib/errors";

export async function addLinkedTransactionAction(input: {
  chainId: string;
  addressLine1: string;
  city: string;
  postcode: string;
  dependsOnNodeId: string;
  actorParticipantId: string;
}) {
  const supabase = createClient();
  try {
    await addLinkedTransaction(supabase, input);
  } catch (err) {
    return { error: toActionError(err, "Could not add this transaction.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}
