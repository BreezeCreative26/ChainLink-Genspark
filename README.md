# ChainLink

UK residential property chain-tracking and transaction-orchestration platform.

This repo is at the **foundation scaffold** stage: routing, layout shell, and
design system are in place. No data model, auth, or business logic is wired
up yet. See `/docs` for the full product and architecture context before
extending this.

## Start here

Read these in order before making any implementation decisions:

1. `docs/PRODUCT_BRIEF.md` — what ChainLink is and why
2. `docs/OPERATING_MODEL.md` — how the product behaves (chain creation,
   invites, dashboards)
3. `docs/ARCHITECTURE.md` — technical decisions and stack rationale
4. `docs/ROADMAP.md` — phased build order
5. `docs/DECISIONS.md` — decisions made so far, and open questions

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Storage) — not yet connected
- Vercel — deployment target

## Getting started

### Prerequisites

- Node.js 18.18 or later
- npm (or pnpm/yarn if you prefer — lockfile not committed yet)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Fill in .env.local with your Supabase project credentials
#    (required now — auth and chain creation call Supabase directly)

# 4. Apply the database schema (requires the Supabase CLI, linked to your
#    project) and load the demo seed data
supabase db reset

# 5. Run the dev server
npm run dev
```

The app will be available at `http://localhost:3000`. Log in with the
seeded demo account: `jordan.blake@blakeco.example` / `password123` (see
`supabase/seed.sql` for the other seeded accounts).

### Available routes

| Route | Purpose |
|---|---|
| `/` | Public marketing homepage |
| `/login` | Real Supabase Auth login (supports `?redirect=`) |
| `/signup` | Account creation for guest fallback (supports `?redirect=`) |
| `/invite/[token]` | Invitation landing page: view, then accept/link/decline |
| `/dashboard` | Business dashboard: workload, risk, invites, activity — firm-wide or solo caseload |
| `/chains` | Your chains, from real data |
| `/chains/new` | Chain creation form |
| `/chains/[id]` | Chain workspace: participants, invitations, activity |
| `/tasks` | Cross-chain task list (placeholder) |
| `/documents` | Cross-chain document list (placeholder) |
| `/settings` | Account & business workspace settings (placeholder) |

### Scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # run production build
npm run lint       # lint
npm run typecheck  # TypeScript check with no emit
```

## Folder structure

```
chainlink/
├── docs/                     # product & architecture reference docs
├── src/
│   ├── app/
│   │   ├── (marketing)/      # public homepage — own layout, no app shell
│   │   ├── (auth)/           # login — centered auth layout
│   │   ├── (app)/            # authenticated routes — sidebar + topbar shell
│   │   ├── layout.tsx        # root layout (fonts, metadata)
│   │   └── globals.css       # design tokens (CSS variables)
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (button, card, badge...)
│   │   └── layout/           # sidebar, topbar, app shell, logo, page header
│   ├── lib/
│   │   └── utils.ts          # cn() class-merging helper
│   └── types/
│       └── nav.ts            # UI-only nav types (domain types come later)
├── .env.example
└── README.md
```

### Why one `(app)` route group instead of separate chain/business groups?

`docs/ARCHITECTURE.md` describes chain workspaces and business workspaces as
conceptually distinct. At this foundation stage they share identical
navigation and layout needs, so splitting them into separate route groups now
would be premature structure with no behavioral difference to justify it. The
`AppShell` component has a note flagging where to make that split once
chain-level and business-level navigation actually diverge (expected around
Phase 2–3 per `docs/ROADMAP.md`).

## Design notes

- **Palette**: deep teal primary (`--primary`), warm ink neutrals, a soft
  teal-tint accent — deliberately distinct from generic SaaS blue/purple
  templates, intended to read as trustworthy and professional for
  agents/conveyancers handling legal and financial transactions.
- **Type**: Inter for UI text, Fraunces (serif) for marketing/display
  headings, JetBrains Mono reserved specifically for Chain IDs and reference
  codes — a small consistent signature across the product.
- **Responsive strategy**: desktop-first. The sidebar is fixed on desktop and
  becomes a slide-over drawer below the `md` breakpoint.

## What's intentionally not built yet

- Proxy-mode participants with no email (requires an admin-level operation
  to create an identity without login credentials — deliberately deferred)
- Organisation/business account creation and onboarding (memberships and
  organisations currently only exist via seed data or direct DB access)
- A firm switcher for people belonging to more than one organisation
  (dashboard uses the first active membership — see `docs/DECISIONS.md`)
- Tasks UI, and a dedicated internal-notes UI for firms (schema/RLS exist
  for both; only the guest-facing shared comment feed is built so far)
- Full milestone management for professionals (creating/editing milestones,
  applying a template to a new chain) — guests can only confirm
  pre-flagged ones; professionals currently see the same read-only list
- Chain creation is not atomic yet — see the note in
  `src/server/services/chains.ts` on why, and when that gets revisited
- Resending an expired/revoked invitation (currently: send a new one)
- Billing

These follow the phased order in `docs/ROADMAP.md`.

## Guest experience

Log in as the seeded guest buyer (`priya.shah@example.com` — set a
password for this account via the Supabase dashboard, or sign up a fresh
guest account and have it invited) to see the guest-scoped chain view:
milestones (with a Confirm action on the one seeded as
`guest_confirmable`), a shared comment feed, and document upload
restricted to approved categories. Dashboard is hidden from pure guests
both in navigation and at the route level — see `docs/DECISIONS.md`
("Guest experience") for the exact boundary.

## Business dashboard

Log in as the seeded agent (`jordan.blake@blakeco.example` / `password123`)
to see the firm-wide dashboard: two chains, one flagged at-risk (an
overdue milestone), one with an upcoming completion, plus pending invites
and recent activity. The chains table supports status, risk, and search
filters via the URL, and a branch filter appears automatically once a
firm has more than one branch — see `docs/DECISIONS.md` ("Business
dashboard") for how scope and branch visibility are determined.
