import { createClient } from "@/lib/supabase/client";
import type { WeeklyReview } from "@/lib/types";

// Ensures the current user's most-recent-week reviews exist, then returns them.
export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Lazily generate the latest week's reviews (no-op if already present).
  await supabase.rpc("ensure_weekly_reviews");

  const { data } = await supabase
    .from("weekly_reviews")
    .select("*, groups(name)")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false });

  return (data || []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    group_id: r.group_id,
    week_start: r.week_start,
    total_hours: Number(r.total_hours) || 0,
    habits_completed: r.habits_completed || 0,
    habits_missed: r.habits_missed || 0,
    streak_change: r.streak_change || 0,
    group_ranking: r.group_ranking || 0,
    review_text: r.review_text || "",
    created_at: r.created_at,
    group_name: (r.groups as { name?: string } | null)?.name || "Group",
  }));
}

// Fire-and-forget generation (used on app load so the "ready" notification
// appears in the bell even before the user opens the weekly view).
export async function ensureWeeklyReviews() {
  const supabase = createClient();
  await supabase.rpc("ensure_weekly_reviews");
}

export async function updateWeeklyReviewText(id: string, text: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("weekly_reviews")
    .update({ review_text: text })
    .eq("id", id);
  if (error) throw error;
}
