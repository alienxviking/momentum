"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./card";
import { CountUp } from "./count-up";
import { ProgressRing } from "./progress-ring";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const },
  }),
};

export interface StatCardProps {
  label: string;
  /** Numeric value to count up to. */
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Trailing decoration (e.g. a 🔥 emoji). */
  extra?: React.ReactNode;
  icon?: React.ReactNode;
  color: string;
  accent: "emerald" | "green" | "orange" | "blue";
  /** Optional progress ring instead of the icon tile. */
  ring?: { value: number; max: number; color: string };
  /** Stagger index for the entrance animation. */
  index?: number;
}

export function StatCard({
  label,
  value,
  decimals,
  prefix,
  suffix,
  extra,
  icon,
  color,
  accent,
  ring,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={index}>
      <GlassCard accent={accent} className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
              {label}
            </p>
            <div className="flex items-center">
              <span className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
              </span>
              {extra}
            </div>
          </div>
          {ring ? (
            <ProgressRing value={ring.value} max={ring.max} color={ring.color} />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}20`, color }}
            >
              {icon}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
