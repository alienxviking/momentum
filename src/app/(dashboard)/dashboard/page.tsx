"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, CheckCircle2, ListTodo, TrendingUp, Users, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/dal/auth";
import { getDashboardStats, getOnboardingStatus } from "@/lib/dal/analytics";
import { getHabits, toggleHabitCompletion } from "@/lib/dal/habits";
import { getMyGroups } from "@/lib/dal/groups";
import { getReports } from "@/lib/dal/reports";
import type { User, DashboardStats, Habit, Group, DailyReport } from "@/lib/types";
import { MOOD_EMOJIS } from "@/lib/constants";
import { celebrate } from "@/lib/celebrate";
import {
  StatCard,
  GlassCard,
  SectionHeader,
  Avatar,
  CategoryIcon,
  Badge,
} from "@/components/ui";
import { DashboardSkeleton } from "./skeleton";
import { OnboardingChecklist, type OnboardingStatus } from "./onboarding-checklist";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const } }),
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentReports, setRecentReports] = useState<DailyReport[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [currentUser, currentStats, currentHabits, currentGroups, currentReports, onboardingStatus] = await Promise.all([
          getCurrentUser(),
          getDashboardStats(),
          getHabits(),
          getMyGroups(),
          getReports(),
          getOnboardingStatus(),
        ]);
        setUser(currentUser);
        setStats(currentStats);
        setHabits(currentHabits);
        setGroups(currentGroups.slice(0, 3));
        setRecentReports(currentReports.slice(0, 2));
        setOnboarding(onboardingStatus);
      } catch (err) {
        console.error("Error loading dashboard data", err);
        toast.error("Couldn't load your dashboard. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleToggleHabit = async (habitId: string, event: React.MouseEvent) => {
    try {
      const isCompleted = await toggleHabitCompletion(habitId);
      const habit = habits.find((h) => h.id === habitId);
      setHabits(habits.map((h) => h.id === habitId ? { ...h, completed_today: isCompleted, streak: (h.streak || 0) + (isCompleted ? 1 : -1) } : h));
      const newStats = await getDashboardStats();
      setStats(newStats);
      if (isCompleted) {
        // Celebrate from the click point.
        celebrate({ x: event.clientX, y: event.clientY });
        const newStreak = (habit?.streak || 0) + 1;
        toast.success(
          newStreak > 1 ? `${habit?.name} done — ${newStreak} day streak! 🔥` : `${habit?.name} completed! 🎉`
        );
      }
    } catch (err) {
      console.error("Failed to toggle habit completion", err);
      toast.error("Couldn't update that habit. Try again.");
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) return <DashboardSkeleton />;

  const activeStats = stats || {
    current_streak: 0,
    habits_completed_today: 0,
    total_habits_today: 0,
    tasks_completed_today: 0,
    total_tasks_today: 0,
    weekly_consistency: 0,
    accountability_score: 50,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          {getGreeting()}, {user?.full_name || "Achiever"} 👋
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>Here&apos;s your progress overview for today.</p>
      </motion.div>

      {/* First-run onboarding (hides itself once all steps are done) */}
      {onboarding && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <OnboardingChecklist status={onboarding} />
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard index={1} label="Current Streak" value={activeStats.current_streak} suffix={activeStats.current_streak === 1 ? " day" : " days"} color="#f97316" accent="orange"
          icon={<Flame className="w-5 h-5" />} />
        <StatCard index={2} label="Habits Today" value={activeStats.habits_completed_today} color="#059669" accent="green"
          icon={<CheckCircle2 className="w-5 h-5" />} suffix={`/${activeStats.total_habits_today}`}
          ring={{ value: activeStats.habits_completed_today, max: activeStats.total_habits_today, color: "#059669" }} />
        <StatCard index={3} label="Tasks Done" value={activeStats.tasks_completed_today} color="#3b82f6" accent="blue"
          icon={<ListTodo className="w-5 h-5" />} suffix={`/${activeStats.total_tasks_today}`}
          ring={{ value: activeStats.tasks_completed_today, max: activeStats.total_tasks_today, color: "#3b82f6" }} />
        <StatCard index={4} label="Weekly Score" value={activeStats.weekly_consistency} suffix="%" color="#059669" accent="emerald"
          icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Today's Habits */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="lg:col-span-2">
          <GlassCard className="p-6 h-full">
            <SectionHeader title="Today's Habits" link={{ label: "View all", href: "/habits" }} />
            {habits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>No habits tracked today.</p>
                <Link href="/habits/create" className="btn-primary inline-flex gap-2">
                  <Plus className="w-4 h-4" /> Create Habit
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {habits.map((habit) => (
                  <button key={habit.id} type="button"
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:scale-[1.01]"
                    onClick={(e) => handleToggleHabit(habit.id, e)}
                    aria-pressed={habit.completed_today}
                    aria-label={`${habit.completed_today ? "Mark incomplete" : "Mark complete"}: ${habit.name}`}
                    style={{ background: habit.completed_today ? "var(--color-success-soft)" : "var(--color-bg-tertiary)" }}>
                    <span className="text-lg" aria-hidden>{habit.icon}</span>
                    <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{habit.name}</span>
                    {habit.streak && habit.streak > 0 && (
                      <Badge variant="warning">🔥 {habit.streak}d</Badge>
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${habit.completed_today ? "" : "border-2"}`}
                      style={habit.completed_today ? { background: "var(--color-success)", color: "white" } : { borderColor: "var(--color-border-default)" }}>
                      {habit.completed_today && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Active Groups */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
          <GlassCard className="p-6 h-full">
            <SectionHeader title="Active Groups" link={{ label: "View all", href: "/groups" }} />
            <div className="space-y-3">
              {groups.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>Not in any groups yet.</p>
                  <Link href="/groups" className="btn-secondary text-xs inline-block">Explore Groups</Link>
                </div>
              ) : (
                groups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`} className="block p-3 rounded-xl transition-colors"
                    style={{ background: "var(--color-bg-tertiary)" }}>
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={group.category} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{group.name}</div>
                        <div className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                          <Users className="w-3 h-3" /> {group.member_count} members
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
              <Link href="/groups/create" className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors"
                style={{ border: "1px dashed var(--color-border-default)", color: "var(--color-text-muted)" }}>
                <Plus className="w-4 h-4" /> Create Group
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent Feedback */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}>
        <GlassCard className="p-6">
          <SectionHeader title="Recent Activity" link={{ label: "View all", href: "/reviews" }} />
          {recentReports.length === 0 ? (
            <div className="text-center py-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
              No recent daily reports in your groups.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {recentReports.map((report) => (
                <div key={report.id} className="p-4 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar src={report.user?.avatar_url} name={report.user?.full_name} size="md" />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{report.user?.full_name}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {report.hours_worked}h worked • Mood: {MOOD_EMOJIS[report.mood_rating]?.emoji}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{report.notes}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Link href="/reviews" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-accent-primary)" }}>
                      <MessageSquare className="w-3 h-3" /> Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
