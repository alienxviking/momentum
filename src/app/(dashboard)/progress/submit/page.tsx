"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X, Upload, Check, ImageIcon, ChevronDown } from "lucide-react";
import { MOOD_EMOJIS } from "@/lib/constants";
import { getMyGroups } from "@/lib/dal/groups";
import { submitReport } from "@/lib/dal/reports";
import type { Group } from "@/lib/types";

export default function SubmitReportPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [hours, setHours] = useState(4);
  const [mood, setMood] = useState(3);
  const [productivity, setProductivity] = useState(7);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState([{ id: "1", text: "", completed: false }]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchingGroups, setFetchingGroups] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const myGroups = await getMyGroups();
        setGroups(myGroups);
        if (myGroups.length > 0) {
          setSelectedGroup(myGroups[0].id);
        }
      } catch (err) {
        console.error("Failed to load user groups", err);
      } finally {
        setFetchingGroups(false);
      }
    }
    loadGroups();
  }, []);

  const addTask = () => setTasks([...tasks, { id: Date.now().toString(), text: "", completed: false }]);
  const removeTask = (id: string) => setTasks(tasks.filter((t) => t.id !== id));
  const updateTask = (id: string, text: string) => setTasks(tasks.map((t) => t.id === id ? { ...t, text } : t));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) {
      setError("Please select a group to submit this report to.");
      return;
    }

    setLoading(true);
    setError("");

    // Filter out empty tasks
    const validTasks = tasks.filter((t) => t.text.trim() !== "");

    try {
      await submitReport({
        group_id: selectedGroup,
        hours_worked: hours,
        tasks_completed: validTasks,
        notes,
        mood_rating: mood,
        productivity_rating: productivity,
        evidenceFiles,
      });
      router.push("/progress");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit report. Please try again.");
      setLoading(false);
    }
  };

  if (fetchingGroups) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/progress" className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Progress
        </Link>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Submit Daily Report</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>Log your progress for today.</p>
      </motion.div>

      {groups.length === 0 ? (
        <div className="glass-card p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>No Group Joined</h2>
          <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--color-text-secondary)" }}>
            Daily reports are shared inside accountability groups. You must create or join a group before submitting a report.
          </p>
          <Link href="/groups" className="btn-primary inline-block">Go to Groups</Link>
        </div>
      ) : (
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Select Group</label>
            <div className="relative">
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="input-field appearance-none pr-10" required>
                {groups.map((group) => (
                  <option key={group.id} value={group.id} className="bg-neutral-900">{group.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
            </div>
          </div>

          {/* Hours */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Hours Worked: <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{hours}h</span></label>
            <input type="range" min={0} max={16} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, var(--color-accent-primary) ${(hours / 16) * 100}%, var(--color-bg-tertiary) ${(hours / 16) * 100}%)` }} />
          </div>

          {/* Tasks */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Tasks Completed</label>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                    className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                    style={{ background: task.completed ? "var(--color-success)" : "transparent", borderColor: task.completed ? "var(--color-success)" : "var(--color-border-default)" }}>
                    {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <input type="text" value={task.text} onChange={(e) => updateTask(task.id, e.target.value)} placeholder="What did you accomplish?" className="input-field flex-1" />
                  {tasks.length > 1 && (
                    <button type="button" onClick={() => removeTask(task.id)} className="p-2 rounded-lg" style={{ color: "var(--color-text-muted)" }}><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addTask} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--color-accent-primary)" }}>
                <Plus className="w-3 h-3" /> Add Task
              </button>
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Mood</label>
            <div className="flex gap-3">
              {Object.entries(MOOD_EMOJIS).map(([key, val]) => (
                <button key={key} type="button" onClick={() => setMood(Number(key))}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all flex-1"
                  style={{ background: mood === Number(key) ? "var(--color-accent-glow)" : "var(--color-bg-tertiary)", border: `1px solid ${mood === Number(key) ? "var(--color-accent-primary)" : "var(--color-border-default)"}` }}>
                  <span className="text-2xl">{val.emoji}</span>
                  <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>{val.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Productivity */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Productivity Rating: <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{productivity}/10</span></label>
            <input type="range" min={1} max={10} value={productivity} onChange={(e) => setProductivity(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, var(--color-success) ${((productivity - 1) / 9) * 100}%, var(--color-bg-tertiary) ${((productivity - 1) / 9) * 100}%)` }} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did your day go? What did you learn?" className="input-field" rows={4} required />
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Attach Evidence (Optional)</label>
            <div className="border-2 border-dashed rounded-xl p-4 transition-all relative overflow-hidden" style={{ borderColor: "var(--color-border-default)", background: "var(--color-bg-tertiary)" }}>
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={(e) => {
                  if (e.target.files) {
                    setEvidenceFiles([...evidenceFiles, ...Array.from(e.target.files)]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <ImageIcon className="w-8 h-8" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
                  Drag & drop or click to upload screenshots
                </p>
              </div>
            </div>
            
            {evidenceFiles.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {evidenceFiles.map((file, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--color-border-subtle)" }}>
                    {file.type.startsWith("image/") ? (
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/50 text-xs font-bold text-white">
                        VIDEO
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setEvidenceFiles(evidenceFiles.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3" style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? "Submitting Report..." : "Submit Report"}
          </button>
        </motion.form>
      )}
    </div>
  );
}
