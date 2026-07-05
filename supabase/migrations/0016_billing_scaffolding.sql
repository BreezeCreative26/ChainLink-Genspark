-- ChainLink schema: 0016 — billing scaffolding
--
-- Adds subscription awareness to organisations, structured to match what
-- a future Stripe integration would actually populate — see
-- docs/DECISIONS.md ("Commercial / billing scaffolding") for the reasoning
-- and for what is deliberately NOT built yet (real payment processing,
-- hard usage enforcement, a dynamic plans table).
--
-- Plan definitions themselves (limits, features, display price) live in
-- src/config/plans.ts, not the database — they're product catalog data,
-- not per-organisation data.

alter table organisations
  add column plan text not null default 'starter'
    check (plan in ('starter', 'growth', 'business', 'enterprise')),
  add column subscription_status text not null default 'active'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  -- Populated once real Stripe integration exists (Phase 4,
  -- docs/ROADMAP.md). Nullable because every organisation created by this
  -- scaffolding has no real payment method behind it yet.
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column current_period_end timestamptz,
  add column trial_ends_at timestamptz;

create unique index organisations_stripe_customer_id_idx
  on organisations(stripe_customer_id)
  where stripe_customer_id is not null;
