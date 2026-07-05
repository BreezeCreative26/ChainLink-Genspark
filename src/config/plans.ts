/**
 * ChainLink plan catalog.
 *
 * These are product-defined tiers, not per-organisation data — they live
 * in code rather than a database table (see docs/DECISIONS.md, "Commercial
 * / billing scaffolding"). An organisation's CURRENT plan is stored on
 * `organisations.plan`; this file defines what each plan actually means.
 *
 * PRICING NOTE: the prices and limits below are illustrative placeholders
 * for the billing scaffolding, not finalized commercial decisions. Treat
 * as subject to commercial/pricing review before public launch.
 */

export type PlanId = "starter" | "growth" | "business" | "enterprise";

export type FeatureKey = "branch_views";

export interface Plan {
  id: PlanId;
  name: string;
  /** Display string — "Contact us" for Enterprise rather than a number. */
  priceDisplay: string;
  description: string;
  limits: {
    seats: number | null; // null = unlimited
    branches: number | null;
    activeChains: number | null;
  };
  features: FeatureKey[];
  highlights: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceDisplay: "£29/mo",
    description: "For a single agent or a very small team getting started.",
    limits: { seats: 3, branches: 1, activeChains: 15 },
    features: [],
    highlights: [
      "Up to 3 team members",
      "Up to 15 active chains",
      "1 branch",
      "Business dashboard",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceDisplay: "£79/mo",
    description: "For a growing agency or conveyancing practice with more than one branch.",
    limits: { seats: 10, branches: 3, activeChains: 60 },
    features: ["branch_views"],
    highlights: [
      "Up to 10 team members",
      "Up to 60 active chains",
      "Up to 3 branches",
      "Branch-level dashboard views",
    ],
  },
  business: {
    id: "business",
    name: "Business / Network",
    priceDisplay: "£199/mo",
    description: "For larger firms or networks operating across many branches.",
    limits: { seats: 30, branches: null, activeChains: 250 },
    features: ["branch_views"],
    highlights: [
      "Up to 30 team members",
      "Up to 250 active chains",
      "Unlimited branches",
      "Branch-level dashboard views",
      "Priority support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceDisplay: "Contact us",
    description: "For large networks needing custom limits, integrations, or contracts.",
    limits: { seats: null, branches: null, activeChains: null },
    features: ["branch_views"],
    highlights: [
      "Unlimited team members",
      "Unlimited active chains",
      "Unlimited branches",
      "Custom integrations",
      "Dedicated support",
    ],
  },
};

export function hasFeature(planId: PlanId, feature: FeatureKey): boolean {
  return PLANS[planId].features.includes(feature);
}

export const PLAN_ORDER: PlanId[] = ["starter", "growth", "business", "enterprise"];
