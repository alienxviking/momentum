"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Target, TrendingUp, MessageSquare,
  BarChart3, Bell, ChevronLeft, ChevronRight, LogOut,
  Menu, X,
} from "lucide-react";
import { getCurrentUser, signOut } from "@/lib/dal/auth";
import { getUnreadCount, maybeCreateDailyReminder } from "@/lib/dal/notifications";
import { ensureWeeklyReviews } from "@/lib/dal/weekly";
import { joinGroupByInvite } from "@/lib/dal/groups";
import { useUserStore } from "@/lib/user-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo-mark";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  // Once per app load: hydrate the cached profile, run background generators
  // (fire-and-forget, off the critical path), and complete any pending invite.
  useEffect(() => {
    useUserStore.persist.rehydrate();

    void maybeCreateDailyReminder();
    void ensureWeeklyReviews().finally(() => {
      // Reflect any freshly-created notification in the badge.
      getUnreadCount().then(setUnreadCount).catch(() => {});
    });

    let pendingInvite: string | null = null;
    try {
      pendingInvite = localStorage.getItem("pendingInvite");
    } catch {
      // ignore storage errors
    }
    if (pendingInvite) {
      localStorage.removeItem("pendingInvite");
      joinGroupByInvite(pendingInvite)
        .then((groupId) => {
          toast.success("You've joined the group!");
          router.push(`/groups/${groupId}`);
        })
        .catch((e) => {
          if (!(e instanceof Error && e.message === "Already a member")) {
            console.error("Failed to complete pending invite", e);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revalidate the cached profile + unread count in the background on each view.
  // The shell renders instantly from cache while this runs.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getCurrentUser(), getUnreadCount()])
      .then(([currentUser, count]) => {
        if (cancelled) return;
        if (currentUser) setUser(currentUser);
        setUnreadCount(count);
      })
      .catch((err) => console.error("Failed to refresh dashboard shell", err));
    return () => {
      cancelled = true;
    };
  }, [pathname, setUser]);

  const handleLogout = async () => {
    try {
      clearUser();
      await signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-primary)" }}>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "var(--color-overlay)" }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: collapsed ? "72px" : "256px" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <LogoMark className="w-6 h-6" />
              <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Momentum</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 flex items-center justify-center mx-auto">
              <LogoMark className="w-6 h-6" />
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden lg:flex p-1 rounded-md transition-colors" style={{ color: "var(--color-text-muted)" }}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="lg:hidden p-1" style={{ color: "var(--color-text-muted)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                title={collapsed ? item.label : undefined}>
                <div className="relative">
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: "var(--color-danger)" }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
          <Link href="/profile" className="sidebar-link" onClick={() => setMobileOpen(false)}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="avatar avatar-sm font-semibold" style={{ background: "linear-gradient(135deg, #059669, #06b6d4)", color: "white" }}>
                {getInitials(user?.full_name || "User")}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{user?.full_name || "Loading..."}</div>
                <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>@{user?.username || "username"}</div>
              </div>
            )}
          </Link>
          <button className="sidebar-link w-full mt-1" onClick={handleLogout}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-30"
          style={{ background: "var(--color-topbar-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderColor: "var(--color-border-subtle)" }}>
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="lg:hidden p-2 rounded-lg" style={{ color: "var(--color-text-secondary)" }}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/notifications" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"} className="relative p-2 rounded-lg transition-colors" style={{ color: "var(--color-text-secondary)" }}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "var(--color-danger)" }} />
              )}
            </Link>
            <Link href="/profile" className="avatar avatar-md font-semibold" style={{ background: "linear-gradient(135deg, #059669, #06b6d4)", color: "white" }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(user?.full_name || "User")
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
