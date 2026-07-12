import Link from "next/link";
import { ArrowLeft, Check, CreditCard, ShieldCheck, Sparkles } from "lucide-react";

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
  const status = STATUS_LABELS[billing.subscriptionStatus] ?? { label: billing.subscriptionStatus, variant: "secondary" as const };
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

      <section className="mb-6 overflow-hidden rounded-3xl border border-indigo-900/30 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-7 text-white shadow-xl shadow-indigo-950/10 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              <Sparkles className="h-4 w-4" /> Commercial workspace
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {currentPlan.name} gives your firm shared operational visibility
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Professional plans fund cross-chain oversight, team and branch reporting. Buyers, sellers and single-chain guests remain free.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> No payment processor active
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 shadow-sm lg:col-span-1">
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

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900">
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
              <Card
                key={planId}
                className={`rounded-2xl shadow-sm ${
                  isCurrent ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {isCurrent && (
                      <Badge variant="accent" className="text-[10px]">
                        <CreditCard className="mr-1 h-3 w-3" /> Current plan
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
