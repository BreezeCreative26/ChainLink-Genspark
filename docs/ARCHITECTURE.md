# ChainLink — Architecture

This document describes the technical foundation of ChainLink and the reasoning
behind it. It should stay in sync with actual implementation decisions recorded
in `DECISIONS.md`.

## Recommended Stack

- **Next.js** (App Router) — frontend + server logic in one deployable
- **TypeScript** — end to end
- **Tailwind CSS** — styling
- **shadcn/ui** — component primitives
- **Supabase** — Postgres database, auth, storage
- **Vercel** — deployment and hosting

## Why This Stack Suits ChainLink

- **Next.js + Vercel** gives a single deployable app with server-rendered pages,
  route handlers for webhooks/APIs, and fast iteration — appropriate for a
  product at pre-scale stage where operational simplicity matters more than
  infrastructure sophistication.
- **Supabase** provides Postgres (relational integrity matters here — chains,
  participants, and permissions are inherently relational), built-in auth
  (including support for both full accounts and lighter-weight guest flows),
  and storage with policy-based access control that mirrors the DB permission
  model — important given document sensitivity.
- **TypeScript throughout** keeps the domain model (chains, participants, roles,
  access modes) consistent between frontend, server logic, and database types,
  which matters a lot given how central correct permissions are to this product.
- **shadcn/ui + Tailwind** allow fast building of dashboard-heavy UI without
  locking into a heavy design system, while staying easy to restyle later.

This stack is intentionally boring and mainstream. Nothing about ChainLink's
early-stage needs justifies more novel infrastructure — the hard problems here
are in the domain and permission model, not the tech stack.

## Tenancy Model

ChainLink has **two coexisting tenancy shapes**, not one:

1. **Chain-level tenancy** — a chain is its own access boundary, independent of
   any organization. Participants are attached directly to a chain.
2. **Organization-level tenancy** — a firm (and its branches) is a separate
   tenant boundary that aggregates *views into* chains its members participate
   in, plus firm-internal data (internal notes, staff assignment, dashboards).

A chain is not "owned" by an organization the way rows are owned by a tenant in
a typical B2B SaaS multi-tenancy model. Organizations have a many-to-many
relationship with chains, mediated through their members' participation.

## Auth Model

- Supabase Auth handles identity (email/password, magic link, and later
  SSO for enterprise firms if needed).
- Every authenticated user is a single identity regardless of how many chains
  or organizations they're connected to — there is no "guest account" as a
  separate identity type. Guest status is a property of a **participant record
  on a chain**, not a different kind of user.
- This means a person who joins as a guest today and later joins or creates a
  business account tomorrow is the same underlying user — their guest chain
  history carries forward naturally.

## Chain vs Business Workspace Concept

- The **chain workspace** is the canonical data owner for everything that
  happens in a transaction: milestones, tasks, documents, notes, timeline.
- The **business workspace** is a derived, aggregating view for organizations,
  built by querying "chains where a member of this org is a participant,"
  plus org-scoped internal data layered on top (internal notes, task
  assignment within the firm, dashboards).
- Business workspaces never fork or duplicate chain data. They read and
  annotate it.

## Permission Model Principles

This is the highest-risk area of the system (see `DECISIONS.md` for the open
questions). Principles agreed so far:

1. **Access is scoped at the participant level, not the user level.** A user's
   permissions on a given chain are determined by their participant record
   (role + access mode) on that specific chain — never inferred globally.
2. **Enforcement should not rely solely on the UI.** Given Supabase is used,
   Row Level Security (RLS) policies at the database layer are the primary
   enforcement mechanism, with application-layer service code as a second
   layer of defense — not the other way around. This avoids the class of bug
   where a UI correctly hides something but an API route or direct query
   leaks it.
3. **Shared vs internal visibility is a first-class data property**, not a
   convention. Internal (firm-only) data is modeled and access-controlled
   distinctly from shared chain data (see `OPERATING_MODEL.md`).
4. **Guests get the narrowest possible scope by default** — access to exactly
   one chain, nothing else, with no implicit escalation.

## Data Model Overview

Core entities (detailed schema to be defined in `docs/data-model.md` when we
reach implementation):

- User, Organization, Branch, OrganizationMember
- Chain, ChainParticipant, PropertyLink
- Milestone, Task, Note, Document, ActivityEvent
- Invite, RiskIndicator

The relationship between Organization and Chain is indirect, via
OrganizationMember → ChainParticipant, reflecting the tenancy model above.

## Deployment Assumptions

- Single Next.js app deployed to Vercel, single Supabase project per
  environment (dev / staging / production).
- Environment separation via separate Supabase projects, not shared-schema
  separation, to keep RLS policy testing honest between environments.
- No separate backend service at this stage — Next.js route handlers and
  Supabase cover the needs of the roadmap through at least Phase 3.

## Future Integration Strategy

Not built now, but architecturally anticipated:

- **Property portal / CRM integrations** (e.g. agency CRMs like Reapit,
  Street.co.uk) for chain creation to be triggered from an agent's existing
  tools rather than requiring manual entry.
- **Conveyancing case management system integrations**, for similar reasons
  on the legal side.
- **Notification channels** (email now; SMS/WhatsApp later) given how
  non-technical some chain participants (sellers/buyers) will be.
- **Open API** for enterprise firms wanting to pull chain data into their own
  reporting, gated behind the business tier.

Integration points should be additive to the core chain/participant model, not
require restructuring it — this is a reason to keep the chain data model clean
and integration-agnostic from the start.
