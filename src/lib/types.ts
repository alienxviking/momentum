// ============================================================================
// Momentum — TypeScript Type Definitions
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  accountability_score: number;
  reminders_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  purpose: string;
  rules: string;
  category: GroupCategory;
  invite_code: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  members?: GroupMember[];
}

export type GroupCategory =
  | "study"
  | "fitness"
  | "coding"
  | "startup"
  | "creative"
  | "wellness"
  | "other";

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  user?: User;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  frequency: "daily" | "weekly";
  color: string;
  icon: string;
  start_date: string;
  is_active: boolean;
  created_at: string;
  streak?: number;
  completed_today?: boolean;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  is_completed: boolean;
  note?: string;
  created_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  group_id: string;
  report_date: string;
  hours_worked: number;
  tasks_completed: TaskItem[];
  notes: string;
  mood_rating: 1 | 2 | 3 | 4 | 5;
  productivity_rating: number;
  created_at: string;
  updated_at: string;
  user?: User;
  evidence?: EvidenceUpload[];
  reactions?: Reaction[];
  comments?: Comment[];
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface EvidenceUpload {
  id: string;
  report_id: string;
  user_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  created_at: string;
}

export type ReactionType =
  | "great_job"
  | "consistent"
  | "impressive"
  | "needs_improvement";

export interface Reaction {
  id: string;
  report_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
  user?: User;
}

export interface Comment {
  id: string;
  report_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  feedback_type: FeedbackType;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

export type FeedbackType =
  | "what_went_well"
  | "what_can_improve"
  | "tomorrows_goal"
  | "general";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export type NotificationType =
  | "friend_progress"
  | "comment"
  | "habit_missed"
  | "weekly_review"
  | "streak_risk"
  | "reaction"
  | "group_invite";

export interface WeeklyReview {
  id: string;
  user_id: string;
  group_id: string;
  week_start: string;
  total_hours: number;
  habits_completed: number;
  habits_missed: number;
  streak_change: number;
  group_ranking: number;
  review_text?: string;
  created_at: string;
  group_name?: string;
}

export interface AccountabilityScore {
  id: string;
  user_id: string;
  score: number;
  factors: {
    daily_submissions: number;
    habit_consistency: number;
    goal_completion: number;
    peer_review_participation: number;
    missed_commitments: number;
  };
  recorded_at: string;
}

// Dashboard stats
export interface DashboardStats {
  current_streak: number;
  habits_completed_today: number;
  total_habits_today: number;
  tasks_completed_today: number;
  total_tasks_today: number;
  weekly_consistency: number;
  accountability_score: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  streak: number;
  consistency: number;
  badge?: "top_performer" | "most_improved" | "longest_streak";
}

// Heatmap data
export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}
