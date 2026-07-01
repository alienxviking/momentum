"use client";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { getDashboardStats, getWeeklyProductivity, getMonthlyTrend } from "@/lib/dal/analytics";
import type { DashboardStats } from "@/lib/types";
import { toast } from "sonner";
import { PageSpinner, CountUp } from "@/components/ui";
import { useChartTheme } from "@/lib/use-chart-theme";

interface ChartPoint { day?: string; week?: string; hours?: number; score?: number; habits?: number; }

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyProductivity, setWeeklyProductivity] = useState<ChartPoint[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const chart = useChartTheme();

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [statsData, weeklyData, monthlyData] = await Promise.all([
          getDashboardStats(),
          getWeeklyProductivity(),
          getMonthlyTrend(),
        ]);
        setStats(statsData);
        setWeeklyProductivity(weeklyData);
        setMonthlyTrend(monthlyData);
      } catch (err) {
        console.error("Failed to load analytics", err);
        toast.error("Couldn't load analytics. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) return <PageSpinner />;

  const activeStats = stats || {
    accountability_score: 50,
    weekly_consistency: 0,
    current_streak: 0,
    habits_completed_today: 0,
    total_habits_today: 0,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Analytics</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>Track your performance trends and insights</p>
      </motion.div>

      {/* Score Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Accountability Score", value: activeStats.accountability_score, suffix: "/100", color: "#059669" },
          { label: "Weekly Consistency", value: activeStats.weekly_consistency, suffix: "%", color: "#059669" },
          { label: "Current Streak", value: activeStats.current_streak, suffix: " days", color: "#f97316" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5 text-center">
            <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
          </div>
        ))}
        <div className="glass-card p-5 text-center">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Habits Today</p>
          <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>
            {activeStats.habits_completed_today}/{activeStats.total_habits_today}
          </p>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Daily Productivity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Daily Productivity</h2>
          {weeklyProductivity.length === 0 ? (
            <div className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>No report data for this week yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
                <YAxis stroke={chart.axis} fontSize={12} />
                <Tooltip contentStyle={chart.tooltip} />
                <Bar dataKey="hours" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Weekly Consistency */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Weekly Consistency</h2>
          {weeklyProductivity.length === 0 ? (
            <div className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>No report data for this week yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
                <YAxis stroke={chart.axis} fontSize={12} />
                <Tooltip contentStyle={chart.tooltip} />
                <Line type="monotone" dataKey="score" stroke="#059669" strokeWidth={2} dot={{ fill: "#059669", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Habit Completion Trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Habit Completion Trends</h2>
          {weeklyProductivity.length === 0 ? (
            <div className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>No habit completion data for this week yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
                <YAxis stroke={chart.axis} fontSize={12} />
                <Tooltip contentStyle={chart.tooltip} />
                <Bar dataKey="habits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Accountability Score Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Monthly Score Trend</h2>
          {monthlyTrend.length === 0 ? (
            <div className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>No trend data for this month yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="week" stroke={chart.axis} fontSize={12} />
                <YAxis stroke={chart.axis} fontSize={12} />
                <Tooltip contentStyle={chart.tooltip} />
                <Area type="monotone" dataKey="score" stroke="#059669" strokeWidth={2} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
