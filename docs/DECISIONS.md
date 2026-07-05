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

### Invitation system (added when invitations/matching were implemented)

- **The six invitation states (invited/viewed/accepted/linked/declined/inactive)
  live on `invitations.status`, not `chain_participants.status`.** The
  original schema deliberately keeps `chain_participants` rows from
  existing until someone has actually joined (see `docs/data-model.md`) —
  a person who's only been invited, viewed the link, or declined was never
  a participant, so those states can't sensibly live on the participant
  table. `chain_participants.status` stays `active`/`removed`, describing
  an already-joined participant's standing on the chain, which is a
  different question. `accepted` and `linked` are both terminal
  invitation states that *result in* a participant row — distinguished so
  the UI and audit trail can tell "joined solo" from "joined and linked to
  a firm" apart, even after the fact.
- **Linking to a firm workspace always requires explicit confirmation —
  never automatic, even on a confirmed account/email match.** A correct
  email match only proves identity, not that the person wants this
  specific chain visible to their whole firm (they may be handling it
  personally, or the match may span a firm they no longer want associated
  with their account). The invite response screen always asks.
- **Account matching is scoped to the *authenticated session's* email
  only, compared case-insensitively against the invitation's email.**
  Never a value read from a form or query parameter — those are trivially
  spoofable by whoever currently holds a session. A mismatch is refused
  outright with no partial access, and the UI explains why in plain terms
  rather than describing the check's internals.
- **Pre-login invitation viewing uses a narrow service-role lookup;** every
  mutation (accept/decline/link) happens only after login, through the
  normal RLS-scoped client. The service-role lookup returns display fields
  only (chain ref, property address, role, inviter name) — never anything
  that would let a visitor infer data about a chain they haven't joined.
- **A restrictive RLS policy backs the application-layer link check.**
  `access_mode = 'connected'` now requires an active membership in the
  named organisation at the database level (`0011_connected_participant_safeguard.sql`),
  independent of the service-layer check in `invitations.ts` — closing the
  gap where a direct API call could otherwise set `connected` +
  `organisation_id` without ever passing through the matching logic.
- **Guest fallback still requires a lightweight account (email + password),
  not a fully anonymous path.** This was already implied by "one identity
  type" in `docs/ARCHITECTURE.md`, but is now concrete: there is no
  passwordless/anonymous participation mode. Note: whether a newly
  signed-up account can act immediately or must confirm its email first
  depends on the Supabase project's auth settings, not on ChainLink's own
  code — see the caveat in `src/app/(auth)/signup/signup-form.tsx`.

### Guest experience (added when the guest one-chain view was implemented)

- **"Guest-visible" is not a third visibility tier.** It's the same thing
  as `shared` — a guest sees exactly the shared content any chain
  participant sees, nothing more, nothing differently labelled. The
  two-tier model from `docs/OPERATING_MODEL.md` is unchanged.
- **Comments reuse the `notes` table rather than a new one.** A guest
  "comment" and a firm's internal "note" are the same shape (free text,
  attributed, timestamped) — they differ only in `visibility`. The
  guest-facing UI only ever writes `visibility = 'shared'`; a dedicated
  internal-notes UI for firms is still unbuilt (schema and RLS already
  support it).
- **A guest may confirm ONLY milestones explicitly flagged
  `guest_confirmable`, enforced by a database trigger, not just
  application code.** The trigger (`enforce_guest_milestone_confirmation`,
  `0012_guest_capabilities.sql`) also restricts a guest's update to the
  `status`/`completed_at`/`source`/`recorded_by_participant_id` columns
  only — a guest cannot use a legitimate confirm action as a vector to
  change a milestone's title, due date, or visibility. This is real
  defense-in-depth: it holds even against a crafted direct API call that
  bypasses the application's service layer entirely.
