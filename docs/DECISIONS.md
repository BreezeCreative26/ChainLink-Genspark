# ChainLink — Decisions Log

This is a running log of significant product and technical decisions, why they
were made, and questions still open. Update this file whenever a decision in
`ARCHITECTURE.md` or `OPERATING_MODEL.md` is made, changed, or reconsidered —
it should always reflect the current reasoning, not just the current state.

## Decisions Made

### Product

- **The platform must work with a single unsubscribed agent using it (proxy
  mode).** Rationale: universal adoption cannot be a dependency for the
  product to deliver value — see `PRODUCT_BRIEF.md`.
- **Guests are never required to pay or hold a full account.** Rationale: the
  commercial model monetizes firms via multi-chain dashboards, not
  transaction volume — forcing guest payment would suppress the very adoption
  that makes the product useful.
- **A chain is not owned by an organization.** Rationale: chains must exist
  and function independently of any firm's subscription status (proxy mode
  requirement), and multiple firms (buyer's + seller's side) may be
  legitimately connected to the same chain simultaneously.
- **Guest and full-account users are the same identity type**, distinguished
  only by their participant record's access mode on a given chain, not by a
  separate "guest account" entity. Rationale: avoids identity fragmentation
  when a guest later becomes a subscribed professional.
- **Internal (firm-only) data is modeled distinctly from shared chain data.**
  Rationale: firms will not adopt a tool that exposes their internal notes to
  the other side of a transaction — this is a commercial hard requirement,
  not just a technical nicety.

### Technical

- **Stack: Next.js, TypeScript, Tailwind, shadcn/ui, Supabase, Vercel.**
  Rationale: mainstream, low-operational-overhead stack appropriate for
  pre-scale stage; the hard problems in this product are domain/permission
  modeling, not infrastructure novelty.
- **Single Next.js app, not a monorepo, at this stage.** Rationale: no
  current need for multiple deployables (no mobile app, no separate public
  API package yet); monorepo tooling would add overhead without payoff today.
  Revisit if/when a mobile app or standalone public API is scoped.
- **Repository/service layer between Supabase queries and business logic.**
  Rationale: centralizes permission-sensitive data access in one place rather
  than scattering raw queries across components — reduces risk of
  inconsistent enforcement.
- **Row Level Security (RLS) as the primary permission enforcement
  mechanism, application-layer checks as a second layer.** Rationale: avoids
  the failure mode where UI hides data correctly but a direct API call or
  query leaks it. Enforcement should not depend on the UI being the only
  gatekeeper.
- **Documentation-first for the access model, before schema or code.**
  Rationale: the permission model touches every other architectural decision
  (schema shape, RLS design, API shape, UI conditionals) — getting it wrong
  first would likely require rebuilding the permissions layer.

### Schema (added when the MVP schema was implemented — see `docs/data-model.md`)

- **Chain topology is a tree, not a strict linear list.** `chain_nodes.depends_on_node_id`
  lets one transaction depend on another completing first, covering the
  common onward-purchase case. A full multi-parent DAG was deliberately not
  built — no current requirement needs it, and the column can be promoted to
  an edges table later without breaking anything. Resolves the "Chain
  topology" open question below.
- **Multiple firms can be connected to the same chain simultaneously.**
  `organisation_id` lives on `chain_participants`, not on `chains`, so two
  firms' `connected` participants coexist naturally, and internal-visibility
  rows are scoped per-organisation. Resolves "Multiple connected firms on
  one chain" below.
- **Guest-to-connected transition needs no separate claim table.** Guests and
  professionals share one `profiles` identity; existing `chain_participants`
  rows are found by `profile_id` and offered for linking when a guest joins
  a firm. Resolves "Guest-to-connected-professional transition mechanics"
  below.
- **Branches are built now, but optional.** `branches` exists with a
  nullable FK from `memberships`, so a firm can stay flat. Resolves "Branch
  structure necessity for v1" below.
- **Enums are `text` + `check` constraints, not native Postgres enum types.**
  Rationale: adding a new allowed value to a check constraint is a simple
  migration; altering a native enum type is more disruptive, especially once
  it's referenced by dependent objects.
- **RLS policies for MVP are a baseline, not the final security posture.**
  Core chain/organisation/visibility scoping is enforced now; finer-grained
  role checks (e.g. only conveyancers can complete legal milestones) are
  deferred to the Phase 3 hardening pass per `docs/ROADMAP.md`.

## Open Questions (Unresolved)

- **Historical visibility on connection**: when a professional's chain
  becomes "connected" into their firm's business workspace, does the firm see
  the chain's full history from creation, or only activity from the point of
  connection onward? (Schema supports either — this is a query/business-logic
  decision, not a schema one — but should be settled before the dashboard is
  built.)
- **Risk indicator computation**: are risk indicators manually flagged only
  in early phases, or is there an early case for simple rule-based automatic
  flagging (e.g. "no activity in 14 days")? Not part of the MVP schema (no
  `risk_indicators` table yet) — affects Phase 3 scope.
