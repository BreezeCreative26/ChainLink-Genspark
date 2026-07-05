import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getBillingOverviewForCurrentUser } from "@/server/services/billing";
import { PLANS, PLAN_ORDER } from "@/config/plans";
import type { UsageCount } from "@/types/billing";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "success" },
  trialing: { label: "Trial", variant: "secondary" },
  past_due: { label: "Payment overdue", variant: "destructive" },
  canceled: { label: "Canceled", variant: "destructive" },
};

function UsageBar({ label, usage }: { label: string; usage: UsageCount }) {
  const isUnlimited = usage.limit === null;
  const isOver = !isUnlimited && usage.used > (usage.limit as number);
  const pct = isUnlimited ? 0 : Math.min(100, (usage.used / Math.max(usage.limit as number, 1)) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className={isOver ? "font-medium text-destructive" : "text-muted-foreground"}>
          {usage.used} {isUnlimited ? "" : `/ ${usage.limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full ${isOver ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isOver && (
        <p className="mt-1 text-xs text-destructive">
          Over plan limit — consider upgrading.
        </p>
      )}
    </div>
  );
}

export default async function BillingSettingsPage() {
  const supabase = createClient();
  const overview = await getBillingOverviewForCurrentUser(supabase);

  if (!overview) {
    return (
      <div>
        <PageHeader title="Billing" description="No firm connected." />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Billing applies to business workspaces. You&apos;re not currently
            connected to a firm — see{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>{" "}
            for more.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { billing, usage } = overview;
  const currentPlan = PLANS[billing.plan];
  const status = STATUS_LABELS[billing.subscriptionStatus];
  const isAdmin = billing.viewerRole === "owner" || billing.viewerRole === "admin";

  return (
    <div>
      <PageHeader
        title="Billing"
        description={`${billing.organisationName}'s plan and usage.`}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" /> Back to settings
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentPlan.name}</CardTitle>
              <Badge variant={status.variant} className="text-[10px]">
                {status.label}
              </Badge>
            </div>
            <CardDescription>{currentPlan.priceDisplay}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <UsageBar label="Team members" usage={usage.seats} />
              <UsageBar label="Branches" usage={usage.branches} />
              <UsageBar label="Active chains" usage={usage.activeChains} />
            </div>

            {billing.trialEndsAt && (
              <p className="text-xs text-muted-foreground">
                Trial ends {new Date(billing.trialEndsAt).toLocaleDateString("en-GB")}.
              </p>
            )}

            <div className="rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
              Billing isn&apos;t connected to a payment processor yet — this
              is a preview of the plan structure ahead of Stripe
              integration (see docs/ROADMAP.md, Phase 4). No card is on
              file and nothing here will charge you.
            </div>

            {isAdmin && (
              <Button variant="outline" size="sm" className="w-full" disabled>
                Manage payment method (coming soon)
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = planId === billing.plan;
            return (
              <Card key={planId} className={isCurrent ? "border-primary" : undefined}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {isCurrent && (
                      <Badge variant="accent" className="text-[10px]">
                        Current plan
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{plan.priceDisplay}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                  <ul className="space-y-1.5">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-1.5 text-xs text-foreground">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  {isAdmin && !isCurrent && (
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      {planId === "enterprise" ? "Contact sales" : "Upgrade (coming soon)"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
