import Image from "next/image";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  /** Sizing and text size for the circle, e.g. "h-8 w-8 text-xs". */
  className?: string;
  initials: string;
  /** The verification dot and anything else that sits outside the circle. */
  children?: ReactNode;
  sizes?: string;
}

/**
 * The photo when there is one, initials when there is not.
 *
 * The clipping sits on an inner layer rather than the circle itself, so a badge
 * positioned outside the edge is not cropped away by `overflow-hidden`.
 */
export default function UserAvatar({
  avatarUrl,
  className,
  initials,
  children,
  sizes = "64px",
}: UserAvatarProps): ReactElement {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-primary font-body font-bold text-white",
        className,
      )}
    >
      {avatarUrl ? (
        // Inherits the outer radius, so a square-ish avatar clips to its own shape
        <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <Image
            src={avatarUrl}
            alt=""
            fill
            unoptimized
            sizes={sizes}
            className="object-cover"
          />
        </span>
      ) : (
        initials
      )}
      {children}
    </span>
  );
}
