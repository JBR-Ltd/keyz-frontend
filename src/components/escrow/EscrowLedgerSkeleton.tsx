import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EscrowLedgerSkeleton(): ReactElement {
  return (
    <main
      className="min-h-screen px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14"
      role="status"
      aria-label="Loading payments"
    >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8 lg:p-10">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-16 w-4/5" />
          <Skeleton className="mt-5 h-5 w-full" />
          <Skeleton className="mt-3 h-5 w-4/5" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        </div>
        <div className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-4 h-9 w-3/4" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <div className="mt-8 grid gap-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </div>
      </section>
      <section className="mt-8 overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">
        <Skeleton className="h-14 w-full rounded-none" />
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`escrow-row-${index + 1}`}
            className="grid gap-4 border-b border-primary/10 p-5 sm:grid-cols-[1fr_10rem_10rem] sm:items-center sm:p-6"
          >
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        ))}
      </section>
      <span className="sr-only">Loading payments</span>
    </main>
  );
}
