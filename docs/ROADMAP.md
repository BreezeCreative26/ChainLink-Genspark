# ChainLink — Roadmap

This roadmap sequences work to de-risk the hardest problems first (the access
model) rather than building visible features first. Phases are functional
milestones, not fixed time boxes.

## Phase 1 — Foundation + Proxy Mode MVP

Goal: prove the core chain data model with the simplest possible access
pattern before introducing multi-party complexity.

- Project setup: Next.js, TypeScript, Tailwind, shadcn/ui, Supabase, Vercel
- Auth (sign up, log in, session handling)
- Create a chain, assign a Chain ID
- Milestones, tasks, notes on a chain (single-owner/proxy mode only)
- Basic chain workspace UI
- No sharing, no invites, no organizations yet

## Phase 2 — Guest Collaboration + Business Workspace

Goal: introduce the multi-party access model and the organization layer,
which together are the product's core differentiation.

- Invite flow (email-based, scoped to a Chain ID)
- Guest participant access (single chain, no account required to meaningfully
  participate)
- Handling of "invited professional already has an account" vs "does not"
  (see `OPERATING_MODEL.md`)
- Organizations, branches, organization membership
- Linking a chain into a firm's business workspace when a connected member
  participates
- Shared vs internal visibility enforcement (RLS policies)

## Phase 3 — Reporting + Hardening

Goal: make the business workspace commercially compelling, and harden the
permission model under real multi-party usage.

- Business dashboard: workload, risk, milestones, completions, team activity
- Risk indicators (manual flags first, computed rules later)
- Activity timeline / audit trail completeness
- Document storage with access-controlled sharing
- Security review of RLS policies and guest access boundaries
- Performance pass on dashboard queries across many chains

## Phase 4 — Integrations + Billing + Enterprise Improvements

Goal: turn the working product into a billable, extensible commercial
platform.

- Stripe billing, plan tiers, seat/chain limits enforcement
- Organization admin controls (roles, permissions within a firm)
- Open API for enterprise reporting integrations
- CRM / case management system integrations (agency and conveyancing side)
- Enterprise features as needed (SSO, audit export, branch-level admin)

## Sequencing Notes

- Phases 1 and 2 are prerequisites for everything else — the chain and
  permission model must be correct before dashboards or billing are built on
  top of them.
- Phase 3 is deliberately positioned before billing: a firm should not be
  asked to pay for a dashboard before the underlying reporting and security
  are solid.
- Integrations are last because they are additive to a stable core, not a
  dependency for reaching a commercially usable product.