- **"Approved documents" means a fixed category enum, not a review
  workflow.** A guest upload must carry one of five recognized categories
  (ID verification, proof of funds, proof of address, mortgage offer,
  other), enforced by a `CHECK` constraint plus a restrictive RLS policy
  requiring guests specifically to supply one. A real per-firm approval
  workflow (e.g. "only accept documents a conveyancer has pre-requested")
  is a plausible future upgrade, not this MVP's scope.
- **Document storage is real, not deferred.** A Supabase Storage bucket
  (`chain-documents`) and matching object-level policies were added now
  rather than left for later — a "guest can upload documents" feature that
  doesn't actually store a file isn't meaningfully built. Storage
  read-access mirrors the `documents` table's own visibility rule exactly
  (`0013_document_storage.sql`), rather than relying on the storage path
  convention alone, so a guest can't probe another chain's files by
  guessing folder names.
- **"No business dashboards for guests" is evaluated globally per person,
  not per chain.** Being a guest on THIS chain doesn't hide Dashboard if
  the same person has genuine `connected` or `proxy` standing on some
  other chain — Dashboard reflects their overall professional standing.
  The nav item is hidden client-side AND the `/dashboard` route
  redirects server-side for a pure guest — the route guard is the one that
  actually matters; the nav hiding is a courtesy, not the enforcement.

### Business dashboard (added when the dashboard layer was implemented)

- **Risk is computed at query time from existing data, not stored.**
  Resolves the "Risk indicator computation" open question below: a chain
  is flagged at-risk if it has an overdue milestone, has had no activity
  in 14 days, or its status is `stalled` — no new `risk_indicators` table.
  A manual override/flag is a plausible future addition; nothing in this
  MVP needed it yet.
- **Historical visibility on connection is "full history, always."**
  Resolves the other open question below: once a participant is
  `connected`, their firm's dashboard reads the chain's entire activity,
  not just activity from the point of connection onward. Rationale:
  partial history is more confusing than useful for a dashboard whose job
  is to show risk and workload accurately — a firm assessing a chain's
  risk needs to know it's been quiet for three weeks even if they only
  joined yesterday.
- **A structural RLS gap was found and closed, not designed in from the
  start.** Every policy through migration 0013 was participant-scoped —
  nothing let a firm see a colleague's chain unless the viewer was
  personally on it, which made the entire "numerous chains in one place"
  business dashboard concept impossible. `0014_dashboard_read_visibility.sql`
  adds `is_org_connected_to_chain()` and new SELECT-only policies across
  chains/participants/properties/milestones/tasks/activity/invitations/
  documents/notes (plus the matching Storage policy). Deliberately
  SELECT-only: firm-wide dashboard visibility must never quietly grant
  firm-wide edit rights on chains someone isn't personally attached to.
- **Dashboard has two modes, resolved by organisation membership.** A
  person with an active membership gets the firm-wide view (every chain
  any member of that org is connected to); a person without one — e.g. a
  solo proxy-mode agent — gets a personal view of their own
  connected/proxy chains. This is what keeps "the platform must work even
  if only one agent uses it" true at the dashboard layer specifically, not
  just at the chain-workspace layer.
- **Branch scoping is role-based, not user-configurable for non-admins.**
  Owners/admins can filter by branch (or see everything); everyone else is
  scoped to their own branch automatically, and a branch query parameter
  from a non-admin is ignored rather than honoured — this can't be
  widened by tampering with a URL.
- **A chain's "branch" is inferred from its connected participant's
  membership, not stored on the chain.** Chains don't have a branch_id;
  branch scoping is computed by joining the org's connected participants
  to their own membership records. This avoids adding a redundant
  denormalized field that could drift from the truth (a chain's real
  branch is "whichever branch the connected agent belongs to").
- **One organisation membership drives the dashboard, even if a person
  belongs to more than one firm.** Multi-firm membership is a real but
  rare case — see the open question below.

### Document handling (added when secure document handling was implemented)

