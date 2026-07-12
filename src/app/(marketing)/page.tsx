import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Gavel,
  GitBranch,
  Home,
  Link2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, PLAN_ORDER } from "@/config/plans";

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
    description: "Track every link yourself when counterparties are still on email and phone. ChainLink delivers value before anyone else adopts it.",
  },
  {
    icon: UserPlus,
    eyebrow: "Invite without friction",
    title: "Bring buyers and sellers in free",
    description: "Participants get a focused view of only their authorised chain, with shared milestones, requests, documents, and updates in one place.",
  },
  {
    icon: Building2,
    eyebrow: "Connect the operation",
    title: "Give firms portfolio control",
    description: "Connected agents and conveyancers see authorised chains across their firm or branch, while the chain remains independent and canonical.",
  },
];

const audiences = [
  {
    icon: Home,
    title: "Estate agents",
    copy: "Protect the pipeline with a sales progression view of stalled chains, overdue actions, outstanding invitations, and likely completions.",
    points: ["Whole-chain dependencies", "Branch-scoped pipeline", "Proxy updates for offline parties"],
  },
  {
    icon: Gavel,
    title: "Conveyancers",
    copy: "Prioritise legal progression using shared milestones and a secure index of the documents and actions visible to your practice.",
    points: ["Legal milestone workload", "Firm-only working notes", "Auditable document access"],
  },
  {
    icon: Users,
    title: "Buyers and sellers",
    copy: "See what is happening without learning a business system. Respond to approved requests and follow shared progress from one calm workspace.",
    points: ["Always free to participate", "One-chain focus", "No business data exposure"],
  },
];

export default function MarketingHomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-[#f4f8f7]">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="absolute left-[15%] top-12 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl" />
        <div className="container relative grid gap-14 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge variant="accent" className="rounded-full px-3 py-1 text-xs"><Sparkles className="mr-1 h-3 w-3" /> Built for UK property chains</Badge>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Shared truth · controlled access</span>
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">
              Turn a fragile chain into a coordinated completion.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              ChainLink gives agents, conveyancers, buyers, and sellers one live transaction workspace — plus the portfolio oversight professional firms need to keep every link moving.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-6 shadow-lg shadow-primary/15"><Link href="/signup">Create your workspace <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full bg-white/80 px-6"><Link href="#how-it-works">See how it works</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No card required", "Buyers and sellers join free", "Works before universal adoption"].map((text) => <span key={text} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {text}</span>)}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="border-b border-border bg-white">
        <div className="container grid gap-8 py-8 text-center sm:grid-cols-3 sm:divide-x sm:divide-border">
          <Metric value="One Chain ID" label="for every linked transaction" />
          <Metric value="Three access modes" label="proxy, guest, and connected" />
          <Metric value="Two visibility tiers" label="shared progress and firm-only work" />
        </div>
      </section>

      <section id="how-it-works" className="container py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Badge variant="outline" className="rounded-full">One platform, three ways in</Badge>
            <h2 className="mt-5 max-w-lg font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">Useful before the whole industry adopts it.</h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">Every workflow is designed around the reality that independent parties cannot be forced onto the same paid software.</p>
          </div>
          <div className="space-y-4">
            {modes.map((mode, index) => {
              const Icon = mode.icon;
              return (
                <article key={mode.title} className="group grid gap-5 rounded-3xl border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-900/5 sm:grid-cols-[auto_1fr]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary"><Icon className="h-5 w-5" /></div>
                  <div><div className="flex items-center gap-3"><span className="font-mono text-xs text-primary">0{index + 1}</span><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{mode.eyebrow}</span></div><h3 className="mt-2 text-xl font-semibold text-foreground">{mode.title}</h3><p className="mt-2 max-w-xl leading-7 text-muted-foreground">{mode.description}</p></div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="for-everyone" className="border-y border-border bg-slate-50/80">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">A focused view for every role</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">The same chain. The right context.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Business dashboards aggregate authorised work; participant views stay intentionally narrow. Nobody gets broader access just because the UI changes.</p></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              return <article key={audience.title} className="rounded-3xl border border-border bg-white p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-xl font-semibold">{audience.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{audience.copy}</p><ul className="mt-5 space-y-2">{audience.points.map((point) => <li key={point} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-600" /> {point}</li>)}</ul></article>;
            })}
          </div>
        </div>
      </section>

      <section id="security" className="bg-[#102f34] text-white">
        <div className="container grid gap-12 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-24">
          <div><Badge className="rounded-full border-white/15 bg-white/10 text-white hover:bg-white/10">Security follows the data model</Badge><h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Shared progress without accidental oversharing.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-white/65">ChainLink treats participant access, firm membership, and shared versus internal visibility as separate permission decisions. Supabase Row Level Security is the primary boundary; application services add a second check.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [ShieldCheck, "Participant-scoped access", "A buyer, seller, or guest sees only chains they have actively joined."],
              [Lock, "Internal stays internal", "Firm-only notes, tasks, and documents remain scoped to the owning organisation."],
              [Building2, "Read-only firm oversight", "Portfolio visibility does not silently grant edit rights on a colleague's chain."],
              [FileCheck2, "Auditable file access", "Document links are generated on demand and the actual open action is logged."],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof ShieldCheck;
              return <article key={title as string} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><FeatureIcon className="h-5 w-5 text-teal-300" /><h3 className="mt-4 font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-white/60">{copy as string}</p></article>;
            })}
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="container pb-20 sm:pb-28">
        <div className="overflow-hidden rounded-[2rem] bg-accent px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Bring clarity to your next completion</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Stop chasing updates. Start orchestrating the chain.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Create a workspace in minutes, run it yourself, and invite each party when the transaction is ready.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 rounded-full px-7"><Link href="/signup">Get started <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" size="lg" className="h-12 rounded-full bg-white px-7"><Link href="/login">Log in to your workspace</Link></Button></div>
        </div>
      </section>
    </>
  );
}

