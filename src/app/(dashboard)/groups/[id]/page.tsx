"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Trophy, Copy, Settings, Crown, TrendingUp, Check } from "lucide-react";
import { getGroupById, getGroupMembers } from "@/lib/dal/groups";
import { getLeaderboard } from "@/lib/dal/analytics";
import { GROUP_CATEGORIES } from "@/lib/constants";
import { use, useEffect, useState } from "react";
import type { Group, User, LeaderboardEntry } from "@/lib/types";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadGroupData() {
      try {
        const [currentGroup, currentMembers, currentLeaderboard] = await Promise.all([
          getGroupById(id),
          getGroupMembers(id),
          getLeaderboard(id),
        ]);
        setGroup(currentGroup);
        setMembers(currentMembers);
        setLeaderboard(currentLeaderboard.slice(0, 3));
      } catch (err) {
        console.error("Error loading group details", err);
      } finally {
        setLoading(false);
      }
    }
    loadGroupData();
  }, [id]);

  const copyInviteCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Group not found</h2>
        <Link href="/groups" className="btn-primary">Back to Groups</Link>
      </div>
    );
  }

  const cat = GROUP_CATEGORIES[group.category] || GROUP_CATEGORIES.other;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/groups" className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </Link>
      </motion.div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: `${cat.color}20` }}>{cat.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold truncate" style={{ color: "var(--color-text-primary)" }}>{group.name}</h1>
              <span className="badge badge-accent" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.label}</span>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>{group.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {group.member_count} members</span>
              <span>{group.is_public ? "🌐 Public" : "🔒 Private"}</span>
            </div>
          </div>
          <Link href={`/groups/${id}/settings`} className="btn-secondary p-2"><Settings className="w-4 h-4" /></Link>
        </div>
        {/* Invite */}
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
          <span className="text-xs font-medium flex-1 font-mono truncate" style={{ color: "var(--color-text-secondary)" }}>
            Invite Code: <span className="font-bold text-white select-all">{group.invite_code}</span>
          </span>
          <button onClick={copyInviteCode} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Members */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Members</h2>
          <div className="space-y-3">
            {members.map((user, i) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="avatar avatar-md font-semibold" style={{ background: `hsl(${(i * 73) % 360}, 70%, 50%)`, color: "white" }}>
                    {user.full_name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{user.full_name}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Score: {user.accountability_score}</div>
                </div>
                {group.created_by === user.id && <Crown className="w-4 h-4" style={{ color: "#f59e0b" }} />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Leaderboard Preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Leaderboard</h2>
            <Link href={`/groups/${id}/leaderboard`} className="text-xs font-medium" style={{ color: "var(--color-accent-primary)" }}>View full</Link>
          </div>
          {leaderboard.length === 0 ? (
            <div className="text-sm text-center py-6" style={{ color: "var(--color-text-muted)" }}>
              No scores recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: entry.rank === 1 ? "#f59e0b20" : entry.rank === 2 ? "#94a3b820" : "#cd7f3220", color: entry.rank === 1 ? "#f59e0b" : entry.rank === 2 ? "#94a3b8" : "#cd7f32" }}>
                    {entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{entry.user.full_name}</div>
                    <div className="text-xs flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                      <span>Score: {entry.score}</span>
                    </div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: "var(--color-accent-primary)" }}>{entry.score}</span>
                  {entry.badge && <Trophy className="w-4 h-4" style={{ color: "#f59e0b" }} />}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Rules */}
      {group.rules && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Group Rules</h2>
          <div className="text-sm whitespace-pre-line" style={{ color: "var(--color-text-secondary)" }}>{group.rules}</div>
        </motion.div>
      )}
    </div>
  );
}
