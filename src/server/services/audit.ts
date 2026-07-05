import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import * as auditRepo from "@/server/repositories/audit.repository";

type TypedClient = SupabaseClient<Database>;

interface ParticipantRef {
  role: string;
  profiles: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
}

function displayName(ref: ParticipantRef | ParticipantRef[] | null): string | null {
  const single = Array.isArray(ref) ? ref[0] : ref;
  if (!single) return null;
  const profile = Array.isArray(single.profiles) ? single.profiles[0] : single.profiles;
  return profile?.full_name ?? profile?.email ?? null;
}

export async function getAuditLog(supabase: TypedClient, chainId: string) {
  const rows = await auditRepo.listFullAuditLog(supabase, chainId);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    source: row.source,
    visibility: row.visibility,
    createdAt: row.created_at,
    actorName: displayName(row.actor as ParticipantRef | ParticipantRef[] | null),
    onBehalfOfName: displayName(row.on_behalf_of as ParticipantRef | ParticipantRef[] | null),
  }));
}
