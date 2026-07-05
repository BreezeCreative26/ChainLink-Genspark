import { CheckCheck } from "lucide-react";

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
  const hasUnread = notifications.some((n) => !n.read_at);

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

      {notifications.length === 0 ? (
        <Card>
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
