export type DashboardMode = "firm" | "solo";

export interface DashboardBranch {
  id: string;
  name: string;
}

export interface DashboardScope {
  mode: DashboardMode;
  organisationId: string | null;
  organisationName: string | null;
  /** Only meaningful in 'firm' mode. Empty if the firm has no branches. */
  branches: DashboardBranch[];
  /** Whether the org's plan includes branch-level dashboard views. */
  branchViewsEnabled: boolean;
  /** Only meaningful in 'firm' mode. 'owner'/'admin' see all branches. */
  viewerRole: "owner" | "admin" | "agent" | "conveyancer" | "staff" | null;
  viewerBranchId: string | null;
  /** The chain_ids this dashboard instance is allowed to aggregate over. */
  chainIds: string[];
}

export type RiskReason = "overdue_milestone" | "no_recent_activity" | "stalled";

export interface ChainRow {
  id: string;
  chainRef: string;
  status: "active" | "stalled" | "completed" | "fallen_through";
  addressLine1: string | null;
  city: string | null;
  lastActivityAt: string | null;
  riskReasons: RiskReason[];
}

export interface OverdueActionItem {
  id: string;
  kind: "milestone" | "task";
  title: string;
  dueDate: string;
  chainId: string;
  chainRef: string;
}

export interface UpcomingCompletionItem {
  chainId: string;
  chainRef: string;
  addressLine1: string | null;
  dueDate: string | null;
}

export interface PendingInviteItem {
  id: string;
  email: string;
  role: string;
  status: "invited" | "viewed";
  chainId: string;
  chainRef: string;
  createdAt: string;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  chainId: string;
  chainRef: string;
  createdAt: string;
}

export interface DashboardData {
  scope: DashboardScope;
  activeChainsCount: number;
  atRiskChains: ChainRow[];
  pendingInvites: PendingInviteItem[];
  overdueActions: OverdueActionItem[];
  recentActivity: RecentActivityItem[];
  upcomingCompletions: UpcomingCompletionItem[];
  chains: ChainRow[];
}

export interface DashboardFilters {
  status?: ChainRow["status"];
  riskOnly?: boolean;
  branchId?: string;
  search?: string;
}
