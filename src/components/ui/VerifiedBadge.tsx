import type { ReactElement } from "react";
import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md";
}

export default function VerifiedBadge({ size = "md" }: VerifiedBadgeProps): ReactElement {
  const classes =
    size === "sm"
      ? "gap-1.5 rounded-sm px-2 py-1 text-[0.68rem]"
      : "gap-2 rounded-sm px-3 py-1.5 text-xs";
  const iconSize = size === "sm" ? 13 : 15;

  return (
    <span
      className={`inline-flex items-center bg-accent font-body font-bold text-[var(--color-bg)] shadow-sm ${classes}`}
    >
      <ShieldCheck size={iconSize} strokeWidth={2.4} aria-hidden="true" />
      Verified
    </span>
  );
}
