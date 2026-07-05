import { NextResponse } from "next/server";

/**
 * Placeholder for future Stripe webhook handling (docs/ROADMAP.md, Phase 4).
 *
 * Not implemented yet — returns 501 rather than pretending to process
 * anything, since a webhook endpoint that silently accepts and ignores
 * events is worse than one that visibly doesn't exist.
 *
 * When this is built, it will need to:
 *   1. Verify the Stripe signature (STRIPE_WEBHOOK_SECRET) before trusting
 *      the payload at all.
 *   2. Handle at minimum: checkout.session.completed (set
 *      organisations.plan, stripe_customer_id, stripe_subscription_id),
 *      customer.subscription.updated (sync plan/current_period_end on
 *      upgrade, downgrade, or renewal), customer.subscription.deleted
 *      (set subscription_status = 'canceled'), and
 *      invoice.payment_failed (set subscription_status = 'past_due').
 *   3. Use the service-role client (src/lib/supabase/admin.ts) to write
 *      these fields — a webhook has no user session, by definition.
 *   4. Be idempotent — Stripe retries webhook delivery, so the same event
 *      arriving twice must not double-apply anything.
 *
 * See docs/DECISIONS.md ("Commercial / billing scaffolding") for what
 * exists today (organisations.plan/subscription_status/stripe_* columns,
 * src/config/plans.ts) versus what this route will eventually connect.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Stripe integration not yet implemented." },
    { status: 501 }
  );
}
