import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type {
  ChainRow,
  DashboardData,
  DashboardFilters,
  DashboardScope,
  OverdueActionItem,
  PendingInviteItem,
  RecentActivityItem,
  RiskReason,
  UpcomingCompletionItem,
} from "@/types/dashboard";
import * as dashboardRepo from "@/server/repositories/dashboard.repository";
import * as billingRepo from "@/server/repositories/billing.repository";
import { hasFeature } from "@/config/plans";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

const RISK_INACTIVITY_DAYS = 14;

/**
 * Resolves what this dashboard instance is allowed to aggregate over.
 *
 * Two modes (docs/DECISIONS.md, "Dashboard has two modes"):
 *   - 'firm': the viewer has an active organisation membership. Scope is
 *     every chain ANY member of that org is connected to — this is the
 *     paid, multi-chain value the business tier is for.
 *   - 'solo': no organisation membership. Scope is just the viewer's own
 *     direct professional participant rows, including guest-mode work while
 *     unsubscribed — this keeps the platform useful for a solo agent without
 *     broadening access beyond chains they personally joined (the core rule in
 *     docs/PRODUCT_BRIEF.md).
 *
 * Branch scoping (only meaningful in 'firm' mode): owners/admins can see
 * every branch and choose one via requestedBranchId; anyone else is
 * automatically scoped to their own branch, and requestedBranchId is
 * ignored for them — a regular agent can't widen their own view by
 * tampering with a query parameter.
 */
export async function resolveDashboardScope(
  supabase: TypedClient,
  requestedBranchId?: string
): Promise<DashboardScope> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      mode: "solo",
      organisationId: null,
      organisationName: null,
      branches: [],
      branchViewsEnabled: false,
      viewerRole: null,
      viewerBranchId: null,
      chainIds: [],
    };
  }

  const memberships = await dashboardRepo.getActiveMemberships(supabase, user.id);
  // MVP simplification: a person's dashboard reflects their FIRST active
  // organisation membership. Belonging to two firms at once is a real but
  // rare case (see docs/DECISIONS.md); a firm switcher is a reasonable
  // future addition once it's actually needed, not before.
  const membership = memberships[0];

  if (!membership) {
    const chainIds = await dashboardRepo.listSoloChainIds(supabase, user.id);
    return {
      mode: "solo",
      organisationId: null,
      organisationName: null,
      branches: [],
      branchViewsEnabled: false,
      viewerRole: null,
      viewerBranchId: null,
      chainIds,
    };
  }

  const [organisationName, branches, connectedParticipants, orgBillingRow] = await Promise.all([
    dashboardRepo.getOrganisationName(supabase, membership.organisation_id),
    dashboardRepo.getBranchesForOrganisation(supabase, membership.organisation_id),
    dashboardRepo.listOrgConnectedChainParticipants(supabase, membership.organisation_id),
    billingRepo.getOrganisationBillingRow(supabase, membership.organisation_id),
  ]);

  const branchViewsEnabled = hasFeature(orgBillingRow.plan, "branch_views");

  const isAdmin = membership.role === "owner" || membership.role === "admin";
  const effectiveRequestedBranchId = branchViewsEnabled ? requestedBranchId : undefined;

  let chainIds: string[];
  if (isAdmin) {
    // Admins/owners see everything, optionally narrowed by a branch filter
    // they explicitly chose. Narrowing by branch requires knowing which
    // teammate (by profile) sits in which branch — fetched only when
    // actually filtering, to avoid the extra query on every page load.
    if (effectiveRequestedBranchId) {
      chainIds = await chainIdsForBranch(
        supabase,
        connectedParticipants,
        membership.organisation_id,
        effectiveRequestedBranchId
      );
    } else {
      chainIds = [...new Set(connectedParticipants.map((p) => p.chain_id))];
    }
  } else {
    // Non-admins are scoped to their own branch automatically — a
    // requestedBranchId from a non-admin is ignored, not honoured, so this
    // can't be widened via the URL. This scoping applies regardless of
    // plan (it's about who they are, not a paid feature).
    if (membership.branch_id) {
      chainIds = await chainIdsForBranch(
        supabase,
        connectedParticipants,
        membership.organisation_id,
        membership.branch_id
      );
    } else {
      chainIds = [...new Set(connectedParticipants.map((p) => p.chain_id))];
    }
  }

  return {
    mode: "firm",
    organisationId: membership.organisation_id,
    organisationName: organisationName ?? "Your firm",
    branches,
    branchViewsEnabled,
    viewerRole: membership.role,
    viewerBranchId: membership.branch_id,
    chainIds,
  };
}

async function chainIdsForBranch(
  supabase: TypedClient,
  connectedParticipants: { chain_id: string; profile_id: string }[],
  organisationId: string,
  branchId: string
): Promise<string[]> {
  const profileIds = [...new Set(connectedParticipants.map((p) => p.profile_id))];
  if (profileIds.length === 0) return [];

  const { data: branchMemberships, error } = await supabase
    .from("memberships")
    .select("profile_id")
    .eq("organisation_id", organisationId)
    .eq("branch_id", branchId)
    .in("profile_id", profileIds);

  if (error) throw error;

  const branchProfileIds = new Set(branchMemberships.map((m) => m.profile_id));
  return [
    ...new Set(
      connectedParticipants
        .filter((p) => branchProfileIds.has(p.profile_id))
        .map((p) => p.chain_id)
    ),
  ];
}

