"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

export interface ChartTheme {
  grid: string;
  axis: string;
  tooltip: {
    backgroundColor: string;
    border: string;
    borderRadius: string;
    color: string;
    fontSize: string;
    boxShadow: string;
  };
}

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Resolves Recharts styling from the live CSS theme tokens so charts follow the
 * dark/light toggle instead of using hardcoded colors.
 */
export function useChartTheme(): ChartTheme {
  const { theme } = useTheme();
  const [t, setT] = useState<ChartTheme>(() => compute());

  useEffect(() => {
    // Must run post-commit: compute() reads resolved CSS custom properties from
    // the DOM, which only reflect the new theme after the attribute is applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setT(compute());
  }, [theme]);

  return t;
}

function compute(): ChartTheme {
  const border = readVar("--color-border-default", "#1c3329");
  const muted = readVar("--color-text-muted", "#6b8579");
  const elevated = readVar("--color-bg-elevated", "#14241d");
  const text = readVar("--color-text-primary", "#f0fdf4");
  return {
    grid: border,
    axis: muted,
    tooltip: {
      backgroundColor: elevated,
      border: `1px solid ${border}`,
      borderRadius: "12px",
      color: text,
      fontSize: "12px",
      boxShadow: "var(--shadow-elevated)",
    },
  };
}
