"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, MessageSquare, Flame, BarChart3, Users, Star } from "lucide-react";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/dal/notifications";
import Link from "next/link";
import type { Notification } from "@/lib/types";

const typeIcons: Record<string, { icon: typeof Bell; color: string }> = {
  friend_progress: { icon: Users, color: "#3b82f6" },
  comment: { icon: MessageSquare, color: "#059669" },
  habit_missed: { icon: Flame, color: "#ef4444" },
  weekly_review: { icon: BarChart3, color: "#059669" },
  streak_risk: { icon: Flame, color: "#f97316" },
  reaction: { icon: Star, color: "#f59e0b" },
  group_invite: { icon: Users, color: "#06b6d4" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const unread = notifications.filter((n) => !n.is_read).length;

  async function loadNotifications() {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
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
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Notifications</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-xs"><CheckCheck className="w-4 h-4" /> Mark all read</button>
        )}
      </motion.div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="glass-card p-12 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            You have no notifications.
          </div>
        ) : (
          notifications.map((notif, i) => {
            const config = typeIcons[notif.type] || typeIcons.friend_progress;
            const Icon = config.icon;
            return (
              <motion.div key={notif.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="glass-card p-5 flex items-start gap-3"
                  style={{ opacity: notif.is_read ? 0.6 : 1 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${config.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{notif.title}</span>
                      {!notif.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--color-accent-primary)" }} />}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{notif.message}</p>
                    <span className="text-[10px] mt-1 block" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {!notif.is_read && (
                    <button onClick={() => handleMarkRead(notif.id)} className="p-1 rounded-md transition-colors hover:text-white" style={{ color: "var(--color-text-muted)" }}>
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
