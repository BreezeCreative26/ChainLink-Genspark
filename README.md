# ChainLink

**ChainLink** is a shared chain workspace platform for UK residential property transactions — giving agents, conveyancers, buyers and sellers a single source of truth for every property chain.

## Overview

- **Property chain tracking** — create and manage property chains with real-time status
- **Three access modes** — Proxy (one agent manages all), Guest (invite buyers/sellers), Connected Professional (full firm dashboard)
- **Milestones & Tasks** — track conveyancing progress with shared and internal milestones
- **Documents** — upload and share documents with role-based visibility
- **Comments & Notes** — shared comments + firm-internal notes on each chain
- **Invitations** — invite participants by email with role-based access
- **Role-aware Workspaces** — tailored owner/admin, agent, conveyancer, progression, independent professional, buyer, seller and guest experiences
- **Business Dashboard** — multi-chain workload, risk, invitation and completion oversight for professional firms
- **Cross-chain Work Queue** — RLS-filtered tasks and milestones linked back to their canonical chain
- **Document Library** — RLS-filtered document index with secure, audited opening in the chain workspace
- **Read-only Firm Oversight** — colleagues can review connected chains without silently receiving mutation rights
- **Audit Log** — full activity trail with proxy attribution and visibility control
- **Notifications** — user-scoped chain and invitation updates

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
| `/api/health` | Public | Vercel readiness plus live Supabase Auth/PostgREST probes; exposes status only, never secrets |
| `/chains` | Authenticated | Participant home or a professional's directly joined chains |
| `/chains/new` | Authenticated | Create a new chain workspace |
| `/chains/[id]` | RLS-authorised | Canonical chain workspace; direct participants can act, firm observers are explicitly read-only |
| `/dashboard` | Authenticated professional | Role-aware firm or direct-only solo portfolio, workload, risk and completion overview |
| `/tasks` | Authenticated professional | Cross-chain tasks and milestones in the viewer's authorised dashboard scope |
| `/documents` | Authenticated professional | Cross-chain document index with chain-scoped secure opening |
| `/notifications` | Authenticated | Current-user notifications |
| `/settings` | Authenticated | Role-aware account and workspace controls |
| `/settings/organisation` | Firm member | Organisation team view; management controls remain owner/admin-only |
| `/settings/billing` | Firm member | Indicative plan and usage overview; no live payment processing |

## Deployment Status

- **Platform:** Vercel (Next.js preset)
- **Source delivery:** GitHub-connected deployment
- **Install:** deterministic `npm ci` from the committed lockfile
- **Runtime:** Node.js 18.17–22
- **Health:** `GET /api/health` returns `ok`, `degraded`, or `configuration_required` and separately reports configuration, Supabase Auth API, and PostgREST readiness
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
- Upgraded the non-secret health endpoint to probe Supabase Auth and PostgREST directly
- Added a central membership/participant-derived workspace context for role-aware navigation
- Added distinct professional, independent, buyer, seller and guest home experiences
- Replaced placeholder tasks and documents pages with RLS-filtered cross-chain views
- Added explicit read-only firm observer mode to the canonical chain workspace
- Added richer plan, pricing, operating-mode and security context to the public website
- Modernised settings, organisation, billing and notification surfaces
- Restored strict TypeScript validation and removed stale Hono scaffold files
- Pinned compatible Supabase packages and upgraded Next.js within the 14.2 release line

## Not Yet Implemented

- Transactional invite emails (provider integration required)
- Live Stripe checkout and webhook processing
- Automated CRM/conveyancing system integrations
- Enterprise SSO and audit export
- Computed risk rules beyond the current milestone/activity signals

## Recommended Next Steps

1. Confirm the deployed `/api/health` reports `configuration: true`, `authApi: true`, and `dataApi: true`.
2. Verify all migrations in `supabase/migrations/` and the `chain-documents` Storage policies are active in production.
3. Configure Supabase Auth redirect URLs for the production and required preview Vercel domains.
4. Run role/RLS production tests for owner, admin, agent, conveyancer, staff, independent professional, buyer, seller, guest, and firm observer.
5. Add transaction email delivery for invitations and account lifecycle messages.
6. Design per-participant document access grants before regulated handling of sensitive guest uploads.
7. Add live payments only after the indicative plan structure and limits have been commercially approved.
8. Schedule the next major framework/Supabase upgrade to remove remaining dependency audit findings.
