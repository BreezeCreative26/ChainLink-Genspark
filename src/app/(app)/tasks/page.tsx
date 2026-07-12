import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarClock, CheckCircle2, Link2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getWorkQueue } from "@/server/services/portfolio";
import { getWorkspaceContext } from "@/server/services/workspace";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { branch?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceContext(supabase, user.id);
  if (!workspace.showCrossChainTools) redirect("/chains");

  const { items } = await getWorkQueue(supabase, searchParams.branch);
  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = items.filter((item) => item.due_date && item.due_date < today).length;
  const dueSoonCount = items.filter((item) => item.due_date && item.due_date >= today).length;

  return (
    <div>
      <PageHeader
        title="Work queue"
        description="Authorised tasks and milestones across your current portfolio. Open the chain workspace to update the source record."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <QueueSummary label="Open items" value={items.length} icon={CheckCircle2} />
        <QueueSummary label="Overdue" value={overdueCount} icon={AlertTriangle} danger={overdueCount > 0} />
        <QueueSummary label="Dated ahead" value={dueSoonCount} icon={CalendarClock} />
      </div>

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary"><CheckCircle2 className="h-5 w-5" /></span>
              <p className="font-semibold text-foreground">Your queue is clear</p>
              <p className="max-w-md text-sm text-muted-foreground">Open tasks and incomplete milestones will appear here when they are visible to your firm or assigned chain.</p>
            </div>
          ) : (
            <ul>
              {items.map((item) => {
                const overdue = Boolean(item.due_date && item.due_date < today);
                return (
                  <li key={`${item.kind}-${item.id}`} className="border-b border-border last:border-0">
                    <Link href={`/chains/${item.chain_id}`} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={item.kind === "task" ? "accent" : "outline"} className="rounded-full text-[10px]">{item.kind}</Badge>
                          <Badge variant={item.visibility === "internal" ? "secondary" : "outline"} className="rounded-full text-[10px]">{item.visibility === "internal" ? "Firm only" : "Shared"}</Badge>
                          {overdue && <span className="text-xs font-semibold text-destructive">Overdue</span>}
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold text-foreground group-hover:text-primary">{item.title}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span className="font-mono text-primary">{item.chainRef}</span>
                          {item.address && <span>{item.address}</span>}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className={overdue ? "text-xs font-semibold text-destructive" : "text-xs text-muted-foreground"}>
                          {item.due_date ? new Date(item.due_date).toLocaleDateString("en-GB") : "No due date"}
                        </span>
                        <Link2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QueueSummary({ label, value, icon: Icon, danger = false }: { label: string; value: number; icon: typeof CheckCircle2; danger?: boolean }) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="flex items-center justify-between p-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>{value}</p></div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${danger ? "bg-red-50 text-destructive" : "bg-accent text-primary"}`}><Icon className="h-4 w-4" /></span>
      </CardContent>
    </Card>
  );
}
