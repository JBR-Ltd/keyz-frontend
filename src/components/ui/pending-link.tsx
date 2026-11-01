"use client";

import Link, { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

type LinkProps = ComponentProps<typeof Link>;

interface PendingLinkProps extends Omit<LinkProps, "children"> {
  children: ReactNode;
  pendingLabel: string;
  pendingClassName?: string;
}

/**
 * Drop-in replacement for `<Link>` that swaps its content for a spinner and
 * pending label while Next.js loads the destination route. Mirrors the
 * visual language of `AsyncButtonContent` so navigation and submission
 * feedback match.
 */
export function PendingLink({
  children,
  className,
  pendingClassName,
  pendingLabel,
  ...rest
}: PendingLinkProps): ReactElement {
  return (
    <Link className={className} {...rest}>
      <PendingLinkContent
        pendingClassName={pendingClassName}
        pendingLabel={pendingLabel}
      >
        {children}
      </PendingLinkContent>
    </Link>
  );
}

interface PendingLinkContentProps {
  children: ReactNode;
  pendingClassName?: string;
  pendingLabel: string;
}

function PendingLinkContent({
  children,
  pendingClassName,
  pendingLabel,
}: PendingLinkContentProps): ReactElement {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-busy={pending || undefined}
      className={cn(
        "grid min-w-0 grid-cols-1 grid-rows-1 place-items-center",
        pendingClassName,
      )}
    >
      <span
        aria-hidden={pending}
        className={cn(
          "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
          pending && "invisible",
        )}
      >
        {children}
      </span>
      <span
        aria-hidden={!pending}
        aria-live={pending ? "polite" : undefined}
        className={cn(
          "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
          !pending && "invisible",
        )}
        role={pending ? "status" : undefined}
      >
        <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" />
        <span className="truncate">{pendingLabel}</span>
      </span>
    </span>
  );
}

interface PendingIconSwapProps {
  children: ReactNode;
  className?: string;
  size?: number;
}

/**
 * Renders its children normally, and swaps them for an inline spinner while
 * the surrounding `<Link>` is loading. Use inside a Link's children when the
 * layout must stay put (sidebar rows, menus) rather than being replaced.
 */
export function PendingIconSwap({
  children,
  className,
  size = 18,
}: PendingIconSwapProps): ReactElement {
  const { pending } = useLinkStatus();

  if (!pending) {
    return <>{children}</>;
  }

  return (
    <Loader2
      aria-label="Loading"
      size={size}
      className={cn("shrink-0 animate-spin text-accent-alt", className)}
    />
  );
}
