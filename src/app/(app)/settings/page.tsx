import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/config/plans";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/server/services/workspace";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const workspace = await getWorkspaceContext(supabase, user.id);
  const { data: organisation } = workspace.organisationId
    ? await supabase
        .from("organisations")
        .select("plan")
        .eq("id", workspace.organisationId)
        .maybeSingle()
    : { data: null };
  const plan = organisation
    ? PLANS[organisation.plan as keyof typeof PLANS]
    : null;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your identity, workspace access, team and plan from one place."
      />

      <section className="mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-950/10 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <ShieldCheck className="h-4 w-4" /> Secure workspace context
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {workspace.organisationName ?? "Your ChainLink account"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {workspace.mode === "firm"
                ? `You are signed in as ${workspace.roleLabel}. Your navigation and data access follow your active firm membership and Supabase row-level security.`
                : "Your access is limited to chains where you are an active participant. Business-wide data is never inferred from profile metadata."}
            </p>
          </div>
          <Badge className="w-fit border-white/15 bg-white/10 text-white" variant="outline">
            {workspace.roleLabel}
          </Badge>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white p-2.5 text-slate-700 shadow-sm">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Account</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Personal identity and alerts</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            <SettingsRow
              icon={UserRound}
              title="Signed-in identity"
              description={user.email ?? "Authenticated account"}
            />
            <SettingsRow
              icon={Bell}
              title="Notifications"
              description="Review chain updates and invitations"
              href="/notifications"
            />
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-muted-foreground">
              Name and password editing will be added through Supabase Auth account controls. Access rights are not editable from profile metadata.
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white p-2.5 text-slate-700 shadow-sm">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Business workspace</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Team, branches and commercial plan</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            {workspace.organisationId ? (
              <>
                <div className="flex items-center justify-between rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {workspace.organisationName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {plan?.name ?? "Business"} plan
                      {workspace.branchName ? ` · ${workspace.branchName}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <SettingsRow
                  icon={Users}
                  title="Team and roles"
                  description={
                    workspace.canManageOrganisation
                      ? "Manage active members and workspace roles"
                      : "View the colleagues connected to this workspace"
                  }
                  href="/settings/organisation"
                />
                <SettingsRow
                  icon={CreditCard}
                  title={workspace.canManageBilling ? "Plan and usage" : "Current plan"}
                  description={
                    workspace.canManageBilling
                      ? "Review limits and the planned pricing structure"
                      : "View plan limits; only owners and admins can make changes"
                  }
                  href="/settings/billing"
                />
              </>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-foreground">No firm connected</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Buyers, sellers and single-chain guests stay free. Professional users can create a firm workspace for team and cross-chain oversight.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/settings/organisation/new">
                    <Building2 className="h-4 w-4" /> Create your firm
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      {href && <ChevronRight className="h-4 w-4 text-slate-400" />}
    </>
  );

  return href ? (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-50"
    >
      {content}
    </Link>
  ) : (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3">{content}</div>
  );
}
