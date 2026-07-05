import Link from "next/link";
import { CreditCard, Users, Building2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/config/plans";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let membership: { organisation_id: string; role: string; organisations: { name: string; plan: string } | { name: string; plan: string }[] | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from("memberships")
      .select("organisation_id, role, organisations ( name, plan )")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    membership = data;
  }

  const org = membership
    ? Array.isArray(membership.organisations)
      ? membership.organisations[0]
      : membership.organisations
    : null;

  const isAdmin = membership?.role === "owner" || membership?.role === "admin";

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your account, and — if connected — your firm's settings."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Signed in as {user?.email}.</p>
            <Separator />
            <p>Profile editing (name, password) isn&apos;t built yet — foundation stage only.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {org ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {PLANS[org.plan as keyof typeof PLANS]?.name ?? org.plan} plan
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/settings/organisation">
                        <Users className="h-4 w-4" /> Team
                      </Link>
                    </Button>
                    {isAdmin ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/settings/billing">
                          <CreditCard className="h-4 w-4" /> Billing
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/settings/billing">View plan</Link>
                      </Button>
                    )}
                  </div>
                </div>
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Ask your firm admin to make changes to billing.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You&apos;re not connected to a firm yet.
                </p>
                <Button asChild size="sm">
                  <Link href="/settings/organisation/new">
                    <Building2 className="h-4 w-4" /> Create your firm
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
