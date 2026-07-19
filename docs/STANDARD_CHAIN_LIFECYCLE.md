# Standard Chain Lifecycle

This document is the platform contract for **every** ChainLink chain. It applies equally to a two-person sale, a long linear chain, and a branching chain with several properties and professional firms. No account, chain reference, or property receives bespoke progression logic.

## 1. Canonical workspace

A chain is one shared workspace (`chains`). Each property sale is a transaction (`chain_nodes`) with its own property, seller, buyer, dependency and 12-stage journey. Participants and firms connect to the shared chain; no firm owns it.

The canonical participant route is `/chains/[id]`. A participant who has exactly one chain is sent directly there. The page renders one transaction card per node, dependencies between cards, every party, current stage, due/overdue state, blockers, transaction progress and total chain progress.

## 2. Creation contract

`create_chain_workspace` creates the following in one PostgreSQL transaction:

1. Chain with a unique `CHAIN-XXXXXX` reference.
2. Active creator participant.
3. First property.
4. First transaction node.
5. The node trigger creates all 12 global milestones before commit.

A seller or buyer creator remains `guest` access mode but is the initial administrator while their participant is active. An eligible professional creator is `connected` when they have an active organisation membership; otherwise they remain a direct, guest-mode professional.

The creator is assigned to the initial seller or buyer side when their role matches that side. Creating a chain means an offer has already been accepted, so **Offer accepted** begins completed and all other canonical stages begin pending.

If any required database step fails, the transaction rolls back. A chain cannot commit without its initial property, node and standard progression.

## 3. Canonical stages

Every transaction receives these global stages in this order:

1. ID verification submitted
2. Offer accepted
3. Memorandum of sale issued
4. Conveyancer instructed
5. Draft contract pack issued
6. Searches ordered
7. Mortgage offer received
8. Enquiries raised
9. Enquiries resolved
10. Ready to exchange
11. Exchange of contracts
12. Completion

The database trigger, rather than one UI path, enforces this. The unique `(chain_node_id, template_id)` index prevents duplicate standard stages. Firm templates may be added in addition to the canonical global stages.

## 4. Adding linked transactions

Managers add a linked transaction through `create_linked_chain_transaction`. The RPC atomically creates:

- The chain-scoped property.
- The transaction node.
- Its dependency on an existing node, if supplied.
- Optional active seller and buyer assignments.
- Its complete 12-stage journey through the node trigger.

The property and dependency must belong to the same chain. Self-dependencies, cross-chain dependencies and dependency cycles are rejected. A rejected operation leaves no orphan property or partial transaction.

## 5. Participants and transaction sides

Every active participant has one chain role and one access mode. Seller/buyer node assignments must reference an active participant on the same chain with the matching role.

When an accepted seller or buyer has exactly one vacant matching side across the chain, the database assigns them automatically. If there are zero or multiple vacant sides, no guess is made; a manager selects the correct transaction in the workspace.

Professionals appear in the participant roster and shared activity even when they are not a private seller/buyer side on a node.

## 6. Invitations

Only a chain manager may send or revoke invitations. The server verifies the authenticated profile, active participant and actor participant ID, and RLS repeats the manager rule.

Acceptance requires:

- A current authenticated account.
- Case-insensitive equality between the authenticated profile email and invitation email.
- A live invitation in `invited` or `viewed` state.
- A matching active organisation membership when the recipient explicitly chooses firm linking.

`accept_chain_invitation` creates/reactivates the participant and resolves the invitation in one transaction. It cannot leave an accepted invitation without a participant or a participant created from an unresolved invitation.

## 7. Management and guest permissions

A manager is either:

- The chain creator with an active participant row, or
- An active `connected` or `proxy` participant.

Managers may invite/revoke, add linked transactions, assign seller/buyer sides, create milestones and change progression states.

An ordinary invited guest may read all shared chain information, comment, upload allowed documents and complete only a shared milestone marked `guest_confirmable`. Database triggers prevent ordinary guests from changing titles, dates, visibility or non-confirmable legal stages.

Organisation observers who can see a chain through firm-wide dashboard scope remain read-only unless they also have their own active participant row.

## 8. Proxy participants

A manager may add a seller or buyer who will not log in. The service authenticates and authorises the manager before creating the synthetic identity. The participant is `proxy`, references the authenticated manager participant, and is automatically assigned only when the vacant side is unambiguous. If participant insertion fails, the synthetic Auth user is deleted.

## 9. Progress calculation

Transaction progress is completed canonical stages divided by 12. Current stage selection prioritises blocked, then in-progress, then the first non-completed stage. Chain progress aggregates the transaction stage sets. Blocked and overdue stages remain visible rather than being hidden by the percentage.

## 10. Activity and audit

Creation, invitations, participant acceptance/linking, proxy creation, node creation, party assignment and milestone changes produce attributed activity events. Shared events are visible to chain participants. Internal events remain organisation-scoped.

## 11. Repeatable verification

Run:

```bash
npm run verify:chain-lifecycle
```

The script creates isolated temporary users and chains, verifies initial and linked 12-stage sets, Offer accepted initialisation, atomic invitation acceptance, automatic buyer assignment, cross-chain dependency rejection, orphan prevention and ordinary guest invitation denial. A `finally` cleanup removes every temporary chain and Auth user whether verification passes or fails.

Before release, also run:

```bash
npm run typecheck
npm run lint
npm run build
npx supabase migration list --linked
```

## 12. Invariants for future features

Any new import, API, automation or admin interface must use the same database functions or preserve the same invariants. It must not insert a chain node and add milestones later, trust a client-supplied actor ID, infer an ambiguous party assignment, or grant management merely because a control is visible in the UI.
