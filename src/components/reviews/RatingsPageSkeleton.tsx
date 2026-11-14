import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RatingsPageSkeleton(): ReactElement {
  return (
    <main
      className="min-h-screen px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14"
      role="status"
      aria-label="Loading ratings"
    >
      <section className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <aside className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
          <Skeleton className="h-4 w-32" />
          <div className="mt-8 flex items-end gap-4">
            <Skeleton className="h-16 w-28" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-40" />
            </div>
          </div>
          <Skeleton className="mt-8 h-5 w-full" />
          <Skeleton className="mt-3 h-5 w-4/5" />
          <div className="mt-8 grid gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={`rating-summary-${index + 1}`} className="h-16" />
            ))}
          </div>
        </aside>
        <section className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-5 h-12 w-3/4" />
          <Skeleton className="mt-8 h-28 w-full" />
          <div className="mt-6 grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={`rating-score-${index + 1}`} className="h-20" />
            ))}
          </div>
          <Skeleton className="mt-6 h-32 w-full" />
        </section>
      </section>
      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={`rating-review-${index + 1}`} className="h-48" />
        ))}
      </section>
      <span className="sr-only">Loading ratings</span>
    </main>
  );
}
