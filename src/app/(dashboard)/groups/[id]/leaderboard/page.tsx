"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Flame } from "lucide-react";
import { getLeaderboard } from "@/lib/dal/analytics";
import { use, useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const badgeLabels: Record<string, { label: string; emoji: string }> = {
    top_performer: { label: "Top Performer", emoji: "🏆" },
    most_improved: { label: "Most Improved", emoji: "📈" },
    longest_streak: { label: "Longest Streak", emoji: "🔥" },
  };

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await getLeaderboard(id);
        setEntries(data);
      } catch (err) {
        console.error("Error loading leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Safely construct podium entries based on what we have
  const podiumList = [];
  if (entries.length > 1) {
    podiumList.push({ entry: entries[1], height: 120, color: "#94a3b8", rank: 2 });
  }
  if (entries.length > 0) {
    podiumList.push({ entry: entries[0], height: 160, color: "#f59e0b", rank: 1 });
  }
  if (entries.length > 2) {
    podiumList.push({ entry: entries[2], height: 100, color: "#cd7f32", rank: 3 });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href={`/groups/${id}`} className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Group
        </Link>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Leaderboard</h1>
      </motion.div>

      {/* Podium */}
      {entries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 flex items-end justify-center gap-4">
          {podiumList.map(({ entry, height, color, rank }) => (
            <div key={entry.rank} className="flex flex-col items-center">
              <div className="avatar avatar-lg mb-2 font-semibold" style={{ background: `${color}30`, color: color, border: `2px solid ${color}` }}>
                {entry.user.avatar_url ? (
                  <img src={entry.user.avatar_url} alt={entry.user.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  entry.user.full_name[0]?.toUpperCase()
                )}
              </div>
              <span className="text-xs font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>{entry.user.full_name.split(" ")[0]}</span>
              <span className="text-lg font-bold" style={{ color }}>{entry.score}</span>
              <div className="w-20 rounded-t-xl flex items-end justify-center pb-2 animate-pulse" style={{ height, background: `${color}15`, border: `1px solid ${color}30`, borderBottom: "none" }}>
                <span className="text-2xl font-black" style={{ color }}>#{rank}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Full List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 space-y-2">
        {entries.length === 0 ? (
          <div className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
            No members have recorded scores yet.
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={entry.rank} className="flex items-center gap-4 p-4 rounded-xl transition-colors"
              style={{ background: entry.rank <= 3 ? "var(--color-bg-tertiary)" : "transparent" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: entry.rank === 1 ? "#f59e0b20" : entry.rank === 2 ? "#94a3b820" : entry.rank === 3 ? "#cd7f3220" : "var(--color-bg-tertiary)", color: entry.rank === 1 ? "#f59e0b" : entry.rank === 2 ? "#94a3b8" : entry.rank === 3 ? "#cd7f32" : "var(--color-text-muted)" }}>
                {entry.rank}
              </div>
              <div className="avatar avatar-md font-semibold" style={{ background: `hsl(${(idx * 73) % 360}, 60%, 50%)`, color: "white" }}>
                {entry.user.avatar_url ? (
                  <img src={entry.user.avatar_url} alt={entry.user.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  entry.user.full_name[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{entry.user.full_name}</div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span>Score: {entry.score}</span>
                </div>
              </div>
              {entry.badge && badgeLabels[entry.badge] && (
                <span className="badge badge-warning text-xs">{badgeLabels[entry.badge].emoji} {badgeLabels[entry.badge].label}</span>
              )}
              <span className="text-xl font-bold" style={{ color: "var(--color-accent-primary)" }}>{entry.score}</span>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
}
