"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createChain } from "@/server/services/chains";
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
    console.error("createChainAction failed", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Something went wrong creating the chain. Please try again.",
    };
  }

  redirect(`/chains/${chain.id}`);
}
