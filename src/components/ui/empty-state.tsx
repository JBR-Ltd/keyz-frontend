import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

// === Types

/** The one obvious next step from an empty list, as a link or a button. */
export type EmptyStateAction =
  | { label: string; href: string }
  | { label: string; onClick: () => void };

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: EmptyStateAction;
  /**
   * "page" stands on its own with a dashed outline; "panel" sits inside a card that
   * already has a border; "compact" is a short row for small lists and dropdowns.
   */
  variant?: "page" | "panel" | "compact";
  /** "dark" for empty states on the primary-coloured cards. */
  tone?: "light" | "dark";
  className?: string;
}

// === Component

const ACTION_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 font-body text-sm font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function ActionControl({
  action,
  tone,
}: {
  action: EmptyStateAction;
  tone: "light" | "dark";
}): ReactElement {
  const className = cn(
    ACTION_CLASS,
    tone === "dark"
      ? "bg-accent text-primary hover:bg-white"
      : "bg-primary text-white hover:bg-accent hover:text-primary",
  );

  return "href" in action ? (
    <Link href={action.href} className={className}>
      {action.label}
    </Link>
  ) : (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

/** What a list shows when there is nothing in it yet: what belongs here, and how to get some. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "page",
  tone = "light",
  className,
}: EmptyStateProps): ReactElement {
  const isDark = tone === "dark";

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl px-4 py-4 text-left",
          isDark ? "bg-white/10" : "bg-surface-soft",
          className,
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isDark ? "bg-white/10 text-accent" : "bg-bg text-primary",
          )}
        >
          <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-body text-sm font-bold",
              isDark ? "text-white" : "text-primary",
            )}
          >
            {title}
          </p>
          {description ? (
            <p
              className={cn(
                "mt-0.5 font-body text-xs leading-5",
                isDark ? "text-white/65" : "text-muted",
              )}
            >
              {description}
            </p>
          ) : null}
          {action ? (
            <div className="mt-3">
              <ActionControl action={action} tone={tone} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid justify-items-center gap-3 px-6 text-center",
        variant === "page"
          ? cn(
              "rounded-2xl border border-dashed py-12",
              isDark ? "border-white/20" : "border-primary/20 bg-bg",
            )
          : "py-10",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          isDark ? "bg-white/10 text-accent" : "bg-accent/15 text-primary",
        )}
      >
        <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <h3
        className={cn(
          "font-display text-xl font-bold leading-tight",
          isDark ? "text-white" : "text-primary",
        )}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "max-w-sm font-body text-sm leading-6",
            isDark ? "text-white/65" : "text-muted",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-2">
          <ActionControl action={action} tone={tone} />
        </div>
      ) : null}
    </div>
  );
}
