"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Users, Search, Key } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyGroups, joinGroupByInvite } from "@/lib/dal/groups";
import { GROUP_CATEGORIES } from "@/lib/constants";
import type { Group } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function loadGroups() {
      try {
        const myGroups = await getMyGroups();
        setGroups(myGroups);
      } catch (err) {
        console.error("Error loading groups", err);
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, []);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setJoining(true);
    setJoinError("");
    setJoinSuccess("");

    try {
      const groupId = await joinGroupByInvite(inviteCode.trim());
      setJoinSuccess("Successfully joined group!");
      setInviteCode("");
      // Refresh groups list
      const myGroups = await getMyGroups();
      setGroups(myGroups);
    } catch (err: any) {
      setJoinError(err.message || "Failed to join group.");
    } finally {
      setJoining(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Groups</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>Join or create accountability groups</p>
        </div>
        <Link href="/groups/create" className="btn-primary"><Plus className="w-4 h-4" /> Create Group</Link>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
          </div>
        </motion.div>

        {/* Join by Invite Code */}
        <motion.form initial="hidden" animate="visible" variants={fadeUp} custom={1.5} onSubmit={handleJoinByCode} className="flex gap-3 max-w-sm">
          <div className="relative flex-1">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Invite code..." value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="input-field pl-11" required />
          </div>
          <button type="submit" disabled={joining} className="btn-secondary whitespace-nowrap">
            {joining ? "Joining..." : "Join Group"}
          </button>
        </motion.form>
      </div>

      {joinError && (
        <div className="p-4 rounded-xl text-sm max-w-md" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
          {joinError}
        </div>
      )}
      {joinSuccess && (
        <div className="p-4 rounded-xl text-sm max-w-md" style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>
          {joinSuccess}
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="glass-card p-16 text-center space-y-5 max-w-2xl mx-auto mt-4">
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl" style={{ background: "rgba(5, 150, 105, 0.1)" }}>👥</div>
          <h3 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>No groups found</h3>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {search ? "No groups match your search criteria." : "You haven't joined any accountability groups yet. Create a group or join one with an invite code."}
          </p>
          {!search && (
            <Link href="/groups/create" className="btn-primary inline-flex gap-2"><Plus className="w-4 h-4" /> Create Group</Link>
          )}
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredGroups.map((group, i) => {
            const cat = GROUP_CATEGORIES[group.category] || GROUP_CATEGORIES.other;
            return (
              <motion.div key={group.id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 2}>
                <Link href={`/groups/${group.id}`} className="glass-card p-6 block">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${cat.color}20` }}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-base font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{group.name}</h3>
                        <span className="badge badge-purple" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.label}</span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-3 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{group.description}</p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {group.member_count} members</span>
                        <span>{group.is_public ? "🌐 Public" : "🔒 Private"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
