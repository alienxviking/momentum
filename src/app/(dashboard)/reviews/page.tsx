"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Send, ThumbsUp } from "lucide-react";
import { getReports, addComment, addReaction } from "@/lib/dal/reports";
import { getCurrentUser } from "@/lib/dal/auth";
import { MOOD_EMOJIS, REACTION_CONFIG } from "@/lib/constants";
import { ReactionType, DailyReport, User } from "@/lib/types";

export default function ReviewsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  async function loadData() {
    try {
      const [reportsData, userData] = await Promise.all([
        getReports(),
        getCurrentUser()
      ]);
      setReports(reportsData);
      setCurrentUser(userData);
    } catch (err) {
      console.error("Failed to load reviews data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleReaction = async (reportId: string, type: ReactionType) => {
    if (!REACTION_CONFIG[type]) return;

    try {
      await addReaction(reportId, type);
      // Reload reports to display update
      const reportsData = await getReports();
      setReports(reportsData);
    } catch (err) {
      console.error("Failed to add reaction", err);
    }
  };

  const handleAddComment = async (reportId: string) => {
    const text = commentText[reportId];
    if (!text || !text.trim()) return;

    setSubmittingComment(prev => ({ ...prev, [reportId]: true }));
    try {
      await addComment(reportId, text.trim(), "general");
      setCommentText(prev => ({ ...prev, [reportId]: "" }));
      // Reload reports
      const reportsData = await getReports();
      setReports(reportsData);
    } catch (err) {
      console.error("Failed to submit comment", err);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [reportId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Peer Reviews</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>Review your group members&apos; progress and give feedback</p>
      </motion.div>

      <div className="space-y-8">
        {reports.length === 0 ? (
          <div className="glass-card p-12 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            No progress reports available in your groups yet. Join a group or submit your own report!
          </div>
        ) : (
          reports.map((report, i) => {
            const mood = MOOD_EMOJIS[report.mood_rating] || { emoji: "😐", label: "Neutral" };
            const comments = report.comments || [];
            
            // Map reaction emojis to reaction type keys
            const reportReactions = report.reactions || [];
            const userReactions = reportReactions
              .filter(r => r.user_id === currentUser?.id)
              .map(r => (r as any).reaction_type);

            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  {report.user?.avatar_url ? (
                    <img src={report.user.avatar_url} alt={report.user.full_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="avatar avatar-lg flex-shrink-0 font-semibold" style={{ background: `hsl(${(i * 73 + 30) % 360}, 60%, 50%)`, color: "white" }}>
                      {report.user?.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{report.user?.full_name}</span>
                      <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>{new Date(report.report_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {report.hours_worked}h</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {report.tasks_completed.filter((t) => t.completed).length}/{report.tasks_completed.length} tasks</span>
                      <span>{mood.emoji} {mood.label}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{report.notes}</p>

                {/* Tasks */}
                {report.tasks_completed.length > 0 && (
                  <div className="space-y-1 pl-2 border-l-2 border-emerald-500/30">
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
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                    {report.evidence.map((ev, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--color-border-subtle)" }}>
                        {ev.file_type?.startsWith("image/") ? (
                          <a href={ev.file_url} target="_blank" rel="noopener noreferrer">
                            <img src={ev.file_url} alt="Evidence" className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center bg-black/50 text-xs font-bold text-white text-center p-1">
                            VIDEO
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                  {Object.entries(REACTION_CONFIG).map(([key, config]) => {
                    const isActive = userReactions.includes(key);
                    const count = reportReactions.filter(r => ((r as any).reaction_type) === key).length;
                    return (
                      <button key={key} onClick={() => handleToggleReaction(report.id, key as ReactionType)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-85"
                        style={{ background: isActive ? `${config.color}20` : "var(--color-bg-tertiary)", border: `1px solid ${isActive ? config.color : "var(--color-border-default)"}`, color: isActive ? config.color : "var(--color-text-secondary)" }}>
                        {config.emoji} {config.label} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>

                {/* Comments */}
                {comments.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {comments.map((comment) => (
                      <div key={comment.id}>
                        <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
                          {comment.user?.avatar_url ? (
                            <img src={comment.user.avatar_url} alt={comment.user.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="avatar avatar-sm flex-shrink-0 font-semibold" style={{ background: "var(--color-accent-primary)", color: "white" }}>
                              {comment.user?.full_name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{comment.user?.full_name}</span>
                              {comment.feedback_type !== "general" && (
                                <span className="badge badge-accent text-[10px]">{comment.feedback_type?.replace(/_/g, " ")}</span>
                              )}
                            </div>
                            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{comment.content}</p>
                          </div>
                        </div>
                        {/* Replies */}
                        {comment.replies?.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-2 p-3 rounded-xl ml-8 mt-2" style={{ background: "var(--color-bg-tertiary)" }}>
                            {reply.user?.avatar_url ? (
                              <img src={reply.user.avatar_url} alt={reply.user.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="avatar avatar-sm flex-shrink-0 font-semibold" style={{ background: "#06b6d4", color: "white" }}>
                                {reply.user?.full_name?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{reply.user?.full_name}</span>
                              <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <form onSubmit={(e) => { e.preventDefault(); handleAddComment(report.id); }} className="flex items-center gap-2">
                  <input type="text" value={commentText[report.id] || ""} onChange={(e) => setCommentText({ ...commentText, [report.id]: e.target.value })}
                    placeholder="Leave feedback..." className="input-field flex-1 text-sm" required />
                  <button type="submit" disabled={submittingComment[report.id]} className="btn-primary p-2.5">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
