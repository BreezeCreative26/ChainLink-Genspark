"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { acceptInvitation, declineInvitation } from "@/server/services/invitations";
import type { AcceptDecision } from "@/types/chain";

export async function acceptInvitationAction(token: string, decision: AcceptDecision) {
  const supabase = createClient();

  let result;
  try {
    result = await acceptInvitation(supabase, token, decision);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not accept this invitation.",
    };
  }

  redirect(`/chains/${result.chainId}`);
}

export async function declineInvitationAction(token: string) {
  const supabase = createClient();

  try {
    await declineInvitation(supabase, token);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not decline this invitation.",
    };
  }

  return { success: true };
}
