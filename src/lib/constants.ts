// ============================================================================
// Momentum — App Constants
// ============================================================================

export const APP_NAME = "Momentum";
export const APP_DESCRIPTION =
  "Track progress together, stay accountable, and achieve your goals with friends.";

export const MOOD_EMOJIS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😫", label: "Terrible" },
  2: { emoji: "😕", label: "Bad" },
  3: { emoji: "😐", label: "Okay" },
  4: { emoji: "😊", label: "Good" },
  5: { emoji: "🔥", label: "Amazing" },
};

export const REACTION_CONFIG: Record<
  string,
  { emoji: string; label: string; color: string }
> = {
  great_job: { emoji: "🎉", label: "Great Job", color: "#22c55e" },
  consistent: { emoji: "🔄", label: "Consistent", color: "#3b82f6" },
  impressive: { emoji: "⭐", label: "Impressive", color: "#f59e0b" },
  needs_improvement: {
    emoji: "💪",
    label: "Needs Improvement",
    color: "#ef4444",
  },
};

export const GROUP_CATEGORIES: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  study: { label: "Study", icon: "📚", color: "#059669" },
  fitness: { label: "Fitness", icon: "💪", color: "#ef4444" },
  coding: { label: "Coding", icon: "💻", color: "#3b82f6" },
  startup: { label: "Startup", icon: "🚀", color: "#f59e0b" },
  creative: { label: "Creative", icon: "🎨", color: "#ec4899" },
  wellness: { label: "Wellness", icon: "🧘", color: "#059669" },
  other: { label: "Other", icon: "📌", color: "#6b7280" },
};

export const HABIT_CATEGORIES = [
  { value: "health", label: "Health & Fitness", icon: "💪" },
  { value: "study", label: "Study & Learning", icon: "📚" },
  { value: "productivity", label: "Productivity", icon: "⚡" },
  { value: "mindfulness", label: "Mindfulness", icon: "🧘" },
  { value: "creative", label: "Creative", icon: "🎨" },
  { value: "social", label: "Social", icon: "👥" },
  { value: "finance", label: "Finance", icon: "💰" },
  { value: "other", label: "Other", icon: "📌" },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/groups", label: "Groups", icon: "Users" },
  { href: "/habits", label: "Habits", icon: "Target" },
  { href: "/progress", label: "Progress", icon: "TrendingUp" },
  { href: "/reviews", label: "Reviews", icon: "MessageSquare" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/notifications", label: "Notifications", icon: "Bell" },
];
