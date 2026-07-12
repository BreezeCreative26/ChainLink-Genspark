import { BellRing, CheckCheck, Inbox } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getNotificationsForCurrentUser } from "@/server/services/notifications";
import { markAllNotificationsReadAction } from "@/app/(app)/notifications/actions";
import { NotificationItem } from "@/app/(app)/notifications/notification-item";

export default async function NotificationsPage() {
  const supabase = createClient();
  const notifications = await getNotificationsForCurrentUser(supabase);
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const hasUnread = unreadCount > 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Updates on invitations and activity across your chains."
        actions={
          hasUnread ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="outline" size="sm">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            </form>
          ) : undefined
        }
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">{unreadCount}</p>
              <p className="text-xs text-muted-foreground">Unread updates</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <Inbox className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">{notifications.length}</p>
              <p className="text-xs text-muted-foreground">Total notifications</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {notifications.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No notifications yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
