import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";

import type { Database } from "@/types/database";
import type { AccessMode, ChainCreatorRole, CreateChainInput } from "@/types/chain";
import * as chainsRepo from "@/server/repositories/chains.repository";
import * as invitationsRepo from "@/server/repositories/invitations.repository";
import { sendInvitation } from "@/server/services/invitations";
import { listMilestones, applyTemplatesToNewChain } from "@/server/services/milestones";
import { listDocuments } from "@/server/services/documents";
import { listComments } from "@/server/services/notes";
import { listTasks } from "@/server/services/tasks";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

/**
 * Works out a new participant's access_mode, per docs/PRODUCT_BRIEF.md:
 * - buyers and sellers are always 'guest' — private individuals never hold
 *   a paid firm subscription in a personal capacity.
 * - a professional is 'connected' if they belong to an active organisation,
 *   otherwise 'guest'. Guest-mode professionals still receive a direct-only
 *   solo portfolio, but never firm-wide visibility. `proxy` remains reserved
 *   for a managed stand-in participant because the database requires a proxy
 *   manager record.
 */
async function resolveAccessModeForCreator(
  supabase: TypedClient,
  profileId: string,
  role: ChainCreatorRole
): Promise<{ accessMode: AccessMode; organisationId: string | null }> {
  if (role === "buyer" || role === "seller") {
    return { accessMode: "guest", organisationId: null };
  }

  const membership = await chainsRepo.findActiveMembershipForRole(supabase, profileId);

  if (membership) {
    return { accessMode: "connected", organisationId: membership.organisation_id };
  }

  return { accessMode: "guest", organisationId: null };
}

/**
 * Creates a chain end-to-end: the chain itself, the creator's own
 * participant row, the first property + chain_node, any initial
 * invitations, and the opening activity log entry.
 *
 * NOTE on atomicity: these are sequential inserts under RLS, not a single
 * database transaction. If a later step fails, earlier rows persist (e.g.
 * a chain could exist with no property if property insert fails). This is
 * an accepted MVP tradeoff — see docs/DECISIONS.md — flagged for promotion
 * to a single Postgres RPC function during Phase 3 hardening, once this
 * flow is stable enough to be worth the added complexity.
 */
export async function createChain(supabase: TypedClient, input: CreateChainInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError("Not authenticated");
  }

  // Creates the chain, the creator's own participant row, the first
  // property, and the first chain_node atomically via a SECURITY DEFINER
  // Postgres function. This replaces the earlier sequential-inserts
  // approach: those four inserts, run one at a time under RLS, had a
  // chicken-and-egg gap (properties/chain_nodes policies require the
  // caller to already be an active chain_participants member of the
  // chain being inserted into, but that row didn't exist yet at the point
  // the property/node inserts ran) that surfaced as a 42501 RLS violation
  // in production. See chains.repository.ts:insertChainWorkspace for the
  // full explanation. This is the "Phase 3 hardening: promote to a single
  // Postgres RPC" migration referenced in the comment above — done now
  // because it was blocking all chain creation, not merely a nice-to-have.
  const workspace = await chainsRepo.insertChainWorkspace(supabase, {
    creatorRole: input.creatorRole,
    addressLine1: input.property.addressLine1,
    addressLine2: input.property.addressLine2 || null,
    city: input.property.city || null,
    postcode: input.property.postcode || null,
    listingPrice: input.property.listingPrice ?? null,
  });

  const chain = workspace.chain;
  const participant = workspace.participant;
  const accessMode = participant.access_mode;
  const organisationId = participant.organisation_id;
  const chainNode = { id: workspace.chainNodeId };

  // Gives the chain a real starter checklist instead of nothing — see
  // docs/DECISIONS.md ("Hardening review") on why an empty chain was a
  // real gap.
  await applyTemplatesToNewChain(supabase, {
    chainId: chain.id,
    chainNodeId: chainNode.id,
    organisationId,
    creatorParticipantId: participant.id,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: chain.id,
    actor_participant_id: participant.id,
    action: "chain.created",
    entity_type: "chain",
    entity_id: chain.id,
    source: "manual",
    visibility: "shared",
  });

  for (const invitation of input.initialInvitations) {
    if (!invitation.email) continue;
    await sendInvitation(supabase, {
      chainId: chain.id,
      email: invitation.email,
      role: invitation.role,
      invitedByParticipantId: participant.id,
    });
  }

  return chain;
}

