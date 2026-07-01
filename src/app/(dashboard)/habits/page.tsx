"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { getHabits, toggleHabitCompletion, getHeatmapData } from "@/lib/dal/habits";
import type { Habit, HeatmapDay } from "@/lib/types";
import { PageSpinner, EmptyState } from "@/components/ui";
import { toast } from "sonner";

function HabitHeatmap({ data }: { data: HeatmapDay[] }) {
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-0.5 items-start" style={{ minWidth: "720px" }}>
        <div className="flex flex-col gap-0.5 mr-1 text-[10px] pt-4" style={{ color: "var(--color-text-muted)" }}>
          <span style={{ height: 13 }}>Mon</span>
          <span style={{ height: 13 }}></span>
          <span style={{ height: 13 }}>Wed</span>
          <span style={{ height: 13 }}></span>
          <span style={{ height: 13 }}>Fri</span>
          <span style={{ height: 13 }}></span>
          <span style={{ height: 13 }}></span>
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {wi % 4 === 0 && week[0] ? (
              <span className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)", height: 12 }}>
                {months[new Date(week[0].date).getMonth()]}
              </span>
            ) : (
              <span style={{ height: 12 }}></span>
            )}
            {week.map((day) => (
              <div key={day.date} className={`heatmap-cell heatmap-level-${day.level}`}
                style={{ width: 13, height: 13 }} title={`${day.date}: ${day.count} completed`} />
            ))}
            </div>
          ))}
        </div>
      </div>
      {/* Fade affordance — hints the heatmap scrolls horizontally on narrow screens */}
      <div className="pointer-events-none absolute top-0 right-0 bottom-2 w-12 hidden sm:block"
        style={{ background: "linear-gradient(90deg, transparent, var(--color-bg-card))" }} />
      <div className="flex items-center gap-1 mt-2 justify-end text-[10px]" style={{ color: "var(--color-text-muted)" }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`heatmap-cell heatmap-level-${level}`} style={{ width: 13, height: 13 }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHabitsData() {
      try {
        const [currentHabits, currentHeatmap] = await Promise.all([
          getHabits(),
          getHeatmapData(),
        ]);
        setHabits(currentHabits);
        setHeatmap(currentHeatmap);
      } catch (err) {
        console.error("Error loading habits page data", err);
        toast.error("Couldn't load your habits. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadHabitsData();
  }, []);

  const toggleHabit = async (id: string) => {
    try {
      const isCompleted = await toggleHabitCompletion(id);
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                completed_today: isCompleted,
                streak: (h.streak || 0) + (isCompleted ? 1 : (h.streak || 0) > 0 ? -1 : 0),
              }
            : h
        )
      );
      // Reload heatmap
      const newHeatmap = await getHeatmapData();
      setHeatmap(newHeatmap);
      toast.success(isCompleted ? "Habit completed! 🔥" : "Habit unmarked");
    } catch (err) {
      console.error("Failed to toggle habit", err);
      toast.error("Couldn't update habit. Please try again.");
    }
  };

  const completedCount = habits.filter((h) => h.completed_today).length;

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Habits</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>{completedCount}/{habits.length} completed today</p>
        </div>
        <Link href="/habits/create" className="btn-primary"><Plus className="w-4 h-4" /> New Habit</Link>
      </motion.div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Activity Heatmap</h2>
        {heatmap.length > 0 ? (
          <HabitHeatmap data={heatmap} />
        ) : (
          <div className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
            No activity tracked yet. Heatmap will appear when you complete habits.
          </div>
        )}
      </motion.div>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title="Build your first habit"
            description="Define a daily or weekly target, track your progress with custom colors and icons, and build your streaks."
            action={{ label: "Get Started", href: "/habits/create" }}
          />
        ) : (
          habits.map((habit, i) => (
            <motion.div key={habit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
              className="glass-card p-5 flex items-center gap-4">
              <button onClick={() => toggleHabit(habit.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={habit.completed_today ? { background: habit.color, color: "white" } : { border: `2px solid ${habit.color}40` }}>
                {habit.completed_today && <CheckCircle2 className="w-5 h-5" />}
              </button>
              <span className="text-xl flex-shrink-0">{habit.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)", textDecoration: habit.completed_today ? "line-through" : "none", opacity: habit.completed_today ? 0.7 : 1 }}>
                  {habit.name}
                </div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{habit.frequency} • {habit.category}</div>
              </div>
              {habit.streak && habit.streak > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "var(--color-warning-soft)" }}>
                  <Flame className="w-3.5 h-3.5" style={{ color: "var(--color-warning)" }} />
                  <span className="text-xs font-bold" style={{ color: "var(--color-warning)" }}>{habit.streak}</span>
                </div>
              )}
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: habit.color }} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
