import { createClient } from "@/lib/supabase/client";
import type { Habit, HeatmapDay } from "@/lib/types";

export async function getHabits(): Promise<Habit[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split("T")[0];

  // Get habits
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (!habits) return [];

  // Get today's logs
  const { data: todayLogs } = await supabase
    .from("habit_logs")
    .select("habit_id")
    .eq("user_id", user.id)
    .eq("completion_date", today)
    .eq("is_completed", true);

  const completedIds = new Set((todayLogs || []).map((l) => l.habit_id));

  // Compute streaks for each habit
  const habitsWithMeta: Habit[] = await Promise.all(
    habits.map(async (h) => {
      const streak = await computeStreak(h.id, user.id);
      return {
        id: h.id,
        user_id: h.user_id,
        name: h.name,
        category: h.category || "",
        frequency: h.frequency || "daily",
        color: h.color || "#059669",
        icon: h.icon || "✅",
        start_date: h.start_date,
        is_active: h.is_active,
        created_at: h.created_at,
        streak,
        completed_today: completedIds.has(h.id),
      };
    })
  );

  return habitsWithMeta;
}

async function computeStreak(habitId: string, userId: string): Promise<number> {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from("habit_logs")
    .select("completion_date")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .eq("is_completed", true)
    .order("completion_date", { ascending: false })
    .limit(60);

  if (!logs || logs.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (logs.some((l) => l.completion_date === dateStr)) {
      streak++;
    } else if (i === 0) {
      // Today not done yet, that's ok — start counting from yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export async function createHabit(data: {
  name: string;
  category: string;
  frequency: string;
  color: string;
  icon: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: data.name,
    category: data.category,
    frequency: data.frequency,
    color: data.color,
    icon: data.icon,
  });

  if (error) throw error;
}

export async function toggleHabitCompletion(habitId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date().toISOString().split("T")[0];

  // Check if already completed today
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .eq("completion_date", today)
    .single();

  if (existing) {
    // Un-complete
    await supabase.from("habit_logs").delete().eq("id", existing.id);
    return false;
  } else {
    // Complete
    await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      completion_date: today,
      is_completed: true,
    });
    return true;
  }
}

export async function getHeatmapData(): Promise<HeatmapDay[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const startDate = oneYearAgo.toISOString().split("T")[0];

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("completion_date")
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .gte("completion_date", startDate)
    .order("completion_date", { ascending: true });

  // Count completions per day
  const countMap: Record<string, number> = {};
  (logs || []).forEach((l) => {
    countMap[l.completion_date] = (countMap[l.completion_date] || 0) + 1;
  });

  // Generate heatmap for last 365 days
  const days: HeatmapDay[] = [];
  const now = new Date();
  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const count = countMap[dateStr] || 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count >= 4) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    days.push({ date: dateStr, count, level });
  }

  return days;
}

export async function getHabitStats() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { completed: 0, total: 0 };

  const today = new Date().toISOString().split("T")[0];

  const { count: total } = await supabase
    .from("habits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  const { count: completed } = await supabase
    .from("habit_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completion_date", today)
    .eq("is_completed", true);

  return { completed: completed || 0, total: total || 0 };
}
