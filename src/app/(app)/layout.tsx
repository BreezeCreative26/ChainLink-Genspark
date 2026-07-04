import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { currentUserHasProfessionalStanding } from "@/server/services/chains";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, hasProfessionalStanding] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
    currentUserHasProfessionalStanding(supabase),
  ]);

  return (
    <AppShell profile={profile} showDashboard={hasProfessionalStanding}>
      {children}
    </AppShell>
  );
}
