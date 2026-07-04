# ChainLink — Operating Model

This document describes *how the product actually behaves* day to day: who can do
what, in what order, and what happens in each branch of the invitation flow. It is
the operational companion to `PRODUCT_BRIEF.md` (the "what and why") and
`ARCHITECTURE.md` (the "how it's built").

## How a Chain Gets Created

A chain is created the moment someone needs a shared workspace for a property
transaction that may involve multiple linked sales. Creation is deliberately
low-friction — it should not require the whole chain to exist or be known upfront.

## Who Can Create a Chain

Any of the following can create a chain:

- a seller-side estate agent (most common case — agents typically originate chains)
- a buyer
- a seller

Whoever creates the chain becomes its initial owner/administrator, with the
ability to invite other participants. Ownership can later include multiple
administrators (e.g. both agents on a chain), but there is always at least one
responsible party.

## Chain ID Concept

Every chain has a unique, stable **Chain ID**, generated at creation. The Chain ID:

- is the single reference point all participants and integrations use to refer
  to that chain
- persists for the lifetime of the chain regardless of how many participants
  join, leave, or change
- is what an invite grants access to — invites are always scoped to a specific
  Chain ID, never broader

## Participant Types

- **Seller**
- **Buyer**
- **Seller's estate agent**
- **Buyer's estate agent**
- **Seller's conveyancer**
- **Buyer's conveyancer**
- **Broker / progression staff** (optional, firm-side)

Each participant has:
- a **role** (from the list above)
- an **access mode** (proxy / guest / connected professional — see
  `PRODUCT_BRIEF.md`)
- a **status** (invited, active, removed)

## Invitation Flow

1. An existing chain participant (typically the creating agent) invites a new
   party by email, assigning them a role (e.g. "buyer's conveyancer").
2. The invited party receives a link scoped to that specific Chain ID.
3. On accepting the invite, the system checks whether the invited party already
   has a ChainLink account.

### If the Invited Professional Already Has a ChainLink Account

- They accept the invite while logged in (or log in to accept it).
- The chain is added to their **personal view** immediately.
- If they belong to a business account (firm), the chain is also **linked into
  that firm's business workspace**, becoming visible on their team's dashboard
  alongside their other chains.
- No duplicate identity or duplicate chain record is created — the existing
  account is simply granted access to the existing chain.

### If They Do Not Have a ChainLink Account

- They accept the invite and are guided through a lightweight signup (or
  no signup at all, for non-professional roles — see Guest User Logic below).
- They are added as a **guest** or **proxy-mode participant** on that one chain
  only.
- They are **not** required or prompted to create a business account. If they are
  a professional (agent/conveyancer) who later decides to create a business
  account, any chains they were already a guest/individual participant on should
  be offered as chains they can bring into their new business workspace.

## How a Chain Links Into a Firm Workspace

A chain is never *owned* by a firm — it is owned at the chain level, independent
of any business account. A firm's business workspace is a **view and management
layer** over the set of chains that firm's members are participants in.

A chain becomes visible in a firm's business workspace when:

- a member of that firm is an active participant on the chain, **and**
- that member is acting under their firm-linked account (connected professional
  mode), not as an anonymous guest

If a firm member leaves the firm, or is removed as a chain participant, the
chain's visibility in that firm's dashboard is re-evaluated accordingly.

## Estate Agent Dashboard Logic

An agent's business dashboard aggregates across every chain the firm is
connected to, showing:

- **workload** — chains per team member, grouped by stage
- **risk** — chains flagged with risk indicators, surfaced prominently
- **milestones** — upcoming and overdue milestones across the whole caseload
- **completions** — chains that have reached completion (for reporting/history)
- **team activity** — recent actions taken by firm members across their chains

Branch-level scoping applies where a firm has multiple branches: a branch
manager sees their branch's chains; firm-level admins can see across branches.

## Guest User Logic

A guest is any participant without a persistent, subscribed account driving
their access. Guest logic:

- access is scoped to exactly one Chain ID
- no dashboard, no cross-chain view — guests only ever see the single chain
  workspace they were invited into
- no payment or subscription is ever required for guest access
- a guest can be a buyer, seller, or in some cases a professional who chooses
  not to (or does not yet) hold a business account
- if a guest later joins a firm's business account, their existing guest chains
  can be surfaced for linking in, rather than being lost

## Internal vs Shared Visibility

Not everything in a chain workspace is visible to every participant. Two
visibility tiers exist:

- **Shared visibility** — milestones, overall chain status, and information all
  participants need to track progress (e.g. "searches ordered," "mortgage offer
  received") is visible to everyone on the chain.
- **Internal visibility** — a firm's internal notes, tasks, and staff assignments
  related to their side of the chain are visible only within that firm's
  business workspace, not to other participants on the chain.

This distinction matters commercially (firms won't adopt a tool that exposes
their internal working notes to the other side of a transaction) and is a hard
requirement carried into the access model in `ARCHITECTURE.md`.
