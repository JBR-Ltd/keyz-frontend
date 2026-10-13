import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EscrowLedgerSkeleton(): ReactElement {
  return (
    <main
      className="mx-auto min-h-screen w-full max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10"
      role="status"
      aria-label="Loading escrow and payouts"
    >
      <Skeleton className="mb-5 h-11 w-40 rounded-full" aria-hidden="true" />
      <header className="flex flex-col gap-5 border-b border-primary/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xl">
          <Skeleton className="h-12 w-72 max-w-full" />
          <Skeleton className="mt-3 h-5 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </header>

      <section
        className="grid gap-5 py-7 sm:grid-cols-3 sm:gap-0"
        aria-hidden="true"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`escrow-total-${index + 1}`}
            className={`${index > 0 ? "border-t border-primary/15 pt-5 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0" : ""} ${index < 2 ? "sm:pr-7" : ""}`}
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-10 w-36" />
            <Skeleton className="mt-2 h-4 w-44 max-w-full" />
          </div>
        ))}
      </section>

      <section className="border-t border-primary/15 py-8" aria-hidden="true">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <div className="mt-5 divide-y divide-primary/10 border-y border-primary/15">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={`active-payout-${index + 1}`}
              className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_9rem_8rem] md:items-center"
            >
              <div>
                <Skeleton className="h-5 w-56 max-w-full" />
                <Skeleton className="mt-2 h-4 w-32" />
                <Skeleton className="mt-3 h-4 w-64 max-w-full" />
              </div>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-primary/15 py-8" aria-hidden="true">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={`filter-${index + 1}`}
                className="h-11 w-20 rounded-full"
              />
            ))}
          </div>
        </div>
        <div className="mt-6 border-y border-primary/15">
          <Skeleton className="h-12 w-full rounded-none" />
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`ledger-row-${index + 1}`}
              className="grid grid-cols-[1.4fr_repeat(4,0.7fr)] gap-5 border-t border-primary/10 py-5"
            >
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-8 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Loading escrow and payouts</span>
    </main>
  );
}
