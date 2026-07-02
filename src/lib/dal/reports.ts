import { createClient } from "@/lib/supabase/client";
import type { DailyReport, Comment, EvidenceUpload, FeedbackType, ReactionType } from "@/lib/types";

// Evidence lives in a private bucket; rows store the storage path in `file_url`.
// Signed URLs are short-lived so evidence isn't publicly reachable.
const EVIDENCE_URL_TTL = 60 * 60; // 1 hour

// Shapes of the raw joined rows returned by Supabase selects below.
interface RawComment {
  id: string;
  report_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  feedback_type: FeedbackType | null;
  created_at: string;
  updated_at: string;
  profiles: unknown;
}

interface RawReaction {
  id: string;
  report_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export async function getReports(groupId?: string): Promise<DailyReport[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("daily_reports")
    .select("*, profiles(*), reactions(*), comments(*, profiles(*)), evidence_uploads(*)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data: reports } = await query;
  if (!reports) return [];

  const mapped = reports.map((r) => {
    const p = r.profiles as Record<string, unknown>;
    
    const rawComments = (r.comments || []) as RawComment[];
    const parentComments = rawComments.filter((c) => !c.parent_id);
    const commentReplies = rawComments.filter((c) => c.parent_id);

    const commentsList = parentComments.map((c) => {
      const cp = c.profiles as Record<string, unknown>;
      const replies = commentReplies
        .filter((rep) => rep.parent_id === c.id)
        .map((reply) => {
          const rp = reply.profiles as Record<string, unknown>;
          return {
            id: reply.id,
            report_id: reply.report_id,
            user_id: reply.user_id,
            parent_id: reply.parent_id ?? undefined,
            content: reply.content,
            feedback_type: reply.feedback_type || "general",
            created_at: reply.created_at,
            updated_at: reply.updated_at,
            user: rp
              ? {
                  id: (rp.id as string) || reply.user_id,
                  email: "",
                  username: (rp.username as string) || "",
                  full_name: (rp.full_name as string) || "",
                  avatar_url: (rp.avatar_url as string) || "",
                  bio: "",
                  accountability_score: 50,
                  created_at: "",
                  updated_at: "",
                }
              : undefined,
          };
        });

      return {
        id: c.id,
        report_id: c.report_id,
        user_id: c.user_id,
        content: c.content,
        feedback_type: c.feedback_type || "general",
        created_at: c.created_at,
        updated_at: c.updated_at,
        user: cp
          ? {
              id: (cp.id as string) || c.user_id,
              email: "",
              username: (cp.username as string) || "",
              full_name: (cp.full_name as string) || "",
              avatar_url: (cp.avatar_url as string) || "",
              bio: "",
              accountability_score: 50,
              created_at: "",
              updated_at: "",
            }
          : undefined,
        replies,
      };
    });

    const reactionsList = ((r.reactions || []) as RawReaction[]).map((rx) => ({
      id: rx.id,
      report_id: rx.report_id,
      user_id: rx.user_id,
      reaction_type: rx.reaction_type,
      created_at: rx.created_at,
    }));

    return {
      id: r.id,
      user_id: r.user_id,
      group_id: r.group_id,
      report_date: r.report_date,
      hours_worked: Number(r.hours_worked) || 0,
      tasks_completed: r.tasks_completed || [],
      notes: r.notes || "",
      mood_rating: r.mood_rating || 3,
      productivity_rating: r.productivity_rating || 5,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user: p
        ? {
            id: (p.id as string) || r.user_id,
            email: "",
            username: (p.username as string) || "",
            full_name: (p.full_name as string) || "",
            avatar_url: (p.avatar_url as string) || "",
            bio: (p.bio as string) || "",
            accountability_score: (p.accountability_score as number) || 50,
            created_at: (p.created_at as string) || "",
            updated_at: (p.updated_at as string) || "",
          }
        : undefined,
      reactions: reactionsList,
      comments: commentsList,
      evidence: (r.evidence_uploads || []) as EvidenceUpload[],
    };
  });

  // Replace stored storage paths with short-lived signed URLs for rendering.
  const paths = mapped
    .flatMap((r) => r.evidence ?? [])
    .map((e) => e.file_url)
    .filter(Boolean);

  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("evidence")
      .createSignedUrls(paths, EVIDENCE_URL_TTL);

    const urlByPath = new Map(
      (signed ?? [])
        .filter((s) => s.path && s.signedUrl)
        .map((s) => [s.path as string, s.signedUrl])
    );

    for (const r of mapped) {
      for (const e of r.evidence ?? []) {
        e.file_url = urlByPath.get(e.file_url) ?? e.file_url;
      }
    }
  }

  return mapped;
}

export async function submitReport(data: {
  group_id: string;
  hours_worked: number;
  tasks_completed: { id: string; text: string; completed: boolean }[];
  notes: string;
  mood_rating: number;
  productivity_rating: number;
  evidenceFiles?: File[];
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date().toISOString().split("T")[0];

  const { data: report, error } = await supabase.from("daily_reports").insert({
    user_id: user.id,
    group_id: data.group_id,
    report_date: today,
    hours_worked: data.hours_worked,
    tasks_completed: data.tasks_completed,
    notes: data.notes,
    mood_rating: data.mood_rating,
    productivity_rating: data.productivity_rating,
  }).select().single();

  if (error) throw error;

  if (data.evidenceFiles && data.evidenceFiles.length > 0 && report) {
    for (const file of data.evidenceFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(filePath, file);

      if (!uploadError) {
        // Store the storage path; signed URLs are generated at read time.
        await supabase.from("evidence_uploads").insert({
          report_id: report.id,
          user_id: user.id,
          file_url: filePath,
          file_type: file.type,
          file_name: file.name
        });
      } else {
        console.error("Failed to upload evidence file:", uploadError);
      }
    }
  }
}

export async function getReportComments(reportId: string): Promise<Comment[]> {
  const supabase = createClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("report_id", reportId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (!comments) return [];

  // Get replies
  const commentIds = comments.map((c) => c.id);
  const { data: replies } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .in("parent_id", commentIds)
    .order("created_at", { ascending: true });

  return comments.map((c) => {
    const p = c.profiles as Record<string, unknown>;
    const commentReplies = (replies || [])
      .filter((r) => r.parent_id === c.id)
      .map((r) => {
        const rp = r.profiles as Record<string, unknown>;
        return {
          id: r.id,
          report_id: r.report_id,
          user_id: r.user_id,
          parent_id: r.parent_id,
          content: r.content,
          feedback_type: r.feedback_type || "general",
          created_at: r.created_at,
          updated_at: r.updated_at,
          user: rp
            ? {
                id: (rp.id as string) || r.user_id,
                email: "",
                username: (rp.username as string) || "",
                full_name: (rp.full_name as string) || "",
                avatar_url: (rp.avatar_url as string) || "",
                bio: "",
                accountability_score: 50,
                created_at: "",
                updated_at: "",
              }
            : undefined,
        };
      });

    return {
      id: c.id,
      report_id: c.report_id,
      user_id: c.user_id,
      content: c.content,
      feedback_type: c.feedback_type || "general",
      created_at: c.created_at,
      updated_at: c.updated_at,
      user: p
        ? {
            id: (p.id as string) || c.user_id,
            email: "",
            username: (p.username as string) || "",
            full_name: (p.full_name as string) || "",
            avatar_url: (p.avatar_url as string) || "",
            bio: "",
            accountability_score: 50,
            created_at: "",
            updated_at: "",
          }
        : undefined,
      replies: commentReplies,
    };
  });
}

export async function addComment(
  reportId: string,
  content: string,
  feedbackType: string = "general"
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("comments").insert({
    report_id: reportId,
    user_id: user.id,
    content,
    feedback_type: feedbackType,
  });

  if (error) throw error;
}

export async function addReaction(reportId: string, reactionType: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Toggle: check if reaction exists
  const { data: existing, error } = await supabase
    .from("reactions")
    .select("id")
    .eq("report_id", reportId)
    .eq("user_id", user.id)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      report_id: reportId,
      user_id: user.id,
      reaction_type: reactionType,
    });
  }
}

export async function uploadAdditionalEvidence(reportId: string, files: File[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership
  const { data: report } = await supabase
    .from("daily_reports")
    .select("id, user_id")
    .eq("id", reportId)
    .single();

  if (!report || report.user_id !== user.id) {
    throw new Error("Unauthorized to add evidence to this report");
  }

  if (files && files.length > 0) {
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(filePath, file);

      if (!uploadError) {
        // Store the storage path; signed URLs are generated at read time.
        await supabase.from("evidence_uploads").insert({
          report_id: reportId,
          user_id: user.id,
          file_url: filePath,
          file_type: file.type,
          file_name: file.name
        });
      } else {
        console.error("Failed to upload evidence file:", uploadError);
      }
    }
  }
}
