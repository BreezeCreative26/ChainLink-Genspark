import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type {
  WorkspaceContext,
  WorkspacePersona,
} from "@/types/workspace";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

type MembershipRole =
  Database["public"]["Tables"]["memberships"]["Row"]["role"];
type ParticipantRole =
  Database["public"]["Tables"]["chain_participants"]["Row"]["role"];

const PROFESSIONAL_PARTICIPANT_ROLES: ParticipantRole[] = [
  "sellers_agent",
  "buyers_agent",
  "sellers_conveyancer",
  "buyers_conveyancer",
  "broker",
];

const ROLE_LABELS: Record<WorkspacePersona, string> = {
  owner: "Workspace owner",
  admin: "Firm administrator",
  agent: "Estate agent",
  conveyancer: "Conveyancer",
  staff: "Progression team",
  buyer: "Buyer",
  seller: "Seller",
  participant: "Chain participant",
};

function personaFromMembership(role: MembershipRole): WorkspacePersona {
  return role;
}

function personaFromParticipant(role: ParticipantRole): WorkspacePersona {
  if (role === "buyer") return "buyer";
  if (role === "seller") return "seller";
  if (role === "sellers_agent" || role === "buyers_agent") return "agent";
  if (role === "sellers_conveyancer" || role === "buyers_conveyancer") {
    return "conveyancer";
  }
  if (role === "broker") return "staff";
  return "participant";
}

export async function getWorkspaceContext(
  supabase: TypedClient,
  profileId: string
): Promise<WorkspaceContext> {
  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("organisation_id, branch_id, role")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .limit(1);

  if (membershipError) throw membershipError;

  const membership = memberships[0];
  if (membership) {
    const [{ data: organisation }, { data: branch }] = await Promise.all([
      supabase
        .from("organisations")
        .select("name")
        .eq("id", membership.organisation_id)
        .maybeSingle(),
      membership.branch_id
        ? supabase
            .from("branches")
            .select("name")
            .eq("id", membership.branch_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const persona = personaFromMembership(membership.role);
    const canManageOrganisation =
      membership.role === "owner" || membership.role === "admin";

    return {
      mode: "firm",
      persona,
      roleLabel: ROLE_LABELS[persona],
      organisationId: membership.organisation_id,
      organisationName: organisation?.name ?? "Your firm",
      branchId: membership.branch_id,
      branchName: branch?.name ?? null,
      canViewBusinessDashboard: true,
      canManageOrganisation,
      canManageBilling: canManageOrganisation,
      showCrossChainTools: true,
      homeHref: "/dashboard",
    };
  }

  const { data: participants, error: participantError } = await supabase
    .from("chain_participants")
    .select("role, access_mode")
    .eq("profile_id", profileId)
    .eq("status", "active");

  if (participantError) throw participantError;

  const professional = participants.find(
    (participant) =>
      participant.access_mode !== "connected" &&
      PROFESSIONAL_PARTICIPANT_ROLES.includes(participant.role)
  );
  if (professional) {
    const persona = personaFromParticipant(professional.role);
    return {
      mode: "solo",
      persona,
      roleLabel:
        professional.access_mode === "proxy"
          ? `Proxy ${ROLE_LABELS[persona].toLowerCase()}`
          : `Independent ${ROLE_LABELS[persona].toLowerCase()}`,
      organisationId: null,
      organisationName: null,
      branchId: null,
      branchName: null,
      canViewBusinessDashboard: true,
      canManageOrganisation: false,
      canManageBilling: false,
      showCrossChainTools: true,
      homeHref: "/dashboard",
    };
  }

  const primaryParticipant = participants[0];
  const persona = primaryParticipant
    ? personaFromParticipant(primaryParticipant.role)
    : "participant";

  return {
    mode: "participant",
    persona,
    roleLabel: ROLE_LABELS[persona],
    organisationId: null,
    organisationName: null,
    branchId: null,
    branchName: null,
    canViewBusinessDashboard: false,
    canManageOrganisation: false,
    canManageBilling: false,
    showCrossChainTools: false,
    homeHref: "/chains",
  };
}
