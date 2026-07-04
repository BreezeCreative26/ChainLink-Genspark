import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { AccessMode, ChainCreatorRole, CreateChainInput } from "@/types/chain";
import * as chainsRepo from "@/server/repositories/chains.repository";
import * as invitationsRepo from "@/server/repositories/invitations.repository";
import { sendInvitation } from "@/server/services/invitations";
import { listMilestones } from "@/server/services/milestones";
import { listDocuments } from "@/server/services/documents";
import { listComments } from "@/server/services/notes";

type TypedClient = SupabaseClient<Database>;

/**
 * Works out a new participant's access_mode, per docs/PRODUCT_BRIEF.md:
 * - buyers and sellers are always 'guest' — private individuals never hold
 *   a paid firm subscription in a personal capacity.
 * - an agent is 'connected' if they belong to an active organisation,
 *   otherwise 'guest' (an agent can still use ChainLink solo, unsubscribed
 *   — proxy/guest mode must work without a firm, per the platform's core
 *   design rule).
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
    throw new Error("Not authenticated");
  }

  const { accessMode, organisationId } = await resolveAccessModeForCreator(
    supabase,
    user.id,
    input.creatorRole
  );

  const chain = await chainsRepo.insertChain(supabase, user.id);

  const participant = await chainsRepo.insertChainParticipant(supabase, {
    chain_id: chain.id,
    profile_id: user.id,
    role: input.creatorRole,
    access_mode: accessMode,
    organisation_id: organisationId,
  });

  const property = await chainsRepo.insertProperty(supabase, {
    chain_id: chain.id,
    address_line1: input.property.addressLine1,
    address_line2: input.property.addressLine2 || null,
    city: input.property.city || null,
    postcode: input.property.postcode || null,
    listing_price: input.property.listingPrice ?? null,
  });

  // The creator's role determines which side of the transaction they sit
  // on for this first node. Agents don't sit on either side themselves —
  // the node's seller/buyer slots are filled in once those participants
  // (or their invitations) are attached.
  await chainsRepo.insertChainNode(supabase, {
    chain_id: chain.id,
    property_id: property.id,
    sequence_index: 1,
    seller_participant_id: input.creatorRole === "seller" ? participant.id : null,
    buyer_participant_id: input.creatorRole === "buyer" ? participant.id : null,
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

export async function getChainDetail(supabase: TypedClient, chainId: string) {
  const [chain, activity, invitations, milestones, documents, comments] = await Promise.all([
    chainsRepo.getChainByIdForProfile(supabase, chainId),
    chainsRepo.listActivityForChain(supabase, chainId),
    invitationsRepo.listInvitationsForChain(supabase, chainId),
    listMilestones(supabase, chainId),
    listDocuments(supabase, chainId),
    listComments(supabase, chainId),
  ]);

  return { chain, activity, invitations, milestones, documents, comments };
}

export async function currentUserHasProfessionalStanding(supabase: TypedClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;
  return chainsRepo.hasNonGuestParticipation(supabase, user.id);
}
