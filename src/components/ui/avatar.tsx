import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "avatar-sm",
  md: "avatar-md",
  lg: "avatar-lg",
  xl: "avatar-xl",
} as const;

const pxSize = { sm: 28, md: 36, lg: 48, xl: 64 } as const;

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizeClass;
  className?: string;
}

/**
 * Single source of truth for user avatars — image when available, otherwise
 * initials on the brand gradient. Replaces the 4+ hardcoded copies.
 */
export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "User avatar"}
        width={pxSize[size]}
        height={pxSize[size]}
        className={cn(sizeClass[size], "rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      aria-label={name || "User"}
      className={cn("avatar", sizeClass[size], "font-semibold", className)}
      style={{ background: "var(--gradient-brand)", color: "white" }}
    >
      {initials(name)}
    </div>
  );
}
