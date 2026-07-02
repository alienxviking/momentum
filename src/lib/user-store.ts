"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

/**
 * Caches the signed-in user's profile in localStorage so the shell (avatar,
 * name, username) renders instantly across navigations, then revalidates in the
 * background. `skipHydration` keeps SSR and first client render in sync — the
 * layout calls `rehydrate()` on mount.
 */
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: "momentum-user", skipHydration: true }
  )
);
