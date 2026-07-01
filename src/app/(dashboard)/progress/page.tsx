"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Clock, CheckCircle2, MessageSquare, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getReports, addReaction, uploadAdditionalEvidence } from "@/lib/dal/reports";
import { MOOD_EMOJIS } from "@/lib/constants";
import type { DailyReport, Reaction } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon } from "lucide-react";
import { PageSpinner, EmptyState, Avatar } from "@/components/ui";
import { toast } from "sonner";

export default function ProgressPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploadingEvidenceId, setUploadingEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
        
        const data = await getReports();
        setReports(data);
      } catch (err) {
        console.error("Failed to load reports", err);
        toast.error("Couldn't load progress reports. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLike = async (reportId: string) => {
    if (!currentUserId) return;
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;
    const hadLiked = (report.reactions || []).some(
      (r) => r.reaction_type === "great_job" && r.user_id === currentUserId
    );

    // Optimistic toggle — update instantly, sync in the background.
    const applyToggle = (list: DailyReport[], add: boolean) =>
      list.map((r) => {
        if (r.id !== reportId) return r;
        const existing = r.reactions || [];
        const reactions = add
          ? [
              ...existing,
              {
                id: `optimistic-${currentUserId}-great_job`,
                report_id: reportId,
                user_id: currentUserId,
                reaction_type: "great_job",
                created_at: new Date().toISOString(),
              } as Reaction,
            ]
          : existing.filter(
              (x) => !(x.user_id === currentUserId && x.reaction_type === "great_job")
            );
        return { ...r, reactions };
      });

    setReports((prev) => applyToggle(prev, !hadLiked));

    try {
      await addReaction(reportId, "great_job");
    } catch (err) {
      console.error("Failed to like report", err);
      setReports((prev) => applyToggle(prev, hadLiked));
      toast.error("Couldn't react to this report. Please try again.");
    }
  };

  const handleUploadAdditionalEvidence = async (reportId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingEvidenceId(reportId);
    try {
      await uploadAdditionalEvidence(reportId, Array.from(files));
      const data = await getReports();
      setReports(data);
      toast.success("Evidence added!");
    } catch (err) {
      console.error("Failed to upload evidence", err);
      toast.error("Couldn't upload evidence. Please try again.");
    } finally {
      setUploadingEvidenceId(null);
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Progress Reports</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>View and submit daily progress reports</p>
        </div>
        <Link href="/progress/submit" className="btn-primary"><Plus className="w-4 h-4" /> Submit Report</Link>
      </motion.div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <EmptyState
            emoji="📈"
            title="No progress reports yet"
            description="Share what you worked on, log your productivity hours, checklist tasks, and receive feedback from group members."
            action={{ label: "Submit First Report", href: "/progress/submit" }}
          />
        ) : (
          reports.map((report, i) => {
            const mood = MOOD_EMOJIS[report.mood_rating] || { emoji: "😐", label: "Neutral" };
            const completedCount = report.tasks_completed.filter((t) => t.completed).length;
            const totalTasks = report.tasks_completed.length;
            // Count total thumbs up reactions
            const likesCount = report.reactions?.filter((r) => r.reaction_type === "great_job").length || 0;
            const hasLiked = report.reactions?.some((r) => r.reaction_type === "great_job" && r.user_id === currentUserId);

            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <Avatar src={report.user?.avatar_url} name={report.user?.full_name} size="lg" className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{report.user?.full_name}</span>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{new Date(report.report_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {report.hours_worked}h worked</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {completedCount}/{totalTasks} tasks</span>
                      <span>Mood: {mood.emoji} {mood.label}</span>
                      <span>Productivity: {report.productivity_rating}/10</span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>{report.notes}</p>
                    {/* Tasks */}
                    {totalTasks > 0 && (
                      <div className="space-y-1.5 pl-2 border-l-2 border-emerald-500/30">
                        {report.tasks_completed.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-xs">
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                              style={task.completed ? { background: "var(--color-success)", color: "white" } : { border: "1px solid var(--color-border-default)" }}>
                              {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <span style={{ color: "var(--color-text-secondary)", textDecoration: task.completed ? "line-through" : "none" }}>{task.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Evidence */}
                    {(report.evidence && report.evidence.length > 0) && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                        {report.evidence.map((ev, idx) => (
                          <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--color-border-subtle)" }}>
                            {ev.file_type?.startsWith("image/") ? (
                              <a href={ev.file_url} target="_blank" rel="noopener noreferrer">
                                <img src={ev.file_url} alt="Evidence" className="w-full h-full object-cover" />
                              </a>
                            ) : (
                              <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center text-xs font-bold text-white text-center p-1" style={{ background: "var(--color-overlay)" }}>
                                VIDEO
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleLike(report.id)} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: hasLiked ? "var(--color-success)" : "var(--color-text-muted)" }}>
                          <ThumbsUp className="w-3.5 h-3.5" /> Like ({likesCount})
                        </button>
                        <Link href="/reviews" className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: "var(--color-accent-primary)" }}>
                          <MessageSquare className="w-3.5 h-3.5" /> Comments ({report.comments?.length || 0})
                        </Link>
                      </div>

                      {currentUserId === report.user_id && (
                        <div className="relative">
                          {uploadingEvidenceId === report.id ? (
                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Uploading...</span>
                          ) : (
                            <>
                              <input 
                                type="file" 
                                id={`evidence-upload-${report.id}`} 
                                className="hidden" 
                                multiple 
                                accept="image/*,video/*" 
                                onChange={(e) => handleUploadAdditionalEvidence(report.id, e.target.files)} 
                              />
                              <label htmlFor={`evidence-upload-${report.id}`} className="cursor-pointer flex items-center gap-1 text-xs font-medium transition-colors hover:text-emerald-400" style={{ color: "var(--color-text-secondary)" }}>
                                <ImageIcon className="w-3.5 h-3.5" /> Add Proof
                              </label>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
