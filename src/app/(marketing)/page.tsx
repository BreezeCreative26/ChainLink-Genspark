import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Fingerprint,
  FileCheck2,
  FileText,
  Home,
  KeyRound,
  Landmark,
  Link2,
  Lock,
  MessageSquare,
  Network,
  PoundSterling,
  ShieldCheck,
  Sparkles,
  Users,
  Eye,
} from "lucide-react";

const stackTraits = [
  { title: "Customer-led", description: "Start without an agency" },
  { title: "Agent-sponsored", description: "A premium client service" },
  { title: "Secure by design", description: "RLS-backed access" },
];

const trustPoints = [
  { icon: Fingerprint, title: "One permanent Chain ID", description: "A stable record from offer to completion" },
  { icon: ShieldCheck, title: "Permissioned by role", description: "Shared progress without shared private work" },
  { icon: Network, title: "Independent by design", description: "No single firm owns the transaction record" },
];

const leadModels = [
  {
    icon: KeyRound,
    eyebrow: "MODEL 01 · CUSTOMER-LED",
    title: "Your move. Your shared standard.",
    description:
      "A buyer or seller creates the Chain ID, brings the transaction together and asks each participant to use one transparent progress record.",
  },
  {
    icon: Landmark,
    eyebrow: "MODEL 02 · ESTATE AGENT & ENTERPRISE",
    title: "Make certainty part of the instruction.",
    description:
      "Agencies sponsor access for the chain, deliver a differentiated client experience and operate every instruction from a portfolio control layer.",
  },
];

const howItWorksSteps = [
  {
    number: "01",
    title: "Create the chain",
    description: "A buyer or seller opens a private workspace and receives one permanent Chain ID.",
  },
  {
    number: "02",
    title: "Set the standard",
    description: "Invite the agent, conveyancers and other people whose transaction depends on the chain.",
  },
  {
    number: "03",
    title: "Move as one",
    description: "Each participant works from the same milestones, requests and verified progress record.",
  },
];

const roleCards = [
  {
    number: "01",
    icon: Home,
    title: "Buyers & sellers",
    description:
      "Lead your move with confidence. See the whole chain, know what is holding it up and keep every party working from the same record.",
  },
  {
    number: "02",
    icon: Building2,
    title: "Estate agents",
    description:
      "Sponsor a better client experience, protect pipeline revenue and see risk across every connected instruction before it becomes a fall-through.",
  },
  {
    number: "03",
    icon: Landmark,
    title: "Conveyancers",
    description:
      "Share transaction progress without exposing internal casework, with secure documents and a dependable activity trail.",
  },
];

const securityFeatures = [
  {
    icon: Lock,
    title: "Chain-scoped access",
    description: "Buyers, sellers and guests see only chains they have actively joined.",
  },
  {
    icon: ShieldCheck,
    title: "Firm privacy",
    description: "Internal tasks, notes and documents remain scoped to the authorised organisation.",
  },
  {
    icon: FileCheck2,
    title: "Auditable documents",
    description: "Files open through short-lived links and access is recorded at the moment it happens.",
  },
  {
    icon: Eye,
    title: "Read-only oversight",
    description: "Firm-wide visibility never silently becomes firm-wide mutation authority.",
  },
];

const pricingCards = [
  {
    price: "£39.99",
    priceSuffix: "per participant\nfor one chain",
    title: "Customer-led chain",
    features: [
      "Whole-chain progress and dependencies",
      "Tasks, milestones and approved documents",
      "No recurring consumer subscription",
      "Charge waived when an active agency sponsors the chain",
    ],
    cta: "Create a Chain ID",
    href: "/signup",
    variant: "solid" as const,
  },
  {
    title: "Firm-sponsored access",
    subtitle: "Commercial terms sized by branches, team and active pipeline.",
    features: [
      "Individual participant fee covered by the agency plan",
      "Branch, workload and completion oversight",
      "Read-only colleague visibility with controlled edits",
      "Enterprise integrations, onboarding and support",
    ],
    cta: "Start an agency workspace",
    href: "/signup",
    variant: "outline" as const,
  },
];

