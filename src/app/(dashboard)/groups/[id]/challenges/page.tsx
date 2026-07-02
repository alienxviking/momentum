"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { ArrowLeft, Plus, Trash2, Target as TargetIcon } from "lucide-react";
import { toast } from "sonner";
import { getGroupChallenges, createChallenge, deleteChallenge, getChallengeProgress } from "@/lib/dal/challenges";
import { getCurrentUser } from "@/lib/dal/auth";
import { PageSpinner, EmptyState, Avatar, Spinner } from "@/components/ui";
import type { Challenge, ChallengeGoal, ChallengeProgress } from "@/lib/types";

const GOALS: { value: ChallengeGoal; label: string; unit: string }[] = [
  { value: "reports", label: "Daily reports", unit: "reports" },
  { value: "habits", label: "Habit check-ins", unit: "habits" },
  { value: "hours", label: "Hours logged", unit: "hours" },
];

const goalMeta = (g: ChallengeGoal) => GOALS.find((x) => x.value === g) || GOALS[0];

function toDateInput(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function ChallengesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progressByChallenge, setProgressByChallenge] = useState<Record<string, ChallengeProgress[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<ChallengeGoal>("reports");
  const [target, setTarget] = useState("20");
  const today = new Date();
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const [startDate, setStartDate] = useState(toDateInput(today));
  const [endDate, setEndDate] = useState(toDateInput(in30));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [list, user] = await Promise.all([getGroupChallenges(id), getCurrentUser()]);
        setChallenges(list);
        setCurrentUserId(user?.id || null);
        const entries = await Promise.all(list.map((c) => getChallengeProgress(c.id).then((p) => [c.id, p] as const)));
        setProgressByChallenge(Object.fromEntries(entries));
      } catch (err) {
        console.error("Failed to load challenges", err);
        toast.error("Couldn't load challenges. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = Number(target);
    if (!title.trim() || !targetNum || targetNum <= 0) {
      toast.error("Add a title and a target greater than zero.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be after the start date.");
      return;
    }
    setSaving(true);
    try {
      const created = await createChallenge({
        group_id: id,
        title: title.trim(),
        description: description.trim(),
        goal_type: goalType,
        target: targetNum,
        start_date: startDate,
        end_date: endDate,
      });
      setChallenges((prev) => [created, ...prev]);
      const p = await getChallengeProgress(created.id);
      setProgressByChallenge((prev) => ({ ...prev, [created.id]: p }));
      setTitle(""); setDescription(""); setTarget("20"); setShowForm(false);
      toast.success("Challenge created!");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create the challenge. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (challengeId: string) => {
    if (!window.confirm("Delete this challenge?")) return;
    const prev = challenges;
    setChallenges((c) => c.filter((x) => x.id !== challengeId));
    try {
      await deleteChallenge(challengeId);
      toast.success("Challenge deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete the challenge.");
      setChallenges(prev);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/groups/${id}`} className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Group
          </Link>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Challenges</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>Time-boxed goals to rally the group.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary flex-shrink-0"><Plus className="w-4 h-4" /> New</button>
      </motion.div>

      {showForm && (
        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 30-day consistency sprint" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this challenge about?" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Goal</label>
            <div className="flex gap-2 flex-wrap">
              {GOALS.map((g) => (
                <button key={g.value} type="button" onClick={() => setGoalType(g.value)}
                  className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: goalType === g.value ? "var(--color-accent-glow)" : "var(--color-bg-tertiary)", border: `1px solid ${goalType === g.value ? "var(--color-accent-primary)" : "var(--color-border-default)"}`, color: goalType === g.value ? "var(--color-accent-primary)" : "var(--color-text-secondary)" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Target ({goalMeta(goalType).unit})</label>
              <input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? <span className="inline-flex items-center gap-2"><Spinner size="sm" onAccent /> Creating...</span> : "Create challenge"}
          </button>
        </motion.form>
      )}

      {challenges.length === 0 ? (
        <EmptyState emoji="🏁" title="No challenges yet" description="Kick off a time-boxed goal to get the whole group moving in the same direction." />
      ) : (
        <div className="space-y-6">
          {challenges.map((c, i) => {
            const meta = goalMeta(c.goal_type);
            const progress = progressByChallenge[c.id] || [];
            const daysLeft = differenceInCalendarDays(parseISO(c.end_date), new Date());
            const ended = daysLeft < 0;
            const finishers = progress.filter((p) => p.progress >= c.target).length;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-6">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <TargetIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-accent-primary)" }} />
                    <h2 className="text-base font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{c.title}</h2>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: ended ? "var(--color-bg-tertiary)" : "var(--color-accent-glow)", color: ended ? "var(--color-text-muted)" : "var(--color-accent-primary)" }}>
                      {ended ? "Ended" : daysLeft === 0 ? "Last day" : `${daysLeft}d left`}
                    </span>
                    {c.created_by === currentUserId && (
                      <button onClick={() => handleDelete(c.id)} aria-label="Delete challenge" className="p-1 rounded-md" style={{ color: "var(--color-text-muted)" }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {c.description && <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>{c.description}</p>}
                <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
                  Goal: {c.target} {meta.unit} · {format(parseISO(c.start_date), "MMM d")} – {format(parseISO(c.end_date), "MMM d")}
                  {finishers > 0 && <span style={{ color: "var(--color-accent-primary)" }}> · 🏆 {finishers} finished</span>}
                </p>

                <div className="space-y-3">
                  {progress.map((p) => {
                    const pct = Math.min(100, Math.round((p.progress / c.target) * 100));
                    const done = p.progress >= c.target;
                    return (
                      <div key={p.user_id} className="flex items-center gap-3">
                        <Avatar src={p.avatar_url} name={p.full_name} size="sm" className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                              {done && "🏆 "}{p.full_name}
                            </span>
                            <span style={{ color: "var(--color-text-muted)" }}>{p.progress % 1 === 0 ? p.progress : p.progress.toFixed(1)}/{c.target}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-tertiary)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: done ? "var(--color-success)" : "linear-gradient(90deg, var(--color-accent-primary), #06b6d4)" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
