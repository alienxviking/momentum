"use client";

import type { AchievementStats } from "@/lib/dal/analytics";

interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  metric: keyof AchievementStats;
  target: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: "joined", title: "First Steps", desc: "Join or create a group", emoji: "🚀", metric: "groups_count", target: 1 },
  { id: "habit", title: "Habit Former", desc: "Create your first habit", emoji: "🌱", metric: "habits_count", target: 1 },
  { id: "report", title: "Day One", desc: "Log your first progress", emoji: "📝", metric: "reports_count", target: 1 },
  { id: "streak7", title: "On a Roll", desc: "Reach a 7-day streak", emoji: "🔥", metric: "best_streak", target: 7 },
  { id: "reports30", title: "Reliable", desc: "Submit 30 progress reports", emoji: "📈", metric: "reports_count", target: 30 },
  { id: "peer", title: "Team Player", desc: "Give 25 reactions & comments", emoji: "🤝", metric: "peer_actions", target: 25 },
  { id: "streak30", title: "Unstoppable", desc: "Reach a 30-day streak", emoji: "⚡", metric: "best_streak", target: 30 },
  { id: "score80", title: "High Achiever", desc: "Reach an 80 accountability score", emoji: "🏆", metric: "score", target: 80 },
];

export function Achievements({ stats }: { stats: AchievementStats }) {
  const items = ACHIEVEMENTS.map((a) => {
    const value = stats[a.metric];
    return { ...a, earned: value >= a.target, progress: Math.min(100, Math.round((value / a.target) * 100)) };
  });
  const unlocked = items.filter((i) => i.earned).length;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Achievements</h2>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          {unlocked} of {items.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((a) => (
          <div
            key={a.id}
            title={a.earned ? a.title : `${a.desc} (${a.progress}%)`}
            className="rounded-xl p-4 flex flex-col items-center text-center gap-1"
            style={{
              background: a.earned ? "var(--color-accent-glow)" : "var(--color-bg-tertiary)",
              border: a.earned ? "1px solid rgba(5, 150, 105, 0.3)" : "1px solid var(--color-border-subtle)",
              opacity: a.earned ? 1 : 0.6,
            }}
          >
            <span className="text-2xl" style={{ filter: a.earned ? "none" : "grayscale(1)" }} aria-hidden>
              {a.emoji}
            </span>
            <span className="text-xs font-semibold mt-1" style={{ color: "var(--color-text-primary)" }}>{a.title}</span>
            <span className="text-[10px] leading-tight" style={{ color: "var(--color-text-muted)" }}>{a.desc}</span>

            {!a.earned && (
              <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                <div className="h-full rounded-full" style={{ width: `${a.progress}%`, background: "var(--color-accent-primary)" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
