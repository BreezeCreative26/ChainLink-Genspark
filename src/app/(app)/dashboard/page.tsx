import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  Link2,
  ListChecks,
  Mail,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/server/services/dashboard";
import { getWorkspaceContext } from "@/server/services/workspace";
import { FilterBar } from "@/app/(app)/dashboard/filter-bar";
import { ChainsTable } from "@/app/(app)/dashboard/chains-table";
import type { ChainRow } from "@/types/dashboard";

const ACTION_LABELS: Record<string, string> = {
  "chain.created": "Chain created",
  "invitation.sent": "Invitation sent",
  "invitation.accepted": "Invitation accepted",
  "invitation.linked": "Invitation linked to a firm",
  "invitation.declined": "Invitation declined",
  "milestone.confirmed": "Milestone confirmed",
  "document.uploaded": "Document uploaded",
  "comment.added": "Comment added",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string; risk?: string; branch?: string; search?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceContext(supabase, user.id);
  if (!workspace.canViewBusinessDashboard) redirect("/chains");

  const data = await getDashboardData(
    supabase,
    {
      status: searchParams.status as ChainRow["status"] | undefined,
      riskOnly: searchParams.risk === "1",
      search: searchParams.search,
    },
    searchParams.branch
  );

  const { scope } = data;
  const presentation = dashboardPresentation(scope.viewerRole, scope.mode);
  const isAdmin = scope.viewerRole === "owner" || scope.viewerRole === "admin";

  return (
    <div>
      <section className="mb-6 overflow-hidden rounded-3xl bg-[#102f34] px-6 py-6 text-white shadow-[0_18px_55px_-35px_rgba(16,47,52,0.9)] sm:px-8 sm:py-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-teal-200">
              <ShieldCheck className="h-4 w-4" /> {presentation.eyebrow}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {presentation.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              {scope.mode === "firm"
                ? `${presentation.description} Live across ${scope.organisationName}.`
                : "Your independent chain progression view. Add a firm workspace whenever you need team and branch oversight."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button asChild variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                <Link href="/settings/organisation">
                  <Users className="h-4 w-4" /> Manage team
                </Link>
              </Button>
            )}
            <Button asChild className="bg-teal-300 text-slate-950 hover:bg-teal-200">
              <Link href="/chains/new">
                <Plus className="h-4 w-4" /> New chain
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PageHeader
        title="Live portfolio"
        description={presentation.focus}
        actions={
          scope.mode === "firm" && isAdmin && scope.branchViewsEnabled && scope.branches.length > 0 ? (
            <BranchIndicator branchCount={scope.branches.length} />
          ) : undefined
        }
        className="mb-4"
      />

      {scope.mode === "firm" && scope.branches.length > 0 && !scope.branchViewsEnabled && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-white px-4 py-3 text-xs text-muted-foreground">
          <span>Branch-level portfolio views are available on Growth and above.</span>
          <Link href="/settings/billing" className="shrink-0 font-semibold text-primary hover:underline">
            Compare plans
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Active chains" value={data.activeChainsCount} icon={Link2} />
        <SummaryCard label="At risk" value={data.atRiskChains.length} icon={AlertTriangle} tone={data.atRiskChains.length > 0 ? "destructive" : undefined} />
        <SummaryCard label="Pending invites" value={data.pendingInvites.length} icon={Mail} />
        <SummaryCard label="Overdue actions" value={data.overdueActions.length} icon={ListChecks} tone={data.overdueActions.length > 0 ? "destructive" : undefined} />
        <SummaryCard label="Upcoming completions" value={data.upcomingCompletions.length} icon={CalendarCheck2} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Chain portfolio</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Open any chain to work in its canonical shared workspace.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/chains">View all <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense>
              <FilterBar branches={scope.branchViewsEnabled ? scope.branches : []} />
            </Suspense>
            <ChainsTable chains={data.chains} />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <DashboardListCard title="Recent activity" empty="No activity yet.">
            {data.recentActivity.map((entry) => (
              <li key={entry.id} className="border-b border-border/70 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-foreground">{ACTION_LABELS[entry.action] ?? entry.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Link href={`/chains/${entry.chainId}`} className="font-mono text-primary hover:underline">{entry.chainRef}</Link>
                  {" · "}{new Date(entry.createdAt).toLocaleString("en-GB")}
                </p>
              </li>
            ))}
          </DashboardListCard>

          <DashboardListCard title="Pending invites" empty="Nothing pending.">
            {data.pendingInvites.slice(0, 6).map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-2 border-b border-border/70 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{invite.email}</p>
                  <Link href={`/chains/${invite.chainId}`} className="font-mono text-xs text-primary hover:underline">{invite.chainRef}</Link>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px]">{invite.status}</Badge>
              </li>
            ))}
          </DashboardListCard>

          <DashboardListCard title="Overdue actions" empty="Nothing overdue.">
            {data.overdueActions.slice(0, 6).map((action) => (
              <li key={`${action.kind}-${action.id}`} className="flex items-center justify-between gap-2 border-b border-border/70 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{action.title}</p>
                  <Link href={`/chains/${action.chainId}`} className="font-mono text-xs text-primary hover:underline">{action.chainRef}</Link>
                </div>
                <span className="shrink-0 text-xs font-medium text-destructive">
                  {new Date(action.dueDate).toLocaleDateString("en-GB")}
                </span>
              </li>
            ))}
          </DashboardListCard>

          <DashboardListCard title="Upcoming completions" empty="None scheduled.">
            {data.upcomingCompletions.map((completion) => (
              <li key={completion.chainId} className="flex items-center justify-between gap-2 border-b border-border/70 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{completion.addressLine1 ?? completion.chainRef}</p>
                  <Link href={`/chains/${completion.chainId}`} className="font-mono text-xs text-primary hover:underline">{completion.chainRef}</Link>
                </div>
                {completion.dueDate && <span className="shrink-0 text-xs text-muted-foreground">{new Date(completion.dueDate).toLocaleDateString("en-GB")}</span>}
              </li>
            ))}
          </DashboardListCard>
        </div>
      </div>
    </div>
  );
}

function DashboardListCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {children.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <ul className="space-y-3">{children}</ul>}
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Link2;
  tone?: "destructive";
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone === "destructive" ? "bg-red-50 text-destructive" : "bg-accent text-primary"}`}>
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold tracking-tight ${tone === "destructive" && value > 0 ? "text-destructive" : "text-foreground"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function dashboardPresentation(
  role: "owner" | "admin" | "agent" | "conveyancer" | "staff" | null,
  mode: "firm" | "solo"
) {
  if (mode === "solo") return { eyebrow: "Independent workspace", title: "Keep every link moving", description: "Track the full chain even when counterparties have not joined", focus: "Risk, actions, and upcoming completions across the chains you manage." };
  if (role === "owner" || role === "admin") return { eyebrow: "Firm control centre", title: "See the operation, not just the cases", description: "Monitor workload, risk, branch coverage, and team activity", focus: "A management view across every chain your firm is connected to." };
  if (role === "conveyancer") return { eyebrow: "Legal progression", title: "Prioritise the matters that need legal action", description: "Bring overdue milestones, documents, and completion dates into one view", focus: "Your branch-scoped legal workload, ordered around risk and deadlines." };
  if (role === "agent") return { eyebrow: "Sales progression", title: "Protect the pipeline from avoidable delays", description: "See every dependency, outstanding action, and completion signal", focus: "Your branch-scoped sales pipeline with the whole chain in context." };
  return { eyebrow: "Progression workspace", title: "Work the right actions in the right order", description: "Coordinate milestones, invitations, and completion activity", focus: "Your authorised caseload and the next actions across it." };
}

function BranchIndicator({ branchCount }: { branchCount: number }) {
  return <Badge variant="outline" className="rounded-full text-xs">{branchCount} {branchCount === 1 ? "branch" : "branches"} · filter below</Badge>;
}
