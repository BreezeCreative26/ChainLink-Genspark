import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database, "public", Database["public"]>;

export async function listNotificationsForProfile(supabase: TypedClient, profileId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, link_path, read_at, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data;
}

export async function countUnreadNotifications(supabase: TypedClient, profileId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(supabase: TypedClient, notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead(supabase: TypedClient, profileId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .is("read_at", null);

  if (error) throw error;
}
