import { redirect } from "next/navigation";

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
      <Card>
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
