import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { BillingOverview } from "@/types/billing";
import { PLANS, hasFeature, type FeatureKey } from "@/config/plans";
import * as billingRepo from "@/server/repositories/billing.repository";
import * as dashboardRepo from "@/server/repositories/dashboard.repository";

type TypedClient = SupabaseClient<Database>;

/**
 * Returns null if the user has no active organisation membership — billing
 * is an organisation concept, not a personal one (a solo proxy agent has
 * nothing to bill here). Callers should treat null as "no billing to
 * show", not an error.
 */
export async function getBillingOverviewForCurrentUser(
  supabase: TypedClient
): Promise<BillingOverview | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const memberships = await dashboardRepo.getActiveMemberships(supabase, user.id);
  const membership = memberships[0]; // see docs/DECISIONS.md on the multi-firm open question
  if (!membership) return null;

  const [orgRow, seatsUsed, branchesUsed, chainsUsed] = await Promise.all([
    billingRepo.getOrganisationBillingRow(supabase, membership.organisation_id),
    billingRepo.countActiveMemberships(supabase, membership.organisation_id),
    billingRepo.countBranches(supabase, membership.organisation_id),
    billingRepo.countActiveConnectedChains(supabase, membership.organisation_id),
  ]);

  const plan = PLANS[orgRow.plan];

  return {
    billing: {
      organisationId: orgRow.id,
      organisationName: orgRow.name,
      plan: orgRow.plan,
      subscriptionStatus: orgRow.subscription_status,
      currentPeriodEnd: orgRow.current_period_end,
      trialEndsAt: orgRow.trial_ends_at,
      viewerRole: membership.role,
    },
    usage: {
      seats: { used: seatsUsed, limit: plan.limits.seats },
      branches: { used: branchesUsed, limit: plan.limits.branches },
      activeChains: { used: chainsUsed, limit: plan.limits.activeChains },
    },
  };
}

/**
 * Feature gating for the CURRENT user's organisation. Returns false (no
 * access) if the user has no organisation at all — a solo agent sees no
 * plan-gated features, which is correct: those features only exist in the
 * firm/business layer.
 *
 * This is intentionally the only kind of gating implemented right now —
 * "can this org see feature X" — not usage-limit blocking (see
 * docs/DECISIONS.md, "Commercial / billing scaffolding", for why hard
 * enforcement is deliberately deferred).
 */
export async function currentUserOrgHasFeature(
  supabase: TypedClient,
  feature: FeatureKey
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const memberships = await dashboardRepo.getActiveMemberships(supabase, user.id);
  const membership = memberships[0];
  if (!membership) return false;

  const orgRow = await billingRepo.getOrganisationBillingRow(supabase, membership.organisation_id);
  return hasFeature(orgRow.plan, feature);
}