- **The 8-category taxonomy (memorandum of sale, ID docs, sales forms,
  EPC, contract pack, search results, mortgage offer, other) replaces the
  earlier 5-value guest-only list**, rather than sitting alongside it.
  Existing data was migrated (`id_verification` → `id_docs`;
  `proof_of_funds`/`proof_of_address` → `other`) in
  `0015_document_categories_and_rules.sql`.
- **⚠️ LEGAL REVIEW FLAG: the category/role upload mapping is a product
  default, not a compliance ruling.** Concretely: guests may only upload
  `id_docs`, `sales_forms`, or `other`; `contract_pack` and
  `search_results` require a conveyancer role. This has not been checked
  against CQS, Law Society, or AML regulatory requirements for who may
  validly produce or handle these document types. Treat as a sensible
  starting default to be confirmed with legal counsel before relying on it
  in a regulated context.
- **⚠️ LEGAL REVIEW FLAG: guest-uploaded documents are necessarily
  `shared`, not per-participant private.** Because `visibility='internal'`
  requires an `organisation_id` (which a guest never has), a guest cannot
  upload anything privately — an ID document a buyer uploads is visible to
  the seller, both agents, and both conveyancers, not just their own side.
  This is a real data-minimization gap for sensitive categories like ID
  documents. It is surfaced honestly in the upload UI (a visible warning)
  rather than solved in this pass — a proper fix needs a genuine schema
  change (e.g. a `document_access_grants` table naming exactly which
  participants may see a given row), which is a real feature, not a quick
  addition, and shouldn't be built speculatively before real usage
  clarifies the actual requirement.
- **Document downloads are now an on-demand, logged action
  (`document.viewed`), not a URL pre-generated at page render.** This
  replaced generating a signed URL for every document on every page load
  — which both couldn't distinguish "the list rendered" from "someone
  actually opened this file" and logged nothing. The new flow generates a
  fresh signed URL and writes an audit entry at the moment of actual access.
- **Routine professional document views are logged internal to the
  viewer's own firm, not to the shared feed everyone sees.** A guest
  viewing something already shared with them is logged as `shared` (their
  only option, and not sensitive information); a connected professional's
  view is logged `internal` to their own organisation, so "agent opened
  the contract pack" doesn't appear in the other side's casual activity
  feed.
- **The full audit log is a separate, professional-only view — not an
  expansion of the casual "Activity" card guests already see.** Guests
  keep the existing shared-only feed unchanged; `/chains/[id]/audit`
  adds proxy attribution, source, and visibility columns, and redirects
  guests back to the main chain page if they reach it directly.
- **Storage limits (20MB, a fixed MIME allowlist) are set on the bucket
  itself, checked client-side only for immediate feedback.** The bucket
  configuration is what actually enforces this — client-side validation
  can be bypassed and isn't the authority.

### Commercial / billing scaffolding (added when billing scaffolding was implemented)

- **Plan definitions are static config (`src/config/plans.ts`), not a
  database table.** Plans, their limits, and their features are product
  catalog data that changes when we decide to change it, not per-organisation
  user data — a database table would be persistence for something that
  isn't actually dynamic yet. An organisation's *current* plan is the only
  part that's real data (`organisations.plan`).
- **⚠️ PRICING NOTE: the four plans' prices and limits are illustrative
  placeholders, not finalized commercial decisions.** Treat as subject to
  commercial/pricing review before public launch, the same way earlier
  steps flagged compliance specifics as subject to legal review.
- **Usage (seats, branches, active chains) is computed on demand, not
  tracked as a time-series.** Consistent with how dashboard risk was
  computed in an earlier step: these numbers are already fully derivable
  from `memberships`/`branches`/`chain_participants`, so a separate
  usage-events table would be duplicate state with its own drift risk, not
  actual new capability.
