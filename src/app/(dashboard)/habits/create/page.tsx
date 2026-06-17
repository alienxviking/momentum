"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { HABIT_CATEGORIES } from "@/lib/constants";
import { createHabit } from "@/lib/dal/habits";

const COLORS = ["#059669", "#047857", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#f97316", "#06b6d4"];
const ICONS = ["✅", "📚", "💪", "🧘", "💻", "📖", "⏰", "🏃", "🎨", "💰"];

export default function CreateHabitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("health");
  const [frequency, setFrequency] = useState("daily");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createHabit({
        name,
        category,
        frequency,
        color,
        icon,
      });
      router.push("/habits");
    } catch (err) {
      console.error(err);
      setError("Failed to create habit. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/habits" className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Habits
        </Link>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Create a Habit</h1>
      </motion.div>
      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Habit Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Read 20 pages" className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {HABIT_CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className="p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all"
                style={{ background: category === cat.value ? "var(--color-accent-glow)" : "var(--color-bg-tertiary)", border: `1px solid ${category === cat.value ? "var(--color-accent-primary)" : "var(--color-border-default)"}`, color: category === cat.value ? "var(--color-accent-primary)" : "var(--color-text-secondary)" }}>
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Frequency</label>
          <div className="flex gap-2">
            {["daily", "weekly"].map((f) => (
              <button key={f} type="button" onClick={() => setFrequency(f)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
                style={{ background: frequency === f ? "var(--color-accent-glow)" : "var(--color-bg-tertiary)", border: `1px solid ${frequency === f ? "var(--color-accent-primary)" : "var(--color-border-default)"}`, color: frequency === f ? "var(--color-accent-primary)" : "var(--color-text-secondary)" }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Icon</label>
          <div className="flex gap-2 flex-wrap">
            {ICONS.map((ic) => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all"
                style={{ background: icon === ic ? "var(--color-accent-glow)" : "var(--color-bg-tertiary)", border: `1px solid ${icon === ic ? "var(--color-accent-primary)" : "var(--color-border-default)"}` }}>
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-all"
                style={{ background: c, border: color === c ? "3px solid white" : "3px solid transparent", boxShadow: color === c ? `0 0 10px ${c}` : "none" }} />
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3" style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? "Creating..." : "Create Habit"}
        </button>
      </motion.form>
    </div>
  );
}
