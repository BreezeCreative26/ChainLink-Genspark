import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

export async function listMilestonesForChain(supabase: TypedClient, chainId: string) {
  const { data, error } = await supabase
    .from("milestones")
    .select(
      `
      id, title, status, due_date, completed_at, visibility,
      guest_confirmable, created_at, chain_node_id, template_id,
      milestone_templates ( default_sequence_index )
      `
    )
    .eq("chain_id", chainId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listApplicableTemplates(
  supabase: TypedClient,
  organisationId: string | null
) {
  let query = supabase
    .from("milestone_templates")
    .select("id, name, default_sequence_index, guest_confirmable")
    .order("default_sequence_index", { ascending: true });

  // Global templates (organisation_id is null) always apply; a connected
  // creator's own firm-specific templates apply too. A solo/guest creator
  // only gets the global set.
  query = organisationId
    ? query.or(`organisation_id.is.null,organisation_id.eq.${organisationId}`)
    : query.is("organisation_id", null);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function insertMilestonesFromTemplates(
  supabase: TypedClient,
  input: {
    chainId: string;
    chainNodeId: string;
    templates: { id: string; name: string; guest_confirmable: boolean }[];
    /** The milestone that's implicitly already true when a chain is created. */
    completedTemplateName: string;
    recordedByParticipantId: string;
  }
) {
  if (input.templates.length === 0) return;

  const completedTemplateName = input.completedTemplateName.trim().toLowerCase();
  const rows = input.templates.map((template) => {
    const completed = template.name.trim().toLowerCase() === completedTemplateName;
    return {
      chain_id: input.chainId,
      chain_node_id: input.chainNodeId,
      template_id: template.id,
      title: template.name,
      guest_confirmable: template.guest_confirmable,
      status: completed ? ("completed" as const) : ("pending" as const),
      completed_at: completed ? new Date().toISOString() : null,
      recorded_by_participant_id: completed ? input.recordedByParticipantId : null,
    };
  });

  const { error } = await supabase.from("milestones").upsert(rows, {
    onConflict: "chain_node_id,template_id",
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

export async function insertMilestone(
  supabase: TypedClient,
  input: Database["public"]["Tables"]["milestones"]["Insert"]
) {
  const { data, error } = await supabase
    .from("milestones")
    .insert(input)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

/**
 * The narrow, guest-safe confirm path — only ever sets status to
 * 'completed'. RLS (milestones_update) plus the guest-confirmation
 * trigger (0012_guest_capabilities.sql) are what actually make this safe
 * for a guest to call; this function does not itself distinguish "is this
 * person a guest" — the database enforces that regardless of caller.
 * See updateMilestoneStatus below for the general professional path.
 */
export async function confirmMilestone(
  supabase: TypedClient,
  milestoneId: string,
  chainId: string,
  recordedByParticipantId: string
) {
  const { data, error } = await supabase
    .from("milestones")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      source: "manual",
      recorded_by_participant_id: recordedByParticipantId,
    })
    .eq("id", milestoneId)
    .eq("chain_id", chainId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Milestone not found");
}

/**
 * General status update for professionals — distinct from confirmMilestone
 * above, which is the narrow guest-safe path. This one lets any non-guest
 * chain member set any status; the guest-confirmation trigger
 * (0012_guest_capabilities.sql) only restricts callers whose access_mode
 * actually is 'guest', so this is already safe to expose without new RLS.
 */
export async function updateMilestoneStatusAsChainCreator(
  milestoneId: string,
  chainId: string,
  status: Database["public"]["Tables"]["milestones"]["Row"]["status"],
  recordedByParticipantId: string
) {
  // Compatibility path for guest-mode chain creators before migration 0018's
  // creator-admin exception reaches every database environment. The service
  // verifies creator ownership and participant identity before calling this.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("milestones")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      source: "manual",
      recorded_by_participant_id: recordedByParticipantId,
    })
    .eq("id", milestoneId)
    .eq("chain_id", chainId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Milestone not found");
}

export async function updateMilestoneStatus(
  supabase: TypedClient,
  milestoneId: string,
  chainId: string,
  status: Database["public"]["Tables"]["milestones"]["Row"]["status"],
  recordedByParticipantId: string
) {
  const { data, error } = await supabase
    .from("milestones")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      source: "manual",
      recorded_by_participant_id: recordedByParticipantId,
    })
    .eq("id", milestoneId)
    .eq("chain_id", chainId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Milestone not found");
}