- **Gating is informational, not blocking, at this stage.** Usage-vs-limit
  is shown clearly, including over-limit states, but nothing is hard-blocked
  when a firm exceeds its plan's numbers yet. Blocking a paying firm's core
  workflow because of an internal counter — before any real payment
  processing exists to justify it — would be a worse failure mode than
  under-enforcing for now. Hard enforcement belongs with real Stripe
  integration (docs/ROADMAP.md, Phase 4), not before it.
- **One real feature gate was wired in as the demonstration: branch-level
  dashboard filtering requires the `branch_views` feature (Growth plan and
  above).** Chosen because it's something that already existed and worked,
  not an inert flag added just to prove the gating mechanism — gating a
  real feature is a more honest test than gating nothing. The gate applies
  server-side (a Starter-plan admin can't bypass it via the branch query
  parameter), not just in the UI.
- **Billing settings are visible to any org member, but only owner/admin
  see upgrade/manage actions.** Consistent with treating billing as
  sensitive firm-admin territory — a regular team member can see the
  firm's plan and usage (useful context) without being able to act on it.
- **The Stripe webhook route exists as an explicit 501 stub
  (`src/app/api/webhooks/stripe/route.ts`), not silently absent.** A
  webhook endpoint that doesn't exist at all is indistinguishable from one
  that's broken; returning 501 with a comment describing exactly what it
  will eventually do is more honest scaffolding than no route at all.
- **`organisations.plan`/`subscription_status`/`stripe_customer_id`/
  `stripe_subscription_id`/`current_period_end`/`trial_ends_at` are placeholder
  columns structured to match what a real Stripe integration would
  populate**, not fields with any real payment processing behind them yet.

### Hardening review (added during the commercial-grade hardening pass)

- **Server action errors are now sanitized at the client boundary.** A new
  `AppError` class (`src/lib/errors.ts`) marks errors as deliberately
  safe-to-display; every server action now uses `toActionError()`, which
  shows `AppError` messages verbatim but replaces anything else (including
  raw Postgrest/Postgres errors, which could leak constraint or column
  names) with a generic fallback, logging the real error server-side.
  Found during this review: every action was previously showing
  `err.message` unconditionally, regardless of the error's origin.
- **Environment variables fail fast with a clear message
  (`src/lib/env.ts`)** rather than passing `undefined` into the Supabase
  SDK, which previously failed with a cryptic low-level error far from the
  actual cause.
- **Loading and error states are now real Next.js conventions
  (`loading.tsx`, `error.tsx`, `not-found.tsx`)**, not absent. Found
  during this review: zero existed anywhere in the app; every data-heavy
  route blocked silently during navigation, and an unhandled error showed
  Next.js's default screen even in production.
- **`/tasks` and `/documents` (top-level nav pages) were rewritten from
  misleading placeholders to honest ones.** Found during this review:
  `/documents` claimed Storage "will be built in Phase 3," which was
  false — Storage has existed since the guest-experience step. Both now
  clearly state that per-chain functionality exists and the cross-chain
  aggregated view specifically does not, rather than implying nothing
  works.
- **`/login` and `/signup` now redirect an already-authenticated user**,
  honoring `?redirect=` when present (needed for the invite flow — an
  already-logged-in person clicking an invite link must land on the
  invite page, not be bounced to a hardcoded default). Note: this check
  had to live on the pages themselves, not the shared `(auth)` layout —
  Next.js layouts don't receive `searchParams`, only pages do. An earlier
  draft of this fix put the check in the layout and would have silently
  broken the redirect param; caught before committing.
- **`supabase/seed.sql` is now idempotent** — a cleanup block at the top
  deletes the demo chains, organisations, and auth users before
  re-inserting, relying on existing `on delete cascade` relationships to
  clean up everything beneath them. Found during this review: 12 of 32
  insert statements had no `ON CONFLICT` guard (no natural unique key to
  conflict against), so re-running the file directly — not via a full
  `supabase db reset` — silently duplicated demo data.

### Audit remediation (added closing the gaps found in the commercial-grade audit)

