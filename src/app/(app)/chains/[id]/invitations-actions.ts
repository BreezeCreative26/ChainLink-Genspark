"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { sendInvitation, revokeInvitation } from "@/server/services/invitations";
import { toActionError } from "@/lib/errors";
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
  let emailSent = false;
  try {
    const invitation = await sendInvitation(supabase, {
      chainId: input.chainId,
      email: input.email.trim(),
      role: input.role,
      invitedByParticipantId: input.invitedByParticipantId,
    });
    emailSent = invitation.emailSent;
  } catch (err) {
    return { error: toActionError(err, "Could not send invitation.") };
  }

  revalidatePath(`/chains/${input.chainId}`);
  return {
    success: true,
    emailSent,
    warning: emailSent
      ? undefined
      : "Invitation created, but the email couldn't be sent. Copy the link below and send it yourself.",
  };
}

export async function revokeInvitationAction(chainId: string, invitationId: string) {
  const supabase = createClient();
  try {
    await revokeInvitation(supabase, { chainId, invitationId });
  } catch (err) {
    return { error: toActionError(err, "Could not revoke invitation.") };
  }

  revalidatePath(`/chains/${chainId}`);
  return { success: true };
}
