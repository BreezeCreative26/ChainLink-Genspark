"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { sendInvitation, revokeInvitation } from "@/server/services/invitations";
import type { ChainParticipantRole } from "@/types/chain";

export async function inviteParticipantAction(input: {
  chainId: string;
  invitedByParticipantId: string;
  email: string;
  role: ChainParticipantRole;
}) {
  if (!input.email.trim()) {
    return { error: "Email is required." };
  }

  const supabase = createClient();
  try {
    await sendInvitation(supabase, {
      chainId: input.chainId,
      email: input.email.trim(),
      role: input.role,
      invitedByParticipantId: input.invitedByParticipantId,
    });
  } catch (err) {
    console.error("inviteParticipantAction failed", err);
    return { error: err instanceof Error ? err.message : "Could not send invitation." };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return { success: true };
}

export async function revokeInvitationAction(chainId: string, invitationId: string) {
  const supabase = createClient();
  try {
    await revokeInvitation(supabase, invitationId);
  } catch (err) {
    console.error("revokeInvitationAction failed", err);
    return { error: err instanceof Error ? err.message : "Could not revoke invitation." };
  }

  revalidatePath(`/chains/${chainId}`);
  return { success: true };
}
