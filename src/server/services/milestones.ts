import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { AppError } from "@/lib/errors";
import * as milestonesRepo from "@/server/repositories/milestones.repository";
import * as chainsRepo from "@/server/repositories/chains.repository";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

async function requireCurrentParticipant(
  supabase: TypedClient,
  chainId: string,
  participantId: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new AppError("Not authenticated");

  const management = await chainsRepo.getChainManagementContext(
    supabase,
    chainId,
    user.id
  );

  const participant = management.participant;
  if (!participant || participant.id !== participantId) {
    throw new AppError("You do not have access to update this chain.");
  }

  return { participant, canManage: management.canManage };
}

export async function listMilestones(supabase: TypedClient, chainId: string) {
  return milestonesRepo.listMilestonesForChain(supabase, chainId);
}

/**
 * Applies the applicable milestone_templates to a newly created chain, so
 * a chain has a real starter checklist instead of nothing — see
 * docs/DECISIONS.md ("Hardening review") on why an empty chain was a real
 * gap. "Offer accepted" is marked complete immediately, since creating a
 * chain implies an offer was already accepted; everything else starts
 * pending.
 */
export async function applyTemplatesToNewChain(
  supabase: TypedClient,
  params: { chainId: string; chainNodeId: string; organisationId: string | null; creatorParticipantId: string }
) {
  const templates = await milestonesRepo.listApplicableTemplates(supabase, params.organisationId);
  if (templates.length === 0) return;

  await milestonesRepo.insertMilestonesFromTemplates(supabase, {
    chainId: params.chainId,
    chainNodeId: params.chainNodeId,
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      guest_confirmable: t.guest_confirmable,
    })),
    completedTemplateName: "Offer accepted",
    recordedByParticipantId: params.creatorParticipantId,
  });
}

/**
 * Professional milestone creation — distinct from the guest confirm-only
 * path. Visibility defaults to 'shared'; 'internal' is only valid when the
 * creator supplies their own organisationId (enforced by the existing
 * internal_milestone_requires_org DB constraint regardless).
 */
export async function createMilestone(
  supabase: TypedClient,
  params: {
    chainId: string;
    chainNodeId?: string | null;
    title: string;
    dueDate?: string | null;
    guestConfirmable: boolean;
    visibility: "shared" | "internal";
    organisationId?: string | null;
    createdByParticipantId: string;
  }
) {
  const management = await requireCurrentParticipant(
    supabase,
    params.chainId,
    params.createdByParticipantId
  );
  if (!management.canManage) {
    throw new AppError("You do not have permission to manage milestones on this chain.");
  }

  const milestone = await milestonesRepo.insertMilestone(supabase, {
    chain_id: params.chainId,
    chain_node_id: params.chainNodeId ?? null,
    title: params.title,
    due_date: params.dueDate ?? null,
    guest_confirmable: params.guestConfirmable,
    visibility: params.visibility,
    organisation_id: params.visibility === "internal" ? params.organisationId ?? null : null,
    source: "manual",
    recorded_by_participant_id: params.createdByParticipantId,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.createdByParticipantId,
    action: "milestone.created",
    entity_type: "milestone",
    entity_id: milestone.id,
    source: "manual",
    visibility: params.visibility,
    organisation_id: params.visibility === "internal" ? params.organisationId ?? null : null,
    metadata: { title: params.title },
  });

  return milestone;
}

/**
 * Professional status change — any status, not just 'completed'. The
 * guest-confirmation trigger only restricts callers whose access_mode is
 * actually 'guest' (0012_guest_capabilities.sql), so this is safe to
 * expose to everyone else without new RLS.
 */
export async function updateMilestoneStatus(
  supabase: TypedClient,
  params: { chainId: string; milestoneId: string; milestoneTitle: string; status: Database["public"]["Tables"]["milestones"]["Row"]["status"]; myParticipantId: string }
) {
  const management = await requireCurrentParticipant(
    supabase,
    params.chainId,
    params.myParticipantId
  );
  if (!management.canManage) {
    throw new AppError("You do not have permission to manage milestones on this chain.");
  }

  // Buyer/seller creators remain guest-mode participants by design, but are
  // the initial chain administrators. Until migration 0018 is present in an
  // environment, its guest trigger still blocks general status changes, so
  // use the narrowly scoped server-only compatibility write for that case.
  if (management.participant.access_mode === "guest") {
    await milestonesRepo.updateMilestoneStatusAsChainCreator(
      params.milestoneId,
      params.chainId,
      params.status,
      params.myParticipantId
    );
  } else {
    await milestonesRepo.updateMilestoneStatus(
      supabase,
      params.milestoneId,
      params.chainId,
      params.status,
      params.myParticipantId
    );
  }

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.myParticipantId,
    action: "milestone.status_changed",
    entity_type: "milestone",
    entity_id: params.milestoneId,
    source: "manual",
    visibility: "shared",
    metadata: { title: params.milestoneTitle, status: params.status },
  });
}

/**
 * Confirms a milestone on behalf of the current user's participant record
 * on this chain, then logs it. The actual "is this allowed" question is
 * answered by the database (RLS + the guest-confirmation trigger in
 * 0012_guest_capabilities.sql) — this function does not re-implement that
 * check, so it stays correct even if new ways to call it are added later.
 */
export async function confirmMilestone(
  supabase: TypedClient,
  params: { chainId: string; milestoneId: string; milestoneTitle: string; myParticipantId: string }
) {
  await requireCurrentParticipant(supabase, params.chainId, params.myParticipantId);
  await milestonesRepo.confirmMilestone(
    supabase,
    params.milestoneId,
    params.chainId,
    params.myParticipantId
  );

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.myParticipantId,
    action: "milestone.confirmed",
    entity_type: "milestone",
    entity_id: params.milestoneId,
    source: "manual",
    visibility: "shared",
    metadata: { title: params.milestoneTitle },
  });
}
