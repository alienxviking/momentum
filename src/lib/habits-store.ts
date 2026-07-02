"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Habit, HeatmapDay } from "@/lib/types";

export interface HabitsCache {
  habits: Habit[];
  heatmap: HeatmapDay[];
}

interface HabitsState {
  data: HabitsCache | null;
  setData: (data: HabitsCache) => void;
  clear: () => void;
}

/**
 * Caches the habits page (list + heatmap) so revisits render instantly, then
 * revalidate. `skipHydration` keeps SSR and first client render in sync — the
 * page calls `rehydrate()` on mount.
 */
export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
      clear: () => set({ data: null }),
    }),
    { name: "momentum-habits", skipHydration: true }
  )
);
