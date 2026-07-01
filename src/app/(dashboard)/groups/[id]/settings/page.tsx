"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { getGroupById, updateGroup, deleteGroup } from "@/lib/dal/groups";
import { getCurrentUser } from "@/lib/dal/auth";
import { PageSpinner, Spinner } from "@/components/ui";
import type { Group } from "@/lib/types";

export default function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function loadGroup() {
      try {
        const [currentGroup, user] = await Promise.all([
          getGroupById(id),
          getCurrentUser()
        ]);

        if (currentGroup && user) {
          setIsOwner(currentGroup.created_by === user.id);
          setGroup(currentGroup);
          setName(currentGroup.name);
          setDescription(currentGroup.description);
          setRules(currentGroup.rules);
          setIsPublic(currentGroup.is_public);
        }
      } catch (err) {
        console.error("Failed to load group for settings", err);
        toast.error("Couldn't load group settings. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadGroup();
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateGroup(id, {
        name,
        description,
        rules,
        is_public: isPublic,
      });
      setSuccess("Settings saved successfully!");
      toast.success("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to update group. Please try again.");
      toast.error("Failed to update group. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGroup(id);
      toast.success("Group deleted.");
      router.push("/groups");
    } catch (err) {
      console.error(err);
      setError("Failed to delete group. Please try again.");
      toast.error("Failed to delete group. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Group not found</h2>
        <Link href="/groups" className="btn-primary">Back to Groups</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href={`/groups/${id}`} className="flex items-center gap-2 text-sm font-medium mb-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Group
        </Link>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Group Settings</h1>
      </motion.div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>
          {success}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Group Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`input-field ${!isOwner && 'opacity-70 cursor-not-allowed'}`} disabled={!isOwner} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`input-field ${!isOwner && 'opacity-70 cursor-not-allowed'}`} rows={3} disabled={!isOwner} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Rules</label>
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} className={`input-field ${!isOwner && 'opacity-70 cursor-not-allowed'}`} rows={3} disabled={!isOwner} />
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => isOwner && setIsPublic(!isPublic)} className={`w-10 h-6 rounded-full transition-all relative ${isOwner ? 'hover:opacity-80 hover:ring-2 hover:ring-offset-2 hover:ring-[var(--color-accent-primary)] hover:ring-offset-[var(--color-bg-primary)] focus:outline-none cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            style={{ background: isPublic ? "var(--color-accent-primary)" : "var(--color-bg-tertiary)" }}>
            <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform" style={{ left: isPublic ? "22px" : "4px" }} />
          </button>
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{isPublic ? "Public group" : "Private (invite only)"}</span>
        </div>
        {isOwner && (
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
            {saving ? <><Spinner size="sm" onAccent /> Saving Changes...</> : "Save Changes"}
          </button>
        )}
      </motion.div>

      {isOwner && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-6" style={{ borderColor: "var(--color-danger)" }}>
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-danger)" }}>Danger Zone</h3>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>Deleting a group is irreversible. All data will be lost.</p>
        <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-[var(--color-danger)] bg-[var(--color-danger-soft)] border border-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-danger)] focus:ring-offset-[var(--color-bg-primary)]">
          Delete Group
        </button>
      </motion.div>
      )}

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setShowDeleteModal(false)}
            className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            style={{ background: "var(--color-overlay)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-md p-6 overflow-hidden relative shadow-2xl"
              style={{ border: "1px solid var(--color-border-subtle)" }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Delete Group?</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    Are you absolutely sure you want to delete <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{name}</span>? This action is irreversible and all data, members, and habits associated with this group will be permanently lost.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5" 
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-danger)] focus:ring-offset-[var(--color-bg-primary)]"
                  style={{ background: "var(--color-danger)", color: "white", opacity: deleting ? 0.7 : 1 }}
                >
                  {deleting ? "Deleting..." : "Yes, Delete Group"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
