# ChainLink

**ChainLink** is a shared chain workspace platform for UK residential property transactions — giving agents, conveyancers, buyers and sellers a single source of truth for every property chain.

## Overview

- **Property chain tracking** — create and manage property chains with real-time status
- **Three access modes** — Proxy (one agent manages all), Guest (invite buyers/sellers), Connected Professional (full firm dashboard)
- **Milestones & Tasks** — track conveyancing progress with shared and internal milestones
- **Documents** — upload and share documents with role-based visibility
- **Comments & Notes** — shared comments + firm-internal notes on each chain
- **Invitations** — invite participants by email with role-based access
- **Business Dashboard** — multi-chain workload view for professional firms
- **Audit Log** — full activity trail with proxy attribution and visibility control
- **Notifications** — real-time notification system

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth & Database**: [Supabase](https://supabase.com) (Auth, PostgreSQL, Storage, RLS)
- **Styling**: Tailwind CSS + Radix UI primitives
- **Language**: TypeScript
- **Deployment**: Vercel

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd chainlink
npm install
```

### 2. Set Up Supabase

1. Create a [Supabase](https://supabase.com) project
2. Apply migrations from `supabase/migrations/` (in order)
3. Optionally run `supabase/seed.sql` for demo data

### 3. Environment Variables

Create a `.env.local` file (never commit this):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

### One-click deploy (GitHub integration)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import your GitHub repo
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL)
4. Deploy

### Manual deploy (Vercel CLI)

```bash
npm install -g vercel
vercel
```

## Project Structure

```
src/
├── app/
│   ├── (marketing)/     # Public landing page
│   ├── (auth)/          # Login & signup
│   ├── (app)/           # Authenticated app routes
│   │   ├── chains/      # Chain list, create, detail
│   │   ├── dashboard/   # Professional firm dashboard
│   │   ├── documents/   # Documents view
│   │   ├── notifications/
│   │   ├── settings/    # Org settings, billing
│   │   └── tasks/       # Task overview
│   ├── api/             # API route handlers
│   └── invite/          # Invitation acceptance flow
├── components/
│   ├── layout/          # App shell, sidebar, topbar
│   └── ui/              # Design system components
├── server/
│   ├── repositories/    # Data access layer (Supabase queries)
│   └── services/        # Business logic layer
├── lib/                 # Shared utilities
├── types/               # TypeScript types
└── config/              # App configuration (plans, features)

supabase/
├── migrations/          # Database schema (apply in order)
└── seed.sql             # Demo data for local dev
```

## Data Model

- **Organisations** — estate agencies & conveyancing firms with plan/subscription
- **Profiles** — all users (agents, conveyancers, buyers, sellers)
- **Memberships** — links profiles to organisations with roles
- **Chains** — a property chain with unique reference (CHAIN-XXXXXX)
- **Chain Nodes** — individual property transactions within a chain (tree topology)
- **Chain Participants** — who's in each chain and with what access mode
- **Invitations** — email-based invite flow with token-based acceptance
- **Milestones** — conveyancing progress steps (shared or internal)
- **Tasks** — action items tied to milestones or chains
- **Documents** — files uploaded to chains with category/visibility rules
- **Notes** — shared comments + org-internal notes
- **Activity Logs** — full audit trail per chain

## Demo Account

After running `supabase/seed.sql`:

- **Email**: `jordan.blake@blakeco.example`
- **Password**: `password123`

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Base URL for invite links & auth redirects |
| `STRIPE_SECRET_KEY` | ⏳ | Stripe secret key (Phase 4 — not yet active) |
| `STRIPE_WEBHOOK_SECRET` | ⏳ | Stripe webhook secret (Phase 4 — not yet active) |

## Current Application Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Product overview and live workspace preview |
| `/signup` | Public | Role-aware account creation for professionals and participants |
| `/login` | Public | Secure account access |
| `/api/health` | Public | Vercel/runtime configuration health check; exposes status only, never secrets |
| `/chains` | Authenticated | Chains available to the current participant |
| `/chains/new` | Authenticated | Create a proxy-mode chain workspace |
| `/chains/[id]` | Authorised participant | Chain milestones, topology, tasks, notes, documents, invites and activity |
| `/dashboard` | Authenticated professional | Firm/solo caseload, workload, risk and completion overview |
| `/notifications` | Authenticated | Participant notifications |
| `/settings/organisation` | Authenticated professional | Organisation and team administration |
| `/settings/billing` | Authenticated professional | Plan and usage overview |

## Deployment Status

- **Platform:** Vercel (Next.js preset)
- **Source delivery:** GitHub-connected deployment
- **Install:** deterministic `npm ci` from the committed lockfile
- **Runtime:** Node.js 18.17–22
- **Health:** `GET /api/health`
- **Required Vercel variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`

A deployment without the two public Supabase variables now keeps the website,
login and signup routes online and shows an actionable configuration notice. It
no longer returns an opaque server-side exception when a visitor clicks **Get
started**. Add the variables to all required Vercel environments (Production,
Preview and Development), then redeploy to activate authentication.

## Completed in the Current Product Pass

- Rebuilt the public experience around ChainLink's whole-chain value proposition
- Added a detailed product workspace preview, access-mode explanation and security story
- Redesigned login and signup as responsive, professional product surfaces
- Added professional vs buyer/seller account intent during signup
- Added safe local-only post-auth redirect handling
- Added graceful handling for incomplete Vercel/Supabase configuration
- Added a non-secret health endpoint for deployment checks
- Restored strict TypeScript validation and removed stale Hono scaffold files
- Pinned compatible Supabase packages and upgraded Next.js within the 14.2 release line

## Not Yet Implemented

- Transactional invite emails (provider integration required)
- Live Stripe checkout and webhook processing
- Automated CRM/conveyancing system integrations
- Enterprise SSO and audit export
- Computed risk rules beyond the current milestone/activity signals

## Recommended Next Steps

1. Configure the required Supabase variables in Vercel and confirm `/api/health` returns `status: ok`.
2. Apply all migrations in `supabase/migrations/` to the production Supabase project.
3. Configure Supabase Auth redirect URLs for the production and preview Vercel domains.
4. Run an end-to-end production test: signup → create chain → add transaction → invite participant.
5. Add email delivery for invitations and account lifecycle messages.
6. Schedule the next major framework/Supabase upgrade to remove remaining dependency audit findings.