function ProductPreview() {
  return (
    <div id="product-preview" className="relative lg:pl-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_80px_-25px_rgba(15,45,51,0.28)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white"><Link2 className="h-5 w-5" /></div><div><p className="font-mono text-xs font-semibold text-primary">CHAIN-482917</p><p className="text-sm font-semibold text-slate-900">Oakfield Road chain</p></div></div><Badge variant="success" className="rounded-full">On track</Badge></div>
        <div className="grid gap-5 p-5 sm:grid-cols-[1.45fr_0.8fr]">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="flex items-end justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Chain progress</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">3 transactions</p></div><p className="text-sm font-semibold text-primary">62%</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[62%] rounded-full bg-primary" /></div><div className="mt-6 space-y-3">{[["18 Meadow View", "Searches returned", "clear"], ["42 Oakfield Road", "Mortgage offer due", "watch"], ["7 The Crescent", "Enquiries in progress", "clear"]].map(([address, status, tone], index) => <div key={address} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-mono text-xs font-semibold text-primary">{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{address}</p><p className="text-xs text-slate-500">{status}</p></div>{tone === "watch" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</div>)}</div></div>
          <div className="space-y-3"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-900"><Clock3 className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">Needs attention</span></div><p className="mt-2 text-sm font-semibold text-amber-950">Mortgage offer due in 2 days</p><p className="mt-1 text-xs leading-5 text-amber-900/70">Assigned to buyer&apos;s broker</p></div><div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</p><div className="mt-3 space-y-3 text-sm"><PreviewCount icon={FileText} label="Documents" value="12" /><PreviewCount icon={MessageSquare} label="Updates" value="8" /><PreviewCount icon={Users} label="Participants" value="9" /></div></div></div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4"><div className="grid grid-cols-5 gap-1">{stages.map((stage, index) => <div key={stage.label} className="relative text-center">{index > 0 && <span className="absolute right-1/2 top-2 h-px w-full bg-slate-200" />}<span className={`relative mx-auto block h-4 w-4 rounded-full border-4 border-white ${stage.state === "done" ? "bg-emerald-500" : stage.state === "active" ? "bg-primary ring-2 ring-primary/20" : "bg-slate-300"}`} /><p className="mt-2 hidden text-[10px] font-medium text-slate-500 sm:block">{stage.label}</p></div>)}</div></div>
      </div>
    </div>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="container py-20 sm:py-28">
      <div className="mx-auto max-w-3xl text-center"><Badge variant="outline" className="rounded-full">Commercial model</Badge><h2 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Participants collaborate free. Firms pay for portfolio control.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Pricing is based on the professional workspace — seats, branches, and active chains — never on charging the buyer or seller to access their transaction.</p></div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const featured = planId === "growth";
          return <article key={plan.id} className={`relative flex flex-col rounded-3xl border bg-white p-6 ${featured ? "border-primary shadow-xl shadow-primary/10" : "border-border shadow-sm"}`}>{featured && <Badge className="absolute -top-3 left-6 rounded-full">Most practical starting point</Badge>}<h3 className="text-lg font-semibold">{plan.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p><p className="mt-6 font-display text-3xl font-semibold tracking-tight">{plan.priceDisplay}</p><div className="mt-6 h-px bg-border" /><ul className="mt-6 flex-1 space-y-3">{plan.highlights.map((highlight) => <li key={highlight} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {highlight}</li>)}</ul><Button asChild variant={featured ? "default" : "outline"} className="mt-7 rounded-full"><Link href="/signup">{planId === "enterprise" ? "Start a conversation" : "Start without a card"}</Link></Button></article>;
        })}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-3 text-xs leading-5 text-muted-foreground"><GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p><strong className="text-foreground">Launch planning note:</strong> these plan prices and limits are the current indicative product structure. Payment processing is not active yet, so no card is taken and no customer is charged. Final commercial terms remain subject to review before paid launch.</p></div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div><strong className="font-display text-2xl text-foreground sm:text-3xl">{value}</strong><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>; }
function PreviewCount({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) { return <span className="flex items-center justify-between"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {label}</span><strong>{value}</strong></span>; }
