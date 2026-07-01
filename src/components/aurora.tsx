import { cn } from "@/lib/utils";

/**
 * Ambient gradient-blob backdrop for hero/header areas. Purely decorative,
 * pointer-events disabled, low opacity so it reads as subtle depth in both
 * themes. Drifts gently unless reduced-motion is set (handled globally).
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="aurora-blob absolute -top-24 left-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #059669, transparent 70%)", opacity: 0.18 }}
      />
      <div
        className="aurora-blob absolute top-10 right-1/4 w-[24rem] h-[24rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", opacity: 0.14, animationDelay: "-4s" }}
      />
      <div
        className="aurora-blob absolute -bottom-24 left-1/3 w-[20rem] h-[20rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)", opacity: 0.08, animationDelay: "-8s" }}
      />
    </div>
  );
}
