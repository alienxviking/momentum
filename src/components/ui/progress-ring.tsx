export interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color: string;
}

/**
 * Circular progress indicator. Promoted from the inline copy in the dashboard
 * so analytics, habits, and stat cards can all share it.
 */
export function ProgressRing({
  value,
  max,
  size = 56,
  stroke = 5,
  color,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? (value / max) * circumference : 0;
  return (
    <svg width={size} height={size} className="transform -rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-bg-tertiary)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        className="transition-all duration-1000"
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      />
    </svg>
  );
}
