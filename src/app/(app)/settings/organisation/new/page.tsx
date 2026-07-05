import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { NewOrganisationForm } from "@/app/(app)/settings/organisation/new/new-organisation-form";

export default async function NewOrganisationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase
      .from("memberships")
      .select("id")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (existing) {
      redirect("/settings");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Create your firm"
        description="Sets you up as the owner of a new business workspace."
      />
      <Card>
        <CardContent className="pt-6">
          <NewOrganisationForm />
        </CardContent>
      </Card>
    </div>
  );
}
