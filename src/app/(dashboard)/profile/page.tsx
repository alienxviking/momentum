"use client";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { getCurrentUser, updateProfile, uploadAvatar } from "@/lib/dal/auth";
import { getDashboardStats } from "@/lib/dal/analytics";
import { Flame, Target, TrendingUp, Calendar, Camera, Loader2 } from "lucide-react";
import type { User, DashboardStats } from "@/lib/types";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const [currentUser, dashboardStats] = await Promise.all([
          getCurrentUser(),
          getDashboardStats(),
        ]);
        if (currentUser) {
          setUser(currentUser);
          setFullName(currentUser.full_name);
          setUsername(currentUser.username);
          setBio(currentUser.bio || "");
        }
        setStats(dashboardStats);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile({
        full_name: fullName,
        username,
        bio,
      });
      setSuccess("Profile updated successfully!");
      // Update local user state
      if (user) {
        setUser({ ...user, full_name: fullName, username, bio });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    setSuccess("");

    try {
      const publicUrl = await uploadAvatar(file);
      if (user) {
        setUser({ ...user, avatar_url: publicUrl });
      }
      setSuccess("Profile picture updated successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload profile picture.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Failed to load profile</h2>
      </div>
    );
  }

  const activeStats = stats || {
    accountability_score: 50,
    current_streak: 0,
    weekly_consistency: 0,
    total_habits_today: 0,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          
          <div 
            className="relative group cursor-pointer flex-shrink-0" 
            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
            />
            
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold" style={{ background: "linear-gradient(135deg, #059669, #06b6d4)", color: "white" }}>
                {user.full_name[0]?.toUpperCase()}
              </div>
            )}
            
            {/* Edit Overlay */}
            <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity ${uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: "var(--color-text-primary)" }}>{user.full_name}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>@{user.username}</p>
            <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>{user.bio || "No bio set."}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <Calendar className="w-3 h-3" /> Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Accountability Score", value: user.accountability_score, icon: <Target className="w-5 h-5" />, color: "#059669" },
          { label: "Current Streak", value: `${activeStats.current_streak}d`, icon: <Flame className="w-5 h-5" />, color: "#f97316" },
          { label: "Weekly Consistency", value: `${activeStats.weekly_consistency}%`, icon: <TrendingUp className="w-5 h-5" />, color: "#059669" },
          { label: "Habits Active", value: activeStats.total_habits_today, icon: <Target className="w-5 h-5" />, color: "#3b82f6" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{stat.value}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Edit Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input-field" rows={3} placeholder="Tell us about yourself..." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
