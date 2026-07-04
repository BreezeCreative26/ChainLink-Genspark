import { Link2, AlertTriangle, Milestone, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SUMMARY_CARDS = [
  { label: "Active chains", value: "—", icon: Link2 },
  { label: "At risk", value: "—", icon: AlertTriangle },
  { label: "Upcoming milestones", value: "—", icon: Milestone },
  { label: "Completed this month", value: "—", icon: CheckCircle2 },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Workload, risk, and milestones across your firm's chains."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Team activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Activity feed will appear here once chains are connected.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
