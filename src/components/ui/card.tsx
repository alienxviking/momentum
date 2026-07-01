import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds spring lift + pointer cursor for clickable cards. */
  interactive?: boolean;
  /** Top accent bar color. */
  accent?: "emerald" | "green" | "orange" | "blue";
}

const accentClass: Record<NonNullable<GlassCardProps["accent"]>, string> = {
  emerald: "stat-card stat-card-emerald",
  green: "stat-card stat-card-green",
  orange: "stat-card stat-card-orange",
  blue: "stat-card stat-card-blue",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive, accent, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card",
          interactive && "glass-card-interactive",
          accent && accentClass[accent],
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";
