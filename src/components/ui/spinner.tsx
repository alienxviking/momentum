import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-4",
} as const;

export function Spinner({
  size = "md",
  className,
  onAccent = false,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
  /** Use a white spinner on colored/accent backgrounds (e.g. inside a primary button). */
  onAccent?: boolean;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "rounded-full animate-spin",
        sizeMap[size],
        onAccent
          ? "border-white/30 border-t-white"
          : "border-emerald-500/20 border-t-emerald-500",
        className
      )}
    />
  );
}

/** Full-height centered spinner — replaces the copied loading blocks across pages. */
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}
