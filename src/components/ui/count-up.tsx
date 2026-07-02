"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

export interface CountUpProps {
  value: number;
  /** Animation duration in seconds. */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Animates a number from 0 → value on mount (and on value change).
 * Honors prefers-reduced-motion by snapping straight to the final value.
 */
export function CountUp({
  value,
  duration = 1,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setAnimated(v),
    });
    return () => controls.stop();
  }, [value, duration, reduced]);

  // When motion is reduced, snap straight to the final value (no state churn).
  const display = reduced ? value : animated;

  return (
    <span className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