export async function listChainsForCurrentUser(supabase: TypedClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const rows = await chainsRepo.listChainsForProfile(supabase, user.id);

  // Supabase's typed client infers the joined `chains` relation as an array
  // even though it's a to-one join here; normalize it for callers.
  return rows
    .map((row) => {
      const chain = Array.isArray(row.chains) ? row.chains[0] : row.chains;
      if (!chain) return null;
      return {
        id: chain.id,
        chainRef: chain.chain_ref,
        status: chain.status,
        createdAt: chain.created_at,
        myRole: row.role,
        myAccessMode: row.access_mode,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

/**
 * Participant-facing chain cards. These deliberately start from the viewer's
 * own participant rows rather than the firm-wide dashboard scope: a buyer or
 * seller must never inherit access merely because somebody else in a firm can
 * see a chain.
 */
export async function listPersonalChainCards(supabase: TypedClient) {
  const chains = await listChainsForCurrentUser(supabase);

  return Promise.all(
    chains.map(async (chain) => {
      const [property, milestoneResult] = await Promise.all([
        chainsRepo.getFirstPropertyAddress(supabase, chain.id),
        supabase
          .from("milestones")
          .select("status")
          .eq("chain_id", chain.id)
          .eq("visibility", "shared"),
      ]);

      if (milestoneResult.error) throw milestoneResult.error;
      const milestoneCount = milestoneResult.data.length;
      const completedMilestones = milestoneResult.data.filter(
        (milestone) => milestone.status === "completed"
      ).length;

      return {
        ...chain,
        addressLine1: property?.address_line1 ?? null,
        city: property?.city ?? null,
        progress:
          milestoneCount === 0
            ? 0
            : Math.round((completedMilestones / milestoneCount) * 100),
      };
    })
  );
}

export async function getChainDetail(supabase: TypedClient, chainId: string) {
  const [chain, activity, invitations, milestones, documents, comments, tasks, chainNodes] = await Promise.all([
    chainsRepo.getChainByIdForProfile(supabase, chainId),
    chainsRepo.listActivityForChain(supabase, chainId),
    invitationsRepo.listInvitationsForChain(supabase, chainId),
    listMilestones(supabase, chainId),
    listDocuments(supabase, chainId),
    listComments(supabase, chainId),
    listTasks(supabase, chainId),
    chainsRepo.listChainNodesForChain(supabase, chainId),
  ]);

  return { chain, activity, invitations, milestones, documents, comments, tasks, chainNodes };
}

/**
 * Adds a second (or subsequent) linked transaction to an existing chain —
 * e.g. the seller's own onward purchase. This is the UI for the tree-based
 * topology described in docs/data-model.md ("Chain Topology"), which
 * existed in the schema from the start but had no way to actually grow a
 * chain past its first node until the commercial-grade audit named it a
 * real gap.
 */
export async function addLinkedTransaction(
  supabase: TypedClient,
  params: {
    chainId: string;
    addressLine1: string;
    city?: string;
    postcode?: string;
    dependsOnNodeId: string;
    actorParticipantId: string;
  }
) {
  if (!params.addressLine1.trim()) {
    throw new AppError("Address is required.");
  }

  const property = await chainsRepo.insertProperty(supabase, {
    chain_id: params.chainId,
    address_line1: params.addressLine1.trim(),
    city: params.city || null,
    postcode: params.postcode || null,
  });

  const node = await chainsRepo.insertChainNode(supabase, {
    chain_id: params.chainId,
    property_id: property.id,
    depends_on_node_id: params.dependsOnNodeId,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.actorParticipantId,
    action: "chain_node.added",
    entity_type: "chain_node",
    entity_id: node.id,
    source: "manual",
    visibility: "shared",
    metadata: { address: params.addressLine1.trim() },
  });

  return node;
}

export async function currentUserHasProfessionalStanding(supabase: TypedClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;
  return chainsRepo.hasNonGuestParticipation(supabase, user.id);
}

/**
 * Just enough to guard/title a page (audit log, future settings pages)
 * without paying for the full getChainDetail payload (milestones,
 * documents, comments, invitations) when none of that is needed.
 */
export async function getChainHeader(supabase: TypedClient, chainId: string) {
  return chainsRepo.getChainByIdForProfile(supabase, chainId);
}
