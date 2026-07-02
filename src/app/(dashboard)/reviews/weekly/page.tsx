"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, addDays, parseISO } from "date-fns";
import { ArrowLeft, Clock, CheckCircle2, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { getWeeklyReviews, updateWeeklyReviewText } from "@/lib/dal/weekly";
import { PageSpinner, EmptyState, Spinner } from "@/components/ui";
import type { WeeklyReview } from "@/lib/types";

export default function WeeklyReviewPage() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWeeklyReviews();
        setReviews(data);
        setDrafts(Object.fromEntries(data.map((r) => [r.id, r.review_text || ""])));
      } catch (err) {
        console.error("Failed to load weekly reviews", err);
        toast.error("Couldn't load your weekly reviews. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (id: string) => {
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      await updateWeeklyReviewText(id, drafts[id] ?? "");
      setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, review_text: drafts[id] ?? "" } : r)));
      toast.success("Reflection saved.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save your reflection. Please try again.");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  if (loading) return <PageSpinner />;

  const weekLabel = (weekStart: string) => {
    const start = parseISO(weekStart);
    const end = addDays(start, 6);
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/reviews" className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Reviews
        </Link>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Weekly Review</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Reflect on your completed weeks and set the tone for the next one.
        </p>
      </motion.div>

      {reviews.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="No weekly reviews yet"
          description="Your first recap appears after a full week in a group. Keep logging your progress!"
        />
      ) : (
        <div className="space-y-6">
          {reviews.map((review, i) => {
            const trendUp = review.streak_change >= 0;
            const cards = [
              { label: "Hours logged", value: `${review.total_hours}h`, icon: <Clock className="w-4 h-4" />, color: "#3b82f6" },
              { label: "Habits done", value: `${review.habits_completed}`, sub: `${review.habits_missed} missed`, icon: <CheckCircle2 className="w-4 h-4" />, color: "#059669" },
              { label: "Group rank", value: `#${review.group_ranking}`, icon: <Trophy className="w-4 h-4" />, color: "#f59e0b" },
              {
                label: "vs last week",
                value: `${trendUp ? "+" : ""}${review.streak_change}`,
                sub: "active days",
                icon: trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
                color: trendUp ? "#059669" : "#ef4444",
              },
            ];
            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{review.group_name}</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{weekLabel(review.week_start)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {cards.map((c) => (
                    <div key={c.label} className="rounded-xl p-3" style={{ background: "var(--color-bg-tertiary)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${c.color}20`, color: c.color }}>
                        {c.icon}
                      </div>
                      <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{c.value}</p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{c.sub || c.label}</p>
                    </div>
                  ))}
                </div>

                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  Your reflection
                </label>
                <textarea
                  value={drafts[review.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                  placeholder="What went well? What will you change next week?"
                  className="input-field"
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleSave(review.id)}
                    disabled={saving[review.id] || (drafts[review.id] ?? "") === (review.review_text ?? "")}
                    className="btn-primary text-sm"
                    style={{ opacity: saving[review.id] || (drafts[review.id] ?? "") === (review.review_text ?? "") ? 0.6 : 1 }}
                  >
                    {saving[review.id] && <Spinner size="sm" onAccent />}
                    {saving[review.id] ? "Saving..." : "Save reflection"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
