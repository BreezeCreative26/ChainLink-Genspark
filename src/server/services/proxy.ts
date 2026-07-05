import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import type { Database } from "@/types/database";
import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import * as chainsRepo from "@/server/repositories/chains.repository";

type TypedClient = SupabaseClient<Database>;

/**
 * Adds a participant who will never log in themselves — e.g. a seller
 * with no email who the agent tracks updates on behalf of. This was
 * flagged repeatedly in earlier steps as "deliberately deferred: requires
 * an admin-level operation to create an identity without login
 * credentials." The commercial-grade audit named it a real, not
 * theoretical, gap (schema-only, no application code path), so it's built
 * now.
 *
 * Uses the service-role client ONLY for the narrow step of creating the
 * auth identity itself (a genuinely admin-only operation — there is no
 * session to do this as). The resulting chain_participants row is
 * inserted through the CALLER's own session client, so RLS still governs
 * that grant of access normally: it works because the inviting
 * professional is already a chain member, exactly like the existing
 * invitation-acceptance flow's participant insert.
 *
 * The synthetic email uses the .invalid TLD (reserved by RFC 2606
 * specifically for addresses that must never resolve or be deliverable)
 * so it can never collide with, or be mistaken for, a real address.
 */
export async function addProxyParticipant(
  supabase: TypedClient,
  params: {
    chainId: string;
    fullName: string;
    role: "seller" | "buyer";
    managerParticipantId: string;
  }
) {
  if (!params.fullName.trim()) {
    throw new AppError("Name is required.");
  }

  const admin = createAdminClient();
  const syntheticEmail = `proxy+${randomUUID()}@chainlink.invalid`;

  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    email_confirm: true,
    user_metadata: { full_name: params.fullName.trim() },
  });

  if (createUserError || !created.user) {
    throw new AppError("Could not add this participant. Please try again.");
  }

  const participant = await chainsRepo.insertChainParticipant(supabase, {
    chain_id: params.chainId,
    profile_id: created.user.id,
    role: params.role,
    access_mode: "proxy",
    proxy_manager_participant_id: params.managerParticipantId,
  });

  await chainsRepo.insertActivityLog(supabase, {
    chain_id: params.chainId,
    actor_participant_id: params.managerParticipantId,
    action: "participant.added_proxy",
    entity_type: "chain_participant",
    entity_id: participant.id,
    source: "proxy",
    visibility: "shared",
    metadata: { full_name: params.fullName.trim(), role: params.role },
  });

  return participant;
}
