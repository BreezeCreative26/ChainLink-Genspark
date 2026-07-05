"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createChain } from "@/server/services/chains";
import { toActionError } from "@/lib/errors";
import type { CreateChainInput } from "@/types/chain";

export async function createChainAction(input: CreateChainInput) {
  const supabase = createClient();

  if (!input.property.addressLine1?.trim()) {
    return { error: "Property address is required." };
  }

  let chain;
  try {
    chain = await createChain(supabase, input);
  } catch (err) {
    return {
      error: toActionError(err, "Something went wrong creating the chain. Please try again."),
    };
  }

  redirect(`/chains/${chain.id}`);
}
