import { createClient } from "@/lib/supabase/client";
import type { DashboardStats, LeaderboardEntry } from "@/lib/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return {
      current_streak: 0,
      habits_completed_today: 0,
      total_habits_today: 0,
      tasks_completed_today: 0,
      total_tasks_today: 0,
      weekly_consistency: 0,
      accountability_score: 0,
    };

  const today = new Date().toISOString().split("T")[0];
  const streakStart = new Date();
  streakStart.setDate(streakStart.getDate() - 60);
  const streakStartStr = streakStart.toISOString().split("T")[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split("T")[0];

  // All independent — run them in parallel instead of one after another.
  // (The accountability score is kept fresh by activity triggers + a
  // once-per-session recompute, so it's just read here, not recomputed.)
  const [totalRes, completedRes, todayRes, streakRes, weeklyRes, profileRes] = await Promise.all([
    supabase.from("habits").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true),
    supabase.from("habit_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completion_date", today).eq("is_completed", true),
    supabase.from("daily_reports").select("tasks_completed").eq("user_id", user.id).eq("report_date", today),
    supabase.from("habit_logs").select("completion_date").eq("user_id", user.id).eq("is_completed", true).gte("completion_date", streakStartStr),
    supabase.from("habit_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("completion_date", weekStr).eq("is_completed", true),
    supabase.from("profiles").select("accountability_score").eq("id", user.id).single(),
  ]);

  const totalHabits = totalRes.count;
  const completedHabits = completedRes.count;

  let tasksTotal = 0;
  let tasksCompleted = 0;
  (todayRes.data || []).forEach((r) => {
    const tasks = r.tasks_completed as { completed: boolean }[];
    if (Array.isArray(tasks)) {
      tasksTotal += tasks.length;
      tasksCompleted += tasks.filter((t) => t.completed).length;
    }
  });

  // Streak: consecutive days (ending today/yesterday) with a completed habit.
  const completedDays = new Set((streakRes.data || []).map((l) => l.completion_date));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    if (completedDays.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      continue; // today not done yet
    } else {
      break;
    }
  }

  const weeklyPossible = (totalHabits || 0) * 7;
  const weeklyConsistency =
    weeklyPossible > 0
      ? Math.round(((weeklyRes.count || 0) / weeklyPossible) * 100)
      : 0;

  const profile = profileRes.data;

  return {
    current_streak: streak,
    habits_completed_today: completedHabits || 0,
    total_habits_today: totalHabits || 0,
    tasks_completed_today: tasksCompleted,
    total_tasks_today: tasksTotal,
    weekly_consistency: weeklyConsistency,
    accountability_score: profile?.accountability_score || 50,
  };
}

// Recomputes the caller's accountability score (applies inactivity decay).
// Called once per app load in the background — activity triggers keep it fresh
// the rest of the time, so it no longer runs on every dashboard read.
export async function recalculateMyScore() {
  const supabase = createClient();
  await supabase.rpc("recalculate_accountability_score");
}

export async function getOnboardingStatus(): Promise<{
  hasGroup: boolean;
  hasHabit: boolean;
  hasReport: boolean;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { hasGroup: false, hasHabit: false, hasReport: false };

  const [groups, habits, reports] = await Promise.all([
    supabase.from("group_members").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("habits").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("daily_reports").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return {
    hasGroup: (groups.count || 0) > 0,
    hasHabit: (habits.count || 0) > 0,
    hasReport: (reports.count || 0) > 0,
  };
}

export interface AchievementStats {
  groups_count: number;
  habits_count: number;
  reports_count: number;
  peer_actions: number;
  best_streak: number;
  score: number;
}

export async function getUserAchievementStats(): Promise<AchievementStats> {
  const empty: AchievementStats = {
    groups_count: 0,
    habits_count: 0,
    reports_count: 0,
    peer_actions: 0,
    best_streak: 0,
    score: 0,
  };
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_user_achievement_stats");
  if (error || !data || !data[0]) return empty;
  return data[0] as AchievementStats;
}

export async function getWeeklyProductivity() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayName = days[date.getDay()];

    // Hours from reports
    const { data: reports } = await supabase
      .from("daily_reports")
      .select("hours_worked, productivity_rating")
      .eq("user_id", user.id)
      .eq("report_date", dateStr);

    const hours = (reports || []).reduce(
      (sum, r) => sum + (Number(r.hours_worked) || 0),
      0
    );
    const score =
      reports && reports.length > 0
        ? Math.round(
            (reports.reduce((sum, r) => sum + (r.productivity_rating || 0), 0) /
              reports.length) *
              10
          )
        : 0;

    // Habits completed
    const { count: habits } = await supabase
      .from("habit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completion_date", dateStr)
      .eq("is_completed", true);

    result.push({ day: dayName, hours, habits: habits || 0, score });
  }

  return result;
}

export async function getMonthlyTrend() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const result = [];

  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - w * 7);

    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];

    const { data: reports } = await supabase
      .from("daily_reports")
      .select("hours_worked, productivity_rating")
      .eq("user_id", user.id)
      .gte("report_date", startStr)
      .lt("report_date", endStr);

    const hours = (reports || []).reduce(
      (sum, r) => sum + (Number(r.hours_worked) || 0),
      0
    );
    const score =
      reports && reports.length > 0
        ? Math.round(
            reports.reduce((sum, r) => sum + (r.productivity_rating || 0), 0) /
              reports.length * 10
          )
        : 0;

    const { count: habits } = await supabase
      .from("habit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completion_date", startStr)
      .lt("completion_date", endStr)
      .eq("is_completed", true);

    result.push({
      week: `Week ${4 - w}`,
      score,
      hours: Math.round(hours * 10) / 10,
      habits: habits || 0,
    });
  }

  return result;
}

interface LeaderboardRow {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  score: number;
  streak: number;
  consistency: number;
  improvement: number;
}

export async function getLeaderboard(groupId: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_group_leaderboard", { gid: groupId });
  if (error || !data) return [];
  const rows = data as LeaderboardRow[];
  if (rows.length === 0) return [];

  const entries: LeaderboardEntry[] = rows.map((r) => ({
    rank: 0,
    user: {
      id: r.user_id,
      email: "",
      username: r.username || "",
      full_name: r.full_name || "",
      avatar_url: r.avatar_url || "",
      bio: "",
      accountability_score: r.score,
      created_at: "",
      updated_at: "",
    },
    score: r.score,
    streak: r.streak,
    consistency: r.consistency,
  }));

  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => (e.rank = i + 1));

  // Real badges — one per member, highest-priority badge wins.
  if (entries.length > 0) entries[0].badge = "top_performer";

  const streakLeader = rows.reduce((best, r) => (r.streak > best.streak ? r : best), rows[0]);
  if (streakLeader.streak > 0) {
    const e = entries.find((x) => x.user.id === streakLeader.user_id);
    if (e && !e.badge) e.badge = "longest_streak";
  }

  const improveLeader = rows.reduce((best, r) => (r.improvement > best.improvement ? r : best), rows[0]);
  if (improveLeader.improvement > 0) {
    const e = entries.find((x) => x.user.id === improveLeader.user_id);
    if (e && !e.badge) e.badge = "most_improved";
  }

  return entries;
}
