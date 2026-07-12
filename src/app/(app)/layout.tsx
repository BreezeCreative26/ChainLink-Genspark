import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadCountForCurrentUser } from "@/server/services/notifications";
import { getWorkspaceContext } from "@/server/services/workspace";

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

  const [{ data: profile }, workspace, unreadCount] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
    getWorkspaceContext(supabase, user.id),
    getUnreadCountForCurrentUser(supabase),
  ]);

  return (
    <AppShell profile={profile} workspace={workspace} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
