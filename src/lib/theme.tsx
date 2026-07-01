"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "momentum-theme";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Reads the theme already resolved by the no-flash script in the document head.
 * The script runs before paint, so `data-theme` is authoritative on first render.
 */
function getInitialTheme(): Theme {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") return attr;
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Keep <html data-theme> and localStorage in sync whenever theme changes.
  // Skip the very first run so we don't animate the initial (already-correct) theme.
  const first = useRef(true);
  useEffect(() => {
    const root = document.documentElement;
    if (first.current) {
      first.current = false;
    } else {
      // Briefly enable color transitions just for the toggle.
      root.classList.add("theme-transitioning");
      window.setTimeout(() => root.classList.remove("theme-transitioning"), 400);
    }
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable (private mode) — non-fatal */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/**
 * Blocking script injected into <head> so the correct theme is applied before
 * the first paint — prevents the flash-of-wrong-theme on hard refresh.
 * Reads the saved preference, falling back to the OS `prefers-color-scheme`.
 */
export const themeInitScript = `(function(){try{var k='${STORAGE_KEY}';var s=localStorage.getItem(k);var t=s==='light'||s==='dark'?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;
