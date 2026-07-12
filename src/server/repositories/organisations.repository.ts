import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

export async function insertOrganisation(
  supabase: TypedClient,
  input: { name: string; orgType: Database["public"]["Tables"]["organisations"]["Row"]["org_type"] }
) {
  const { data, error } = await supabase
    .from("organisations")
    .insert({ name: input.name, org_type: input.orgType })
    .select("id, name")
    .single();

  if (error) throw error;
  return data;
}

export async function insertOwnerMembership(
  supabase: TypedClient,
  input: { organisationId: string; profileId: string }
) {
  const { error } = await supabase.from("memberships").insert({
    organisation_id: input.organisationId,
    profile_id: input.profileId,
    role: "owner",
  });

  if (error) throw error;
}

export async function findProfileByEmail(supabase: TypedClient, email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .ilike("email", email.trim())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function insertMembership(
  supabase: TypedClient,
  input: {
    organisationId: string;
    profileId: string;
    role: Database["public"]["Tables"]["memberships"]["Row"]["role"];
    branchId?: string | null;
  }
) {
  const { error } = await supabase.from("memberships").insert({
    organisation_id: input.organisationId,
    profile_id: input.profileId,
    role: input.role,
    branch_id: input.branchId ?? null,
  });

  if (error) throw error;
}

export async function listMembershipsForOrg(supabase: TypedClient, organisationId: string) {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, role, status, branch_id, profile_id, profiles ( full_name, email )")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateMembershipStatus(
  supabase: TypedClient,
  membershipId: string,
  status: "active" | "removed"
) {
  const { error } = await supabase
    .from("memberships")
    .update({ status })
    .eq("id", membershipId);

  if (error) throw error;
}
