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

## Open Questions (Unresolved)

- **Chain topology**: are chains strictly linear, or do we need to support
  branching from the start (e.g. a buyer's onward purchase, multiple
  properties feeding into one chain)? This affects the `PropertyLink` data
  model directly and should be resolved before schema design.
- **Multiple connected firms on one chain**: can a chain have two subscribed
  firms simultaneously (e.g. buyer's agent's firm and seller's agent's firm
  both paying customers), and if so, how do their business dashboards each
  see "their side" without seeing the other firm's internal data?
- **Historical visibility on connection**: when a professional's chain
  becomes "connected" into their firm's business workspace, does the firm see
  the chain's full history from creation, or only activity from the point of
  connection onward?
- **Branch structure necessity for v1**: is branch-level sub-tenancy needed
  from Phase 2, or can organizations be flat until a firm customer actually
  requires branch separation?
- **Risk indicator computation**: are risk indicators manually flagged only
  in early phases, or is there an early case for simple rule-based automatic
  flagging (e.g. "no activity in 14 days")? Affects Phase 3 scope.
- **Guest-to-connected-professional transition mechanics**: when a guest
  professional later creates a business account, exactly how are their prior
  guest chains surfaced and offered for linking — automatic detection by
  email match, or manual claim flow? Needs a decision before Phase 2 invite
  logic is finalized.
