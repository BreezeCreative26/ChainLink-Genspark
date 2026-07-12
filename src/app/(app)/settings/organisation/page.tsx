import { redirect } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { listTeam } from "@/server/services/organisations";
import { TeamPanel } from "@/app/(app)/settings/organisation/team-panel";

export default async function OrganisationSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("organisation_id, role, organisations ( name )")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/settings/organisation/new");
  }

  const org = Array.isArray(membership.organisations)
    ? membership.organisations[0]
    : membership.organisations;
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const members = await listTeam(supabase, membership.organisation_id);
  const memberRows = members.map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.id,
      role: m.role,
      status: m.status,
      name: profile?.full_name ?? profile?.email ?? "Unknown",
    };
  });

  return (
    <div>
      <PageHeader title="Team" description={`Manage who's part of ${org?.name ?? "your firm"}.`} />
      <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-slate-950 p-3 text-white">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">Role-based firm access</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Team roles control business navigation and administration. Chain editing still requires a direct participant record and remains enforced by row-level security.
            </p>
          </div>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          <ShieldCheck className="h-4 w-4" /> {isAdmin ? "Admin controls enabled" : "Read-only team view"}
        </div>
      </section>
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamPanel
            organisationId={membership.organisation_id}
            isAdmin={isAdmin}
            members={memberRows}
          />
        </CardContent>
      </Card>
    </div>
  );
}
