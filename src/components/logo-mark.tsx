"use client";

import { useId } from "react";

/**
 * Momentum "Ascent" brand mark — rising chevrons in an emerald→cyan gradient.
 * Matches the favicon (src/app/icon.svg). Size via the `className` (e.g. "w-6 h-6").
 * A slightly deeper emerald start keeps it legible on both dark and light themes.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="12" y1="4" x2="12" y2="20">
          <stop offset="0" stopColor="#059669" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11 L12 4 L20 11" />
        <path d="M4 20 L12 13 L20 20" />
      </g>
    </svg>
  );
}
