import type { HTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

interface CardListSkeletonProps {
  className?: string;
  count?: number;
  label: string;
}

export function Skeleton({ className, ...props }: SkeletonProps): ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-skeleton motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export function CardListSkeleton({
  className,
  count = 3,
  label,
}: CardListSkeletonProps): ReactElement {
  return (
    <div
      className={cn("grid gap-4", className)}
      role="status"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`loading-card-${index + 1}`}
          className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-7"
          aria-hidden="true"
        >
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-5 h-6 w-2/3 max-w-sm" />
              <Skeleton className="mt-3 h-4 w-1/2 max-w-xs" />
            </div>
            <Skeleton className="h-11 w-28 shrink-0 rounded-full" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
