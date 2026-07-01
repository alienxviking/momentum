import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder block. Uses theme tokens so it works in both themes.
 * Compose these to mirror the shape of the content being loaded.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("skeleton rounded-lg", className)}
      style={{ backgroundColor: "var(--color-bg-tertiary)" }}
    />
  );
}

/** A glass-card-shaped skeleton, optionally with stacked text lines. */
export function SkeletonCard({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("glass-card p-6 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          // last line shorter, for a natural paragraph feel
        />
      ))}
    </div>
  );
}
