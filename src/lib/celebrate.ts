// Lightweight confetti burst — no dependency, no canvas library.
// Spawns short-lived DOM particles animated via the Web Animations API and
// cleans them up automatically. Safe to call from event handlers.

const COLORS = ["#059669", "#10b981", "#06b6d4", "#f59e0b", "#f97316"];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Fire a confetti burst.
 * @param origin Optional {x, y} in viewport pixels (defaults to screen center-top).
 * @param count Number of particles.
 */
export function celebrate(
  origin?: { x: number; y: number },
  count = 28
): void {
  if (typeof document === "undefined" || prefersReducedMotion()) return;

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 3;

  const container = document.createElement("div");
  container.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999;`;
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 6;
    const color = COLORS[i % COLORS.length];
    const round = Math.random() > 0.5;
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};border-radius:${round ? "50%" : "2px"};will-change:transform,opacity;`;
    container.appendChild(p);

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
    const velocity = 120 + Math.random() * 180;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 80; // bias upward
    const rotate = (Math.random() - 0.5) * 720;
    const duration = 700 + Math.random() * 600;

    p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy + 140}px) rotate(${rotate}deg)`,
          opacity: 0,
        },
      ],
      { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    );
  }

  window.setTimeout(() => container.remove(), 1400);
}
