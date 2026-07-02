"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DashboardStats, Habit, Group, DailyReport } from "@/lib/types";

export interface DashboardCache {
  stats: DashboardStats | null;
  habits: Habit[];
  groups: Group[];
  recentReports: DailyReport[];
  onboarding: { hasGroup: boolean; hasHabit: boolean; hasReport: boolean } | null;
}

interface DashboardState {
  data: DashboardCache | null;
  setData: (data: DashboardCache) => void;
  clear: () => void;
}

/**
 * Caches the composed dashboard view so revisits render immediately instead of
 * flashing the skeleton, then revalidate in the background. `skipHydration` keeps
 * SSR and first client render in sync — the page calls `rehydrate()` on mount.
 */
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
      clear: () => set({ data: null }),
    }),
    { name: "momentum-dashboard", skipHydration: true }
  )
);
