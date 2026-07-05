import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import * as notificationsRepo from "@/server/repositories/notifications.repository";

type TypedClient = SupabaseClient<Database>;

export async function getNotificationsForCurrentUser(supabase: TypedClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return notificationsRepo.listNotificationsForProfile(supabase, user.id);
}

export async function getUnreadCountForCurrentUser(supabase: TypedClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  return notificationsRepo.countUnreadNotifications(supabase, user.id);
}

export async function markNotificationRead(supabase: TypedClient, notificationId: string) {
  return notificationsRepo.markNotificationRead(supabase, notificationId);
}

export async function markAllNotificationsRead(supabase: TypedClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  return notificationsRepo.markAllNotificationsRead(supabase, user.id);
}
