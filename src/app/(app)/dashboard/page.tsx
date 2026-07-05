import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  Link2,
  AlertTriangle,
  Mail,
  ListChecks,
  CalendarCheck2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { currentUserHasProfessionalStanding } from "@/server/services/chains";
import { getDashboardData } from "@/server/services/dashboard";
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

  // Belt-and-braces: the sidebar already hides this link for pure guests,
  // but the route itself must not be reachable just by typing the URL.
  const hasProfessionalStanding = await currentUserHasProfessionalStanding(supabase);
  if (!hasProfessionalStanding) {
    redirect("/chains");
  }

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

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          scope.mode === "firm"
            ? `Workload, risk, and milestones across ${scope.organisationName}'s chains.`
            : "Your solo caseload — connect a firm to see your whole team's chains here."
        }
        actions={
          scope.mode === "firm" &&
          (scope.viewerRole === "owner" || scope.viewerRole === "admin") &&
          scope.branchViewsEnabled &&
          scope.branches.length > 0 ? (
            <BranchIndicator branchCount={scope.branches.length} />
          ) : undefined
        }
      />

      {scope.mode === "firm" && scope.branches.length > 0 && !scope.branchViewsEnabled && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
          <span>Branch-level dashboard views are available on the Growth plan and above.</span>
          <Link href="/settings/billing" className="shrink-0 font-medium text-primary hover:underline">
            View plans
          </Link>
        </div>
      )}

      {/* Summary widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          label="Active chains"
          value={data.activeChainsCount}
          icon={Link2}
        />
        <SummaryCard
          label="At risk"
          value={data.atRiskChains.length}
          icon={AlertTriangle}
          tone={data.atRiskChains.length > 0 ? "destructive" : undefined}
        />
        <SummaryCard label="Pending invites" value={data.pendingInvites.length} icon={Mail} />
        <SummaryCard
          label="Overdue actions"
          value={data.overdueActions.length}
          icon={ListChecks}
          tone={data.overdueActions.length > 0 ? "destructive" : undefined}
        />
        <SummaryCard
          label="Upcoming completions"
          value={data.upcomingCompletions.length}
          icon={CalendarCheck2}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Chains table with filters */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense>
              <FilterBar branches={scope.branchViewsEnabled ? scope.branches : []} />
            </Suspense>
            <ChainsTable chains={data.chains} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      <p className="text-foreground">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{entry.chainRef}</span> ·{" "}
                        {new Date(entry.createdAt).toLocaleString("en-GB")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Pending invites */}
          <Card>
            <CardHeader>
              <CardTitle>Pending invites</CardTitle>
            </CardHeader>
            <CardContent>
              {data.pendingInvites.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing pending.</p>
              ) : (
                <ul className="space-y-2">
                  {data.pendingInvites.slice(0, 6).map((invite) => (
                    <li key={invite.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{invite.email}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {invite.chainRef}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {invite.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Overdue actions */}
          <Card>
            <CardHeader>
              <CardTitle>Overdue actions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.overdueActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing overdue.</p>
              ) : (
                <ul className="space-y-2">
                  {data.overdueActions.slice(0, 6).map((action) => (
                    <li key={`${action.kind}-${action.id}`} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{action.title}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {action.chainRef}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-destructive">
                        Due {new Date(action.dueDate).toLocaleDateString("en-GB")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Upcoming completions */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming completions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.upcomingCompletions.length === 0 ? (
                <p className="text-sm text-muted-foreground">None scheduled.</p>
              ) : (
                <ul className="space-y-2">
                  {data.upcomingCompletions.map((c) => (
                    <li key={c.chainId} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">
                          {c.addressLine1 ?? c.chainRef}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{c.chainRef}</p>
                      </div>
                      {c.dueDate && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(c.dueDate).toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
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
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon
          className={`h-4 w-4 ${tone === "destructive" ? "text-destructive" : "text-muted-foreground"}`}
          strokeWidth={1.75}
        />
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-semibold ${tone === "destructive" && value > 0 ? "text-destructive" : "text-foreground"}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function BranchIndicator({ branchCount }: { branchCount: number }) {
  return (
    <Badge variant="outline" className="text-xs">
      {branchCount} {branchCount === 1 ? "branch" : "branches"} — filter below
    </Badge>
  );
}
