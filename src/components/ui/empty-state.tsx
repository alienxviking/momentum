import Link from "next/link";
import { GlassCard } from "./card";

export interface EmptyStateProps {
  /** Decorative emoji shown in the tinted circle. */
  emoji: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}

/** Shared empty-state block — dedupes the copied emoji/heading/CTA template. */
export function EmptyState({
  emoji,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <GlassCard className={`p-12 text-center space-y-5 ${className ?? ""}`}>
      <div
        aria-hidden
        className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl"
        style={{ background: "var(--color-accent-glow)" }}
      >
        {emoji}
      </div>
      <h3 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h3>
      <p
        className="text-sm max-w-sm mx-auto"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {description}
      </p>
      {action && (
        <Link href={action.href} className="btn-primary inline-flex">
          {action.label}
        </Link>
      )}
    </GlassCard>
  );
}
