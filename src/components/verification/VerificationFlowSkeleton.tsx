import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function VerificationFlowSkeleton(): ReactElement {
  return (
    <main
      className="fixed inset-0 z-[100] overflow-y-auto bg-bg"
      role="status"
      aria-label="Loading verification"
    >
      <div className="border-b border-border bg-bg px-4 py-4 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <Skeleton className="h-11 w-36 rounded-full" />
          <div className="hidden sm:block">
            <Skeleton className="mx-auto h-3 w-32" />
            <Skeleton className="mt-2 h-1.5 w-60 rounded-full" />
          </div>
          <Skeleton className="h-4 w-20 justify-self-end" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-12 px-5 pb-16 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[minmax(0,640px)_minmax(220px,1fr)]">
        <section aria-hidden="true">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="mt-4 h-10 w-80 max-w-full" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl" />
          <Skeleton className="mt-2 h-5 w-4/5" />
          <div className="mt-10 border-y border-border py-5">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-3 h-4 w-72 max-w-full" />
            <Skeleton className="mt-4 h-14 w-full rounded-lg" />
          </div>
          <div className="border-b border-border py-5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-3 h-4 w-80 max-w-full" />
            <Skeleton className="mt-4 h-14 w-full rounded-lg" />
          </div>
          <Skeleton className="ml-auto mt-7 h-12 w-44 rounded-full" />
        </section>
        <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="mt-5 h-6 w-52" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-5 h-4 w-36" />
        </aside>
      </div>
      <span className="sr-only">Loading verification</span>
    </main>
  );
}
