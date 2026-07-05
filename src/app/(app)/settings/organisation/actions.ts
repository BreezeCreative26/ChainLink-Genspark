"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createOrganisation,
  addTeamMemberByEmail,
  removeTeamMember,
} from "@/server/services/organisations";
import { toActionError } from "@/lib/errors";
import type { Database } from "@/types/database";

type OrgType = Database["public"]["Tables"]["organisations"]["Row"]["org_type"];
type MembershipRole = Database["public"]["Tables"]["memberships"]["Row"]["role"];

export async function createOrganisationAction(input: { name: string; orgType: OrgType }) {
  const supabase = createClient();
  try {
    await createOrganisation(supabase, input);
  } catch (err) {
    return { error: toActionError(err, "Could not create the firm. Please try again.") };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function addTeamMemberAction(input: {
  organisationId: string;
  email: string;
  role: MembershipRole;
}) {
  if (!input.email.trim()) {
    return { error: "Email is required." };
  }

  const supabase = createClient();
  try {
    await addTeamMemberByEmail(supabase, input);
  } catch (err) {
    return { error: toActionError(err, "Could not add that teammate.") };
  }

  revalidatePath("/settings/organisation");
  return { success: true };
}

export async function removeTeamMemberAction(membershipId: string) {
  const supabase = createClient();
  try {
    await removeTeamMember(supabase, membershipId);
  } catch (err) {
    return { error: toActionError(err, "Could not remove that teammate.") };
  }

  revalidatePath("/settings/organisation");
  return { success: true };
}
