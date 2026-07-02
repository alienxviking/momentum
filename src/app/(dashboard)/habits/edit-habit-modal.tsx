"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HABIT_CATEGORIES } from "@/lib/constants";
import { updateHabit, deleteHabit } from "@/lib/dal/habits";
import { Spinner } from "@/components/ui";
import type { Habit } from "@/lib/types";

const COLORS = ["#059669", "#047857", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#f97316", "#06b6d4"];
const ICONS = ["✅", "📚", "💪", "🧘", "💻", "📖", "⏰", "🏃", "🎨", "💰"];

interface Props {
  habit: Habit;
  onClose: () => void;
  onSaved: (habit: Habit) => void;
  onDeleted: (id: string) => void;
}

export function EditHabitModal({ habit, onClose, onSaved, onDeleted }: Props) {
  const [name, setName] = useState(habit.name);
  const [category, setCategory] = useState(habit.category || "health");
  const [frequency, setFrequency] = useState<string>(habit.frequency || "daily");
  const [color, setColor] = useState(habit.color || COLORS[0]);
  const [icon, setIcon] = useState(habit.icon || ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateHabit(habit.id, { name, category, frequency, color, icon });
      onSaved({ ...habit, name, category, frequency: frequency as Habit["frequency"], color, icon });
      toast.success("Habit updated!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update the habit. Please try again.");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteHabit(habit.id);
      onDeleted(habit.id);
      toast.success("Habit deleted. Your history is kept.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete the habit. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--color-overlay)" }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Edit habit</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: "var(--color-text-muted)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Habit Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
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
                  style={{ background: c, border: color === c ? "3px solid var(--color-bg-card)" : "3px solid transparent", boxShadow: color === c ? `0 0 0 2px ${c}, 0 0 10px ${c}` : "none" }} />
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? <span className="inline-flex items-center gap-2"><Spinner size="sm" onAccent /> Saving...</span> : "Save changes"}
          </button>
        </form>

        <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          {confirmDelete ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Delete this habit? Your history stays.</span>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="btn-danger text-xs" style={{ opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-danger)" }}>
              <Trash2 className="w-4 h-4" /> Delete habit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
