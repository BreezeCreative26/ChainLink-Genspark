export type WorkspacePersona =
  | "owner"
  | "admin"
  | "agent"
  | "conveyancer"
  | "staff"
  | "buyer"
  | "seller"
  | "participant";

export type WorkspaceMode = "firm" | "solo" | "participant";

export interface WorkspaceContext {
  mode: WorkspaceMode;
  persona: WorkspacePersona;
  roleLabel: string;
  organisationId: string | null;
  organisationName: string | null;
  branchId: string | null;
  branchName: string | null;
  canViewBusinessDashboard: boolean;
  canManageOrganisation: boolean;
  canManageBilling: boolean;
  showCrossChainTools: boolean;
  homeHref: "/dashboard" | "/chains";
}