This pass deliberately worked through the audit's own "Recommended Next
Build Order" plus the "Immediate Gaps" list, in that priority order.

- **Organisation onboarding was genuinely missing — not documented as
  missing, just absent.** Added a carefully-scoped bootstrap RLS pattern
  (`0017_organisation_onboarding.sql`): anyone can create an inert
  organisation shell, but claiming the founding `owner` membership only
  works when the organisation has zero existing members. Promoting anyone
  to `owner` later — including by an existing admin — is blocked by a
  restrictive policy. Adding co-owners after the fact isn't supported yet;
  this is a deliberate scope cut, not an oversight.
- **Adding a teammate only works if they already have a ChainLink
  account**, found by email. A full pending-organisation-invite system
  (its own token/lifecycle, parallel to but distinct from chain
  invitations) is real, separate scope — not built in this pass.
- **Chain creation now applies milestone_templates**, giving every new
  chain a real starter checklist instead of nothing. "Offer accepted" is
  marked complete immediately, since creating a chain implies one already
  happened.
- **Professionals can now create milestones and set any status**, not
  just guest-confirm pre-existing ones. This is a genuinely separate code
  path from the guest-confirm flow — no changes were made to the guest
  trigger's restrictions.
- **Tasks now have a real UI** (create, status update) — the
  `tasks_update` RLS policy that never existed was added alongside it;
  without it, a task could be created but never marked done.
- **Internal (firm-only) notes now have a UI**, separate from the
  guest-visible comment feed that already existed. Same underlying table,
  distinguished only by `visibility`, exactly as designed originally.
- **Proxy-participant creation is now real application code**, not
  schema-only. Uses the service-role client narrowly for the one step
  that genuinely requires it (creating an auth identity with no
  credentials), with a `.invalid`-TLD synthetic email (RFC 2606) so it can
  never collide with or be mistaken for a real address. Every other part
  of the flow — inserting the `chain_participants` row — goes through the
  caller's own session, governed by the same RLS as everything else.
- **The chain topology (tree-based, branching) design finally has a UI.**
  A chain could always represent a second linked transaction in the
  schema; there was never a way to create one through the product. Kept
  intentionally minimal: address + which existing node it depends on,
  no participant assignment at creation time.
- **Notifications are no longer write-only.** A `/notifications` page and
  a topbar bell with an unread indicator were added; no new RLS was
  needed since `notifications_select`/`notifications_update_self` already
  existed and had simply never been used.

**Explicitly NOT done in this pass, and why:**
- **No automated test suite.** Setting one up and writing meaningful
  coverage is its own multi-session project, not a fix folded into a
  larger pass — doing it hastily here would produce tests worth less than
  no tests.
- **Chain creation is still not wrapped in a single transaction.** The
  same tradeoff as before; promoting it to a Postgres RPC function is a
  real architectural change that deserves its own focused pass, not a
  drive-by edit alongside seven other features.
- **No organisation editing (renaming, changing type).** Only creation was
  in scope; editing is a natural next step, not a blocker.
- **The build has still not actually been run** (`npm install`, `next
  build`, `tsc --noEmit`) — no network access exists in this environment
  to do so. Every fix in this pass was verified by careful manual
  inspection (import resolution, JSX tag balance, RLS/constraint
  cross-checks) rather than a real compiler, which is a materially weaker
  guarantee. This remains the single most important thing to do before
  trusting this codebase further.

## Open Questions (Unresolved)

- **Multiple simultaneous organisation memberships**: the dashboard
  currently reflects only a person's first active membership. A firm
  switcher UI is the natural fix once someone genuinely needs it — not
  built speculatively now.
- **Per-participant document access control**: should a sensitive category
  (starting with `id_docs`) support restricting visibility to specific
  participants rather than the whole chain, once real usage shows this is
  needed? Flagged above as a legal-review item; the schema change involved
  (likely a `document_access_grants` table) is real scope, not a small
  addition.
