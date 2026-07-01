import { GROUP_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "w-8 h-8 text-base rounded-lg",
  md: "w-10 h-10 text-lg rounded-xl",
  lg: "w-12 h-12 text-2xl rounded-2xl",
} as const;

/**
 * Renders a group category's emoji on a tinted square, sourced from the
 * GROUP_CATEGORIES config instead of inline ternaries scattered across pages.
 */
export function CategoryIcon({
  category,
  size = "md",
  className,
}: {
  category: string;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const config = GROUP_CATEGORIES[category] ?? GROUP_CATEGORIES.other;
  return (
    <div
      aria-hidden
      className={cn("flex items-center justify-center flex-shrink-0", sizeMap[size], className)}
      style={{ background: `${config.color}20`, color: config.color }}
    >
      {config.icon}
    </div>
  );
}
