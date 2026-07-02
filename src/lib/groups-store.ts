"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Group } from "@/lib/types";

interface GroupsState {
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  clearGroups: () => void;
}

/**
 * Caches the user's groups list so /groups and the dashboard render it instantly
 * from localStorage, then revalidate in the background. `skipHydration` keeps SSR
 * and first client render in sync — consumers call `rehydrate()` on mount.
 */
export const useGroupsStore = create<GroupsState>()(
  persist(
    (set) => ({
      groups: [],
      setGroups: (groups) => set({ groups }),
      clearGroups: () => set({ groups: [] }),
    }),
    { name: "momentum-groups", skipHydration: true }
  )
);
