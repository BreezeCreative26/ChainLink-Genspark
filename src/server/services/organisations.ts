import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { AppError } from "@/lib/errors";
import * as orgRepo from "@/server/repositories/organisations.repository";
import * as dashboardRepo from "@/server/repositories/dashboard.repository";

type TypedClient = SupabaseClient<Database>;

/**
 * Creates a new organisation and makes the current user its owner.
 *
 * Not wrapped in a single DB transaction — the same accepted tradeoff as
 * chain creation (docs/DECISIONS.md, "Chain creation is not atomic yet").
 * If the second insert fails, an orphaned memberless organisation is left
 * behind; it grants no access to anyone (see 0017's comment on
 * organisations_insert), so this is a low-severity failure mode, not a
 * security issue.
 *
 * Deliberately NOT supported yet: a person creating a second organisation
 * while already belonging to one. Multi-firm membership works fine at the
 * data level, but no UI exists for choosing which firm's context you're
 * acting in (see docs/DECISIONS.md, "Multiple simultaneous organisation
 * memberships") — allowing a second org here would create one silently
 * with no way to switch to it.
 */
export async function createOrganisation(
  supabase: TypedClient,
  input: { name: string; orgType: Database["public"]["Tables"]["organisations"]["Row"]["org_type"] }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("Not authenticated");

  const existing = await dashboardRepo.getActiveMemberships(supabase, user.id);
  if (existing.length > 0) {
    throw new AppError(
      "You're already part of a firm. Creating a second one isn't supported yet."
    );
  }

  if (!input.name.trim()) {
    throw new AppError("Firm name is required.");
  }

  const org = await orgRepo.insertOrganisation(supabase, {
    name: input.name.trim(),
    orgType: input.orgType,
  });

  await orgRepo.insertOwnerMembership(supabase, {
    organisationId: org.id,
    profileId: user.id,
  });

  return org;
}

export async function listTeam(supabase: TypedClient, organisationId: string) {
  return orgRepo.listMembershipsForOrg(supabase, organisationId);
}

/**
 * Adds a teammate who ALREADY has a ChainLink account, found by email.
 *
 * Deliberately NOT built: inviting someone who doesn't have an account
 * yet. That needs its own token/lifecycle system, parallel to (but
 * distinct from) chain invitations — a real feature, not a small
 * addition, and out of scope for this pass. See docs/DECISIONS.md.
 */
export async function addTeamMemberByEmail(
  supabase: TypedClient,
  input: {
    organisationId: string;
    email: string;
    role: Database["public"]["Tables"]["memberships"]["Row"]["role"];
    branchId?: string | null;
  }
) {
  if (input.role === "owner") {
    throw new AppError("Adding another owner isn't supported yet.");
  }

  const profile = await orgRepo.findProfileByEmail(supabase, input.email);
  if (!profile) {
    throw new AppError(
      "No ChainLink account found with that email yet. They'll need to sign up first — inviting someone who doesn't have an account yet isn't supported here."
    );
  }

  await orgRepo.insertMembership(supabase, {
    organisationId: input.organisationId,
    profileId: profile.id,
    role: input.role,
    branchId: input.branchId,
  });
}

export async function removeTeamMember(supabase: TypedClient, membershipId: string) {
  await orgRepo.updateMembershipStatus(supabase, membershipId, "removed");
}
