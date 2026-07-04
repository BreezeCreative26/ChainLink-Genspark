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

## Open Questions (Unresolved)

- **Multiple simultaneous organisation memberships**: the dashboard
  currently reflects only a person's first active membership. A firm
  switcher UI is the natural fix once someone genuinely needs it — not
  built speculatively now.
