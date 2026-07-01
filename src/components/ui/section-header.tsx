import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface SectionHeaderProps {
  title: string;
  /** Optional "View all →" style link. */
  link?: { label: string; href: string };
  className?: string;
}

/** The repeated "section title + View all →" row used across dashboard cards. */
export function SectionHeader({ title, link, className }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className ?? ""}`}>
      <h2
        className="text-base font-semibold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>
      {link && (
        <Link
          href={link.href}
          className="text-xs font-medium flex items-center gap-1 transition-colors"
          style={{ color: "var(--color-accent-primary)" }}
        >
          {link.label} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