function computeRisk(
  status: ChainRow["status"],
  lastActivityAt: string | null,
  hasOverdueMilestone: boolean
): RiskReason[] {
  const reasons: RiskReason[] = [];

  if (hasOverdueMilestone) reasons.push("overdue_milestone");

  if (status === "stalled") reasons.push("stalled");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RISK_INACTIVITY_DAYS);
  if (!lastActivityAt || new Date(lastActivityAt) < cutoff) {
    if (status === "active") reasons.push("no_recent_activity");
  }

  return reasons;
}

export async function getDashboardData(
  supabase: TypedClient,
  filters: DashboardFilters,
  requestedBranchId?: string
): Promise<DashboardData> {
  const scope = await resolveDashboardScope(supabase, requestedBranchId);
  const { chainIds } = scope;

  const [
    chainsSummary,
    lastActivityRows,
    overdueMilestones,
    overdueTasks,
    upcomingMilestones,
    pendingInvitations,
    recentActivityRows,
  ] = await Promise.all([
    dashboardRepo.listChainsSummary(supabase, chainIds),
    dashboardRepo.listLastActivityPerChain(supabase, chainIds),
    dashboardRepo.listOverdueMilestones(supabase, chainIds),
    dashboardRepo.listOverdueTasks(supabase, chainIds),
    dashboardRepo.listUpcomingMilestones(supabase, chainIds),
    dashboardRepo.listPendingInvitations(supabase, chainIds),
    dashboardRepo.listRecentActivity(supabase, chainIds, 8),
  ]);

  const lastActivityByChain = new Map<string, string>();
  for (const row of lastActivityRows) {
    if (!lastActivityByChain.has(row.chain_id)) {
      lastActivityByChain.set(row.chain_id, row.created_at);
    }
  }

  const overdueMilestoneChains = new Set(overdueMilestones.map((m) => m.chain_id));

  const chainRefById = new Map(chainsSummary.map((c) => [c.id, c.chain_ref]));

  let chains: ChainRow[] = chainsSummary.map((c) => {
    const property = Array.isArray(c.properties) ? c.properties[0] : c.properties;
    const lastActivityAt = lastActivityByChain.get(c.id) ?? null;
    return {
      id: c.id,
      chainRef: c.chain_ref,
      status: c.status,
      addressLine1: property?.address_line1 ?? null,
      city: property?.city ?? null,
      lastActivityAt,
      riskReasons: computeRisk(c.status, lastActivityAt, overdueMilestoneChains.has(c.id)),
    };
  });

  // Apply the remaining filters (status/risk/search) to the chains table.
  // Branch filtering already happened upstream, in resolveDashboardScope,
  // since it changes which chain_ids are even fetched.
  if (filters.status) {
    chains = chains.filter((c) => c.status === filters.status);
  }
  if (filters.riskOnly) {
    chains = chains.filter((c) => c.riskReasons.length > 0);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    chains = chains.filter(
      (c) =>
        c.chainRef.toLowerCase().includes(q) ||
        c.addressLine1?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
    );
  }

  const activeChainsCount = chainsSummary.filter((c) => c.status === "active").length;
  const atRiskChains = chains.filter((c) => c.riskReasons.length > 0);

  const overdueActions: OverdueActionItem[] = [
    ...overdueMilestones.map((m) => ({
      id: m.id,
      kind: "milestone" as const,
      title: m.title,
      dueDate: m.due_date!,
      chainId: m.chain_id,
      chainRef: chainRefById.get(m.chain_id) ?? "",
    })),
    ...overdueTasks.map((t) => ({
      id: t.id,
      kind: "task" as const,
      title: t.title,
      dueDate: t.due_date!,
      chainId: t.chain_id,
      chainRef: chainRefById.get(t.chain_id) ?? "",
    })),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const upcomingCompletions: UpcomingCompletionItem[] = upcomingMilestones.map((m) => {
    const summary = chainsSummary.find((c) => c.id === m.chain_id);
    const property = summary
      ? Array.isArray(summary.properties)
        ? summary.properties[0]
        : summary.properties
      : null;
    return {
      chainId: m.chain_id,
      chainRef: chainRefById.get(m.chain_id) ?? "",
      addressLine1: property?.address_line1 ?? null,
      dueDate: m.due_date,
    };
  });

  const pendingInvites: PendingInviteItem[] = pendingInvitations.map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    status: i.status as "invited" | "viewed",
    chainId: i.chain_id,
    chainRef: chainRefById.get(i.chain_id) ?? "",
    createdAt: i.created_at,
  }));

  const recentActivity: RecentActivityItem[] = recentActivityRows.map((a) => ({
    id: a.id,
    action: a.action,
    chainId: a.chain_id,
    chainRef: chainRefById.get(a.chain_id) ?? "",
    createdAt: a.created_at,
  }));

  return {
    scope,
    activeChainsCount,
    atRiskChains,
    pendingInvites,
    overdueActions,
    recentActivity,
    upcomingCompletions,
    chains,
  };
}
