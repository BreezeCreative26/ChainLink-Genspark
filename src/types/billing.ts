import type { PlanId } from "@/config/plans";

export interface OrganisationBilling {
  organisationId: string;
  organisationName: string;
  plan: PlanId;
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled";
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  viewerRole: "owner" | "admin" | "agent" | "conveyancer" | "staff";
}

export interface UsageCount {
  used: number;
  limit: number | null; // null = unlimited
}

export interface UsageSummary {
  seats: UsageCount;
  branches: UsageCount;
  activeChains: UsageCount;
}

export interface BillingOverview {
  billing: OrganisationBilling;
  usage: UsageSummary;
}
