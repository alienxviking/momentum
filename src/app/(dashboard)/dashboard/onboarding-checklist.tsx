"use client";

import Link from "next/link";
import { Users, Target, TrendingUp, Check, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui";

export interface OnboardingStatus {
  hasGroup: boolean;
  hasHabit: boolean;
  hasReport: boolean;
}

const steps = [
  {
    key: "hasGroup",
    title: "Join or create a group",
    desc: "Accountability works better together.",
    cta: "Browse groups",
    href: "/groups",
    icon: Users,
  },
  {
    key: "hasHabit",
    title: "Add your first habit",
    desc: "Track something you want to do every day.",
    cta: "Add a habit",
    href: "/habits/create",
    icon: Target,
  },
  {
    key: "hasReport",
    title: "Log your first progress",
    desc: "Share today's work with your group.",
    cta: "Log progress",
    href: "/progress/submit",
    icon: TrendingUp,
  },
] as const;

export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const done = steps.filter((s) => status[s.key]).length;
  // Fully set up — nothing to show.
  if (done === steps.length) return null;

  // The first incomplete step is the one to emphasize.
  const activeIndex = steps.findIndex((s) => !status[s.key]);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
          Get started with Momentum
        </h2>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          {done} of {steps.length} done
        </span>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
        Three quick steps to set up your accountability loop.
      </p>

      <div className="h-1.5 rounded-full mb-5 overflow-hidden" style={{ background: "var(--color-bg-tertiary)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${(done / steps.length) * 100}%`,
            background: "linear-gradient(90deg, var(--color-accent-primary), #06b6d4)",
          }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          const complete = status[step.key];
          const active = i === activeIndex;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: active ? "var(--color-accent-glow)" : "var(--color-bg-tertiary)",
                opacity: complete ? 0.65 : 1,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: complete ? "var(--color-success)" : "var(--color-bg-elevated)",
                  color: complete ? "white" : "var(--color-text-muted)",
                }}
              >
                {complete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-primary)", textDecoration: complete ? "line-through" : "none" }}
                >
                  {step.title}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{step.desc}</p>
              </div>
              {!complete && (
                <Link
                  href={step.href}
                  className={`${active ? "btn-primary" : "btn-secondary"} text-xs`}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {step.cta} <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
