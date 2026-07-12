import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Link2,
  Lock,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stages = [
  { label: "Offer accepted", state: "done" },
  { label: "Searches", state: "done" },
  { label: "Mortgage offer", state: "active" },
  { label: "Exchange", state: "next" },
  { label: "Completion", state: "next" },
];

const modes = [
  {
    icon: Users,
    eyebrow: "Start immediately",
    title: "Run the chain in proxy mode",
    description:
      "Track every link yourself, even when nobody else has joined. Value from day one, not after a lengthy rollout.",
  },
  {
    icon: UserPlus,
    eyebrow: "Bring everyone in",
    title: "Invite guests at no cost",
    description:
      "Buyers, sellers and counterparties see only the chain they belong to, with no paid account or training burden.",
  },
  {
    icon: Building2,
    eyebrow: "Scale across your firm",
    title: "Connect professional teams",
    description:
      "Give agents and conveyancers a live portfolio view of workload, risk, milestones and team activity.",
  },
];

export default function MarketingHomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-[#f7faf9]">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="container relative grid gap-14 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge variant="accent" className="rounded-full px-3 py-1 text-xs">
                Built for UK property transactions
              </Badge>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                One live source of truth
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
              See the whole chain. Move every sale forward.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              ChainLink replaces status-chasing with one shared workspace for
              agents, conveyancers, buyers and sellers — from offer accepted to
              completion.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-6 shadow-lg shadow-primary/15">
                <Link href="/signup">
                  Create your first chain <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full bg-white/80 px-6">
                <Link href="#product-preview">Explore the workspace</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> No card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Guests join free
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Works in proxy mode
              </span>
            </div>
          </div>

          <div id="product-preview" className="relative lg:pl-6">
            <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_80px_-25px_rgba(15,45,51,0.28)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-semibold text-primary">CHAIN-482917</p>
                    <p className="text-sm font-semibold text-slate-900">Oakfield Road chain</p>
                  </div>
                </div>
                <Badge variant="success" className="rounded-full">On track</Badge>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-[1.45fr_0.8fr]">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Chain progress</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">3 transactions</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">62%</p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[62%] rounded-full bg-primary" />
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      ["18 Meadow View", "Searches returned", "clear"],
                      ["42 Oakfield Road", "Mortgage offer due", "watch"],
                      ["7 The Crescent", "Enquiries in progress", "clear"],
                    ].map(([address, status, tone], index) => (
                      <div key={address} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-mono text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{address}</p>
                          <p className="text-xs text-slate-500">{status}</p>
                        </div>
                        {tone === "watch" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-amber-900">
                      <Clock3 className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Needs attention</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-amber-950">Mortgage offer due in 2 days</p>
                    <p className="mt-1 text-xs leading-5 text-amber-900/70">Assigned to buyer&apos;s broker</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</p>
                    <div className="mt-3 space-y-3 text-sm">
                      <span className="flex items-center justify-between"><span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Documents</span><strong>12</strong></span>
                      <span className="flex items-center justify-between"><span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Updates</span><strong>8</strong></span>
                      <span className="flex items-center justify-between"><span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Participants</span><strong>9</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4">
                <div className="grid grid-cols-5 gap-1">
                  {stages.map((stage, index) => (
                    <div key={stage.label} className="relative text-center">
                      {index > 0 && <span className="absolute right-1/2 top-2 h-px w-full bg-slate-200" />}
                      <span className={`relative mx-auto block h-4 w-4 rounded-full border-4 border-white ${stage.state === "done" ? "bg-emerald-500" : stage.state === "active" ? "bg-primary ring-2 ring-primary/20" : "bg-slate-300"}`} />
                      <p className="mt-2 hidden text-[10px] font-medium text-slate-500 sm:block">{stage.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white">
        <div className="container grid gap-8 py-8 text-center sm:grid-cols-3 sm:divide-x sm:divide-border">
          <div><strong className="font-display text-3xl text-foreground">1 workspace</strong><p className="mt-1 text-sm text-muted-foreground">for the entire chain</p></div>
          <div><strong className="font-display text-3xl text-foreground">Live status</strong><p className="mt-1 text-sm text-muted-foreground">without phone-tag</p></div>
          <div><strong className="font-display text-3xl text-foreground">Zero cost</strong><p className="mt-1 text-sm text-muted-foreground">for buyers and sellers</p></div>
        </div>
      </section>

      <section id="platform" className="container py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Badge variant="outline" className="rounded-full">One platform, three ways in</Badge>
            <h2 className="mt-5 max-w-lg font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Useful before the whole industry adopts it.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
              Every ChainLink workflow is designed around a simple reality: you
              cannot force every party in a transaction to buy the same software.
            </p>
          </div>
          <div className="space-y-4">
            {modes.map((mode, index) => {
              const Icon = mode.icon;
              return (
                <article key={mode.title} className="group grid gap-5 rounded-2xl border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-900/5 sm:grid-cols-[auto_1fr]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary"><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="flex items-center gap-3"><span className="font-mono text-xs text-primary">0{index + 1}</span><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{mode.eyebrow}</span></div>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">{mode.title}</h3>
                    <p className="mt-2 max-w-xl leading-7 text-muted-foreground">{mode.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="security" className="bg-[#102f34] text-white">
        <div className="container grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge className="rounded-full border-white/15 bg-white/10 text-white hover:bg-white/10">Professional-grade control</Badge>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Shared progress without oversharing.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">Keep the transaction transparent while protecting firm-only notes, assignments and sensitive documents with role-based visibility.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [ShieldCheck, "Role-based access", "Each participant sees only the chains and information they are entitled to."],
              [Lock, "Internal stays internal", "Firm notes and operational tasks never leak into the shared workspace."],
              [BarChart3, "Portfolio oversight", "Surface risk and workload across every connected transaction."],
              [FileText, "Auditable activity", "Maintain a reliable record of actions, updates and document access."],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof ShieldCheck;
              return <article key={title as string} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><FeatureIcon className="h-5 w-5 text-teal-300" /><h3 className="mt-4 font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-white/60">{copy as string}</p></article>;
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="container py-20 sm:py-28">
        <div className="overflow-hidden rounded-[2rem] bg-accent px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Bring clarity to your next completion</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Stop chasing updates. Start orchestrating the chain.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Create a workspace in minutes, run it yourself, and invite every party when you are ready.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-7"><Link href="/signup">Get started free <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full bg-white px-7"><Link href="/login">Log in to your workspace</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
