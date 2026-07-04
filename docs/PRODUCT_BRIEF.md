# ChainLink — Product Brief

## What ChainLink Is

ChainLink is a UK residential property chain-tracking and transaction-orchestration
platform. It gives everyone involved in a property chain — estate agents,
conveyancers, buyers, sellers, and optionally brokers/progression staff — a shared,
real-time view of a transaction's progress, alongside professional tools for firms
managing many transactions at once.

A "chain" in this context is the linked sequence of property transactions that must
all complete together (e.g. a buyer purchasing while their own sale depends on it,
which depends on another sale, and so on).

## Target Users

- **Estate agents** — branch staff managing multiple live transactions
- **Conveyancers / solicitors** — managing legal progression across many chains
- **Buyers and sellers** — the parties actually transacting, usually only ever in
  one chain at a time
- **Brokers / progression staff** (optional) — supporting roles that some firms
  employ specifically to chase chain progress

## Core Value Proposition

Property transactions in the UK are notoriously opaque. Parties currently rely on
phone calls and email chains to find out what's happening. ChainLink replaces that
with:

- a single shared source of truth per chain (milestones, tasks, documents, notes,
  activity timeline)
- visibility for every party into what stage the *whole chain* is at, not just
  their own transaction
- professional-grade dashboards for firms tracking workload and risk across many
  chains simultaneously

## Chain-Level Shared Workspace

Every property chain has a unique **Chain ID**. The chain workspace contains:

- milestones (offer accepted, searches, mortgage offer, exchange, completion, etc.)
- tasks (assignable to specific participants)
- notes
- documents
- an activity timeline (audit trail of what happened and when)
- invites (pending participants)
- participants (everyone currently attached to the chain)
- risk indicators (flags on parts of the chain likely to cause delay)

A chain is the unit of collaboration. It exists independently of any single firm's
subscription.

## Business-Level Professional Workspace

Estate agents and conveyancers can operate **business accounts** representing a
firm (and optionally branches within that firm). A business workspace lets a firm:

- see every chain their staff are involved in, in one place
- view dashboards for workload, risk, milestones, and completions across chains
- see team activity across the firm's caseload

The business workspace is a layer *on top of* chains — it aggregates and manages
access to chains the firm is connected to, rather than owning the chain data
itself.

## Proxy Mode

The platform must be usable by a single, unsubscribed party manually tracking a
chain. In **proxy mode**, one agent or one lead party (e.g. the seller-side agent)
creates and maintains the chain workspace on behalf of others who may not be using
ChainLink at all. This is the minimum viable use case and requires no other party
to adopt the platform.

## Guest Collaboration Mode

Parties who are invited into a chain but don't hold a full paid account participate
as **guests**. A guest can see and interact with the single chain they were invited
into, without needing (or being asked) to sign up for a paid business account.
Guest access is scoped strictly to that one chain.

## Connected Professional Mode

If an invited professional (agent or conveyancer) already holds — or later
creates — a ChainLink business account, the chain becomes visible inside their
firm's business dashboard alongside their other chains. This is **connected
professional mode**: the same chain, now also surfaced through a paid
multi-chain workspace.

## Commercial Model

- **Business customers pay** for multi-chain dashboards, team visibility, and
  workload/risk reporting — this is the paid tier.
- **Guests are never required to pay.** Buyers, sellers, and any single-chain
  participant use the platform for free.
- The platform must deliver value even to a single paying firm with zero other
  adopters on the platform.

## Why Universal Adoption Is Not Required

Property transactions involve many independent parties who did not choose
ChainLink and have no reason to adopt new software mid-transaction. If ChainLink
required every party in a chain to hold an account, it would never reach usable
scale — adoption would need to be simultaneous and universal, which is
unrealistic.

Instead, ChainLink is designed so that:

- **one adopting party** (typically an agent) gets immediate value via proxy mode
- **every other party** can be looped in frictionlessly as a guest, with no
  account required
- **network effects are upside, not a dependency** — if a conveyancer on the
  other side of the chain also has ChainLink, the product gets better for
  everyone, but the product works correctly even if they never adopt it

This is the central design constraint behind the entire access model: value must
not depend on the counterparty's participation.
