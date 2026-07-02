import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";

export async function getNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data || []).map((n) => ({
    id: n.id,
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message || "",
    link: n.link,
    is_read: n.is_read,
    created_at: n.created_at,
  }));
}

// Drops a "you haven't logged today" reminder into the caller's bell if they're
// in a group and haven't submitted today. Idempotent per day (enforced in SQL).
export async function maybeCreateDailyReminder() {
  const supabase = createClient();
  await supabase.rpc("maybe_create_daily_reminder");
}

export async function getUnreadCount(): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count || 0;
}

export async function markAsRead(id: string) {
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
}

export async function markAllAsRead() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
}