const pricingRows = [
  {
    icon: PoundSterling,
    title: "Customer-led chain",
    description: "For chains without an active estate-agent sponsor. Intended as a one-off access fee.",
    price: "£39.99",
    priceSuffix: "per participant / chain",
    cta: "Start a chain",
    href: "/signup",
  },
  {
    icon: Building2,
    title: "Agency-sponsored",
    description: "For estate agencies funding ChainLink as part of their service and managing a live portfolio.",
    price: "Firm plan",
    priceSuffix: "participants included",
    cta: "Create a firm workspace",
    href: "/signup",
  },
  {
    icon: Network,
    title: "Enterprise",
    description: "For networks requiring multi-branch rollout, integrations, SSO, controls and dedicated support.",
    price: "Tailored",
    priceSuffix: "annual agreement",
    cta: "Talk to us",
    href: "/signup",
  },
];

export default function MarketingHomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0b1a24] text-white">
        <div className="hero-grid-dark absolute inset-0 opacity-60" />
        <div className="container relative grid gap-14 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-28">
          <div>
            <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              <span className="h-px w-6 bg-sky-400/70" /> The property chain operating system
            </div>
            <h1 className="max-w-xl font-display text-6xl font-semibold leading-[1.04] tracking-[-0.03em] sm:text-7xl">
              <span className="text-white">One chain.</span>
              <br />
              <span className="text-sky-200/90">One clear</span>
              <br />
              <span className="text-sky-200/90">route home.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/60">
              ChainLink gives every person in a UK property chain one trusted
              place to see progress, resolve delays and move towards
              completion&mdash;whether the chain is customer-led or sponsored
              by an estate agency.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sky-500 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-colors hover:bg-sky-400"
              >
                Start a customer-led chain <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#ways-to-use"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                For estate agents
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {stackTraits.map((trait) => (
                <div key={trait.title}>
                  <p className="text-sm font-semibold text-white">{trait.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">{trait.description}</p>
                </div>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────── */}
      <section className="border-b border-border bg-background">
        <div className="container grid gap-8 py-8 sm:grid-cols-3 sm:divide-x sm:divide-border">
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.title} className="flex items-start gap-3 sm:pl-6 first:sm:pl-0">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{point.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{point.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Two ways to lead ─────────────────────────────────────────── */}
      <section id="ways-to-use" className="container py-20 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Two ways to lead</p>
            <h2 className="mt-4 max-w-md font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              The chain works even when the industry doesn&apos;t move first.
            </h2>
          </div>
          <p className="max-w-lg text-lg leading-8 text-muted-foreground lg:pt-3">
            ChainLink is not dependent on universal software adoption. A
            customer can establish the shared record themselves, or an estate
            agent can include it as part of a premium, fully sponsored
            service.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2">
          {leadModels.map((model) => {
            const Icon = model.icon;
            return (
              <article key={model.title} className="bg-background p-8 sm:p-10">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{model.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{model.title}</h3>
                <p className="mt-3 max-w-sm leading-7 text-muted-foreground">{model.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── How it works (dark) ──────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#0b1a24] text-white">
        <div className="container grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-28">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Customer-led by design</p>
            <h2 className="mt-4 max-w-sm font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              A chain can choose clarity from day one.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/55">
              No waiting for every firm to buy the same software. The person
              with the strongest reason to get the move completed can
              establish the workspace.
            </p>
          </div>
          <div className="divide-y divide-white/10 border-t border-white/10">
            {howItWorksSteps.map((step) => (
              <div key={step.number} className="grid gap-5 py-6 sm:grid-cols-[3rem_1fr] sm:items-start">
                <span className="font-mono text-sm text-sky-300">{step.number}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-1.5 max-w-md leading-6 text-white/55">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role cards ───────────────────────────────────────────────── */}
      <section id="for-everyone" className="bg-slate-50/80">
        <div className="container py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">One record, the right view</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Built around the people who actually get a move completed.
            </h2>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-3">
            {roleCards.map((role) => {
              const Icon = role.icon;
              return (
                <article key={role.title} className="bg-white p-7">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">{role.number}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-foreground">{role.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{role.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-4">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Chain-scoped access</p>
              <p className="text-xs text-muted-foreground">Buyers, sellers and guests see only chains they have actively joined.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────────────── */}
      <section id="security" className="bg-[#e7eef4]">
        <div className="container grid gap-12 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:py-28">
          <div>
            <div className="mb-6 flex h-9 items-center gap-1">
              <span className="h-6 w-6 rounded-full border-2 border-primary" />
              <span className="-ml-3 h-6 w-6 rounded-full border-2 border-primary/50" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Security that follows the chain</p>
            <h2 className="mt-4 max-w-sm font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Visibility without giving everyone the keys.
            </h2>
            <p className="mt-5 max-w-sm leading-7 text-slate-600">
              The chain is shared. Access is not. Participant roles, firm
              membership and data visibility are separate decisions enforced
              at the database boundary.
            </p>
          </div>

          <div className="divide-y divide-slate-900/10 border-t border-slate-900/10">
            {securityFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="grid gap-4 py-5 sm:grid-cols-[2.5rem_1fr] sm:items-start">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-1 leading-6 text-slate-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="container py-20 sm:py-28">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2">
          {pricingCards.map((card) => (
            <div key={card.title} className="flex flex-col bg-white p-8 sm:p-10">
              {card.price ? (
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold tracking-tight text-foreground">{card.price}</span>
                  <span className="whitespace-pre-line text-sm leading-4 text-muted-foreground">{card.priceSuffix}</span>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-2xl font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.subtitle}</p>
                </>
              )}
              <ul className="mt-6 flex-1 space-y-3 border-t border-border pt-6">
                {card.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={card.href}
                className={
                  card.variant === "solid"
                    ? "mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    : "mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-6 text-sm font-semibold text-foreground transition-colors hover:bg-slate-50"
                }
              >
                {card.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-5 text-muted-foreground">
          Commercial model direction: payment processing is not active yet, so
          no fee is currently collected. Consumer terms, sponsorship rules,
          refunds and any transaction-condition wording require commercial and
          legal review before paid launch.
        </p>

        <div className="mt-20 grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              Pricing direction
            </span>
            <h2 className="mt-5 max-w-xs font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Pay for the model that leads the chain.
            </h2>
            <p className="mt-4 max-w-xs leading-7 text-muted-foreground">
              Simple for customers. Commercially aligned for firms. No hidden
              cross-chain access and no duplicate chain records.
            </p>
          </div>

          <div className="divide-y divide-border border-t border-border">
            {pricingRows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.title} className="grid items-center gap-4 py-5 sm:grid-cols-[2rem_1fr_auto_auto]">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{row.title}</p>
                    <p className="mt-0.5 max-w-md text-sm leading-5 text-muted-foreground">{row.description}</p>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-base font-semibold text-foreground">{row.price}</p>
                    <p className="text-xs text-muted-foreground">{row.priceSuffix}</p>
                  </div>
                  <Link href={row.href} className="inline-flex items-center gap-1 justify-self-end text-sm font-semibold text-primary hover:underline">
                    {row.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="container pb-20 sm:pb-28">
        <div className="overflow-hidden rounded-[2rem] bg-accent px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Bring clarity to your next completion</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Stop chasing updates. Start orchestrating the chain.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Create a workspace in minutes, run it yourself, and invite each party when the transaction is ready.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white px-7 text-sm font-semibold text-foreground">
              Log in to your workspace
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductPreview() {
  const rows = [
    { address: "18 Meadow View", status: "Searches returned", tone: "clear" as const },
    { address: "42 Oakfield Road", status: "Mortgage offer due", tone: "watch" as const },
    { address: "7 The Crescent", status: "Enquiries answered", tone: "clear" as const },
  ];

  return (
    <div className="relative lg:pl-6">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0f2029] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-semibold text-sky-300">CHAIN-482917</p>
              <p className="text-sm font-semibold text-white">Oakfield Road</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Live chain
          </span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Chain health</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-white">3 linked moves</p>
              </div>
              <p className="text-sm font-semibold text-sky-300">62%</p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[62%] rounded-full bg-sky-400" />
            </div>
            <div className="mt-5 space-y-2.5">
              {rows.map((row, index) => (
                <div key={row.address} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-[11px] font-semibold text-white/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{row.address}</p>
                    <p className="text-xs text-white/45">{row.status}</p>
                  </div>
                  {row.tone === "watch" ? (
                    <span className="h-2 w-2 shrink-0 rounded-sm bg-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" /> Next signal
              </div>
              <p className="mt-2 text-sm font-semibold text-white">Mortgage offer</p>
              <p className="mt-1 text-xs leading-5 text-white/45">Due in 2 days<br />Buyer&apos;s broker</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="space-y-2.5 text-sm">
                <PreviewCount icon={FileText} label="Documents" value="12" />
                <PreviewCount icon={MessageSquare} label="Updates" value="8" />
                <PreviewCount icon={Users} label="People" value="9" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-3 text-[11px] text-white/35">
          Shared chain record &middot; Updated 4 minutes ago &middot; Access controlled by role
        </div>
      </div>
    </div>
  );
}

function PreviewCount({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <span className="flex items-center justify-between text-white/70">
      <span className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-white/40" /> {label}
      </span>
      <strong className="text-white">{value}</strong>
    </span>
  );
}
