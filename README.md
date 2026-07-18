# ChainLink

**ChainLink** is a shared chain workspace platform for UK residential property transactions — giving agents, conveyancers, buyers and sellers a single source of truth for every property chain.

## Overview

- **Visual chain mapping** — see accepted participants, seller/buyer sides and linked property dependencies in one responsive chain view
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

# Resend (transactional email — chain invitations)
RESEND_API_KEY=your-resend-api-key
INVITE_EMAIL_FROM="ChainLink <invites@yourdomain.com>"
```

`INVITE_EMAIL_FROM` must be an address on a domain verified in your Resend
account, or invite emails will fail to send (the invitation itself is
still created — see "Invitation emails" below).

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
   - `RESEND_API_KEY`
   - `INVITE_EMAIL_FROM`
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
| `RESEND_API_KEY` | ✅ | Resend API key, server-only — sends invitation emails |
| `INVITE_EMAIL_FROM` | ✅ | "From" address for invite emails; must be on a Resend-verified domain |
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
| `/chains/[id]` | RLS-authorised | Canonical chain workspace with a visual participant and transaction map; direct participants can act, firm observers are explicitly read-only |
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
- **Required Vercel variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `INVITE_EMAIL_FROM`

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
- Fixed chain creation failing under RLS by moving it to a single atomic `create_chain_workspace` Postgres RPC
- Fixed Next.js Server Actions rejecting requests behind multiple sandbox preview domains
- Wired real transactional invite emails via Resend, with a copy-link fallback when delivery fails
- Fixed invitation acceptance failing under RLS for newly-signed-up invitees: `INSERT ... RETURNING` on `chain_participants` re-evaluates SELECT policies against the brand-new row (the same chicken-and-egg gap as chain creation), so the participant insert now happens as a plain insert with a client-generated id, with the row fetched back in a separate follow-up select once real membership exists
- Replaced the linked-transactions text list with a responsive chain visual that clearly shows every accepted participant (including a distinct “You” state), participant roles, transaction status, seller-to-buyer sides and property dependencies
- Added a safe display fallback for older single-property chains whose seller/buyer participant IDs were not populated, while preserving explicit node-side links for multi-property chains
- Pinned compatible Supabase packages and upgraded Next.js within the 14.2 release line

## Invitation Emails

Sending a chain invitation (from the "New chain" initial-invite step or the
Invitations panel on a chain's detail page) emails the invitee a link to
`/invite/[token]` via [Resend](https://resend.com), using
`src/server/services/email.ts`.

This is deliberately **best-effort, not transactional**: the invitation row
is created and fully usable via its link regardless of whether the email
suceeds. If `RESEND_API_KEY`/`INVITE_EMAIL_FROM` are missing or Resend
returns an error, the failure is logged server-side and the inviter sees an
inline warning ("Invitation created, but the email couldn't be sent—copy
the link below and send it yourself"). Every pending invitation row in the
panel has a copy-link button for exactly this fallback case.

`INVITE_EMAIL_FROM` must be an address on a Resend-verified domain, or every
send will fail with a provider-side rejection.

## Not Yet Implemented

- Live Stripe checkout and webhook processing
- Automated CRM/conveyancing system integrations
- Enterprise SSO and audit export
- Computed risk rules beyond the current milestone/activity signals

## User Guide: Chain Visual

1. Open **Chains** and select the shared chain.
2. In **Chain overview**, confirm both your **You** card and the other participant (for example, Brad) appear under **People in this chain**.
3. Review **Transaction path** to see the property, seller/buyer sides and completion status.
4. Use **Add transaction** to add an onward purchase and choose the property it depends on. Read-only firm observers can view this map but cannot change it.

## Recommended Next Steps

1. Confirm the deployed `/api/health` reports `configuration: true`, `authApi: true`, and `dataApi: true`.
2. Verify all migrations in `supabase/migrations/` and the `chain-documents` Storage policies are active in production.
3. Configure Supabase Auth redirect URLs for the production and required preview Vercel domains.
4. Run role/RLS production tests for owner, admin, agent, conveyancer, staff, independent professional, buyer, seller, guest, and firm observer.
5. Extend transactional email delivery (currently invitations only) to account lifecycle messages (welcome, password reset confirmations, milestone digests).
6. Design per-participant document access grants before regulated handling of sensitive guest uploads.
7. Add live payments only after the indicative plan structure and limits have been commercially approved.
8. Schedule the next major framework/Supabase upgrade to remove remaining dependency audit findings.
