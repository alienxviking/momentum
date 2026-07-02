import { createClient } from "@/lib/supabase/client";
import type { Group, User } from "@/lib/types";

export async function getMyGroups(): Promise<Group[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get group IDs the user is a member of
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (!groups) return [];

  // Get member counts
  const groupsWithCounts: Group[] = await Promise.all(
    groups.map(async (g) => {
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", g.id);

      return {
        id: g.id,
        name: g.name,
        description: g.description || "",
        purpose: g.purpose || "",
        rules: g.rules || "",
        category: g.category || "other",
        invite_code: g.invite_code || "",
        is_public: g.is_public,
        created_by: g.created_by,
        created_at: g.created_at,
        updated_at: g.updated_at,
        member_count: count || 0,
      };
    })
  );

  return groupsWithCounts;
}

export async function getGroupById(id: string): Promise<Group | null> {
  const supabase = createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (!group) return null;

  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", id);

  return {
    id: group.id,
    name: group.name,
    description: group.description || "",
    purpose: group.purpose || "",
    rules: group.rules || "",
    category: group.category || "other",
    invite_code: group.invite_code || "",
    is_public: group.is_public,
    created_by: group.created_by,
    created_at: group.created_at,
    updated_at: group.updated_at,
    member_count: count || 0,
  };
}

export async function getGroupMembers(groupId: string): Promise<User[]> {
  const supabase = createClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, profiles(*)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (!members) return [];

  return members.map((m) => {
    const p = m.profiles as unknown as Record<string, unknown> | null;
    return {
      id: (p?.id as string) || m.user_id,
      email: "",
      username: (p?.username as string) || "",
      full_name: (p?.full_name as string) || "",
      avatar_url: (p?.avatar_url as string) || "",
      bio: (p?.bio as string) || "",
      accountability_score: (p?.accountability_score as number) || 50,
      created_at: (p?.created_at as string) || "",
      updated_at: (p?.updated_at as string) || "",
    };
  });
}

export async function createGroup(data: {
  name: string;
  description: string;
  purpose: string;
  rules: string;
  category: string;
  is_public: boolean;
}): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name: data.name,
      description: data.description,
      purpose: data.purpose,
      rules: data.rules,
      category: data.category,
      is_public: data.is_public,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw error;

  // Add creator as admin member
  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "admin",
  });

  return group.id;
}

export async function updateGroup(
  id: string,
  data: Partial<{ name: string; description: string; rules: string; is_public: boolean }>
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("groups")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGroup(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw error;
}

export async function joinGroupByInvite(inviteCode: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: groupId, error } = await supabase
    .rpc("join_group_by_invite_code", { invite_code_param: inviteCode });

  if (error) {
    if (error.message.includes("Already a member")) {
      throw new Error("Already a member");
    }
    if (error.message.includes("Invalid invite code")) {
      throw new Error("Invalid invite code");
    }
    throw error;
  }

  return groupId as string;
}
