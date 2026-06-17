import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: authUser.email || "",
    username: profile.username || "",
    full_name: profile.full_name || "",
    avatar_url: profile.avatar_url || "",
    bio: profile.bio || "",
    accountability_score: profile.accountability_score || 50,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

export async function updateProfile(
  data: Partial<{ full_name: string; username: string; bio: string; avatar_url: string }>
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) throw error;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) throw updateError;

  return publicUrl;
}
