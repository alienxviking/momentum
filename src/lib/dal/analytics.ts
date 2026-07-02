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

  // Total active habits
  const { count: totalHabits } = await supabase
    .from("habits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Habits completed today
  const { count: completedHabits } = await supabase
    .from("habit_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completion_date", today)
    .eq("is_completed", true);

  // Today's report tasks
  const { data: todayReports } = await supabase
    .from("daily_reports")
    .select("tasks_completed")
    .eq("user_id", user.id)
    .eq("report_date", today);

  let tasksTotal = 0;
  let tasksCompleted = 0;
  (todayReports || []).forEach((r) => {
    const tasks = r.tasks_completed as { completed: boolean }[];
    if (Array.isArray(tasks)) {
      tasksTotal += tasks.length;
      tasksCompleted += tasks.filter((t) => t.completed).length;
    }
  });

  // Compute streak (consecutive days with at least one habit logged)
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    const { count } = await supabase
      .from("habit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completion_date", dateStr)
      .eq("is_completed", true);

    if (count && count > 0) {
      streak++;
    } else if (i === 0) {
      continue; // today not done yet
    } else {
      break;
    }
  }

  // Weekly consistency: habits completed / total possible in last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split("T")[0];

  const { count: weeklyCompleted } = await supabase
    .from("habit_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("completion_date", weekStr)
    .eq("is_completed", true);

  const weeklyPossible = (totalHabits || 0) * 7;
  const weeklyConsistency =
    weeklyPossible > 0
      ? Math.round(((weeklyCompleted || 0) / weeklyPossible) * 100)
      : 0;

  // Recompute the caller's accountability score from the trailing 30 days
  // (also applies decay when they've been inactive), then read it back.
  await supabase.rpc("recalculate_accountability_score");

  const { data: profile } = await supabase
    .from("profiles")
    .select("accountability_score")
    .eq("id", user.id)
    .single();

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
