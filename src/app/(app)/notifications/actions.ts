"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/server/services/notifications";

export async function markNotificationReadAction(notificationId: string) {
  const supabase = createClient();
  await markNotificationRead(supabase, notificationId);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const supabase = createClient();
  await markAllNotificationsRead(supabase);
  revalidatePath("/notifications");
}
