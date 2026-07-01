"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { GROUP_CATEGORIES } from "@/lib/constants";
import { Spinner } from "@/components/ui";
import { createGroup } from "@/lib/dal/groups";

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [rules, setRules] = useState("");
  const [category, setCategory] = useState("study");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const groupId = await createGroup({
        name,
        description,
        purpose,
        rules,
        category,
        is_public: isPublic,
      });
      toast.success("Group created!");
      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create group. Please try again.");
      toast.error("Failed to create group. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/groups" className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </Link>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Create a Group</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>Start an accountability group for your goals.</p>
      </motion.div>
      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Group Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 100 Days of Code" className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Object.entries(GROUP_CATEGORIES).map(([key, val]) => (
              <button key={key} type="button" onClick={() => setCategory(key)}
                className="p-3 rounded-xl text-sm font-medium flex flex-col items-center gap-1 transition-all"
                style={{ background: category === key ? `${val.color}20` : "var(--color-bg-tertiary)", border: `1px solid ${category === key ? val.color : "var(--color-border-default)"}`, color: category === key ? val.color : "var(--color-text-secondary)" }}>
                <span className="text-xl">{val.icon}</span>
                {val.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this group about?" className="input-field" rows={3} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Purpose / Goal</label>
          <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Clear UPSC 2026" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Rules</label>
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="One rule per line..." className="input-field" rows={3} />
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setIsPublic(!isPublic)} className="w-10 h-6 rounded-full transition-colors relative"
            style={{ background: isPublic ? "var(--color-accent-primary)" : "var(--color-bg-tertiary)" }}>
            <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform" style={{ left: isPublic ? "22px" : "4px" }} />
          </button>
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{isPublic ? "Public group" : "Private (invite only)"}</span>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3" style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? <><Spinner size="sm" onAccent /> Creating...</> : "Create Group"}
        </button>
      </motion.form>
    </div>
  );
}
