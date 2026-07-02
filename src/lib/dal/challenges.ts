import { createClient } from "@/lib/supabase/client";
import type { Challenge, ChallengeGoal, ChallengeProgress } from "@/lib/types";

export async function getGroupChallenges(groupId: string): Promise<Challenge[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("group_id", groupId)
    .order("end_date", { ascending: false });
  return (data || []) as Challenge[];
}

export async function createChallenge(data: {
  group_id: string;
  title: string;
  description: string;
  goal_type: ChallengeGoal;
  target: number;
  start_date: string;
  end_date: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: row, error } = await supabase
    .from("challenges")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return row as Challenge;
}

export async function deleteChallenge(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("challenges").delete().eq("id", id);
  if (error) throw error;
}

export async function getChallengeProgress(challengeId: string): Promise<ChallengeProgress[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_challenge_progress", { cid: challengeId });
  if (error || !data) return [];
  return (data as ChallengeProgress[]).map((r) => ({
    user_id: r.user_id,
    full_name: r.full_name || "",
    avatar_url: r.avatar_url || "",
    progress: Number(r.progress) || 0,
  }));
}
