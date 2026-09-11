import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function VerificationFlowSkeleton(): ReactElement {
  return (
    <main
      className="fixed inset-0 z-[100] overflow-y-auto bg-primary px-5 py-12 text-white sm:px-8 lg:px-10 lg:py-16"
      role="status"
      aria-label="Loading verification"
    >
      <div className="mx-auto max-w-5xl">
        <Skeleton className="h-4 w-32 bg-white/10" />
        <Skeleton className="mt-6 h-12 w-3/5 max-w-xl bg-white/10" />
        <Skeleton className="mt-4 h-5 w-4/5 max-w-2xl bg-white/10" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`verification-step-${index + 1}`}
              className="rounded-2xl border border-white/10 p-6"
              aria-hidden="true"
            >
              <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
              <Skeleton className="mt-6 h-6 w-3/4 bg-white/10" />
              <Skeleton className="mt-4 h-4 w-full bg-white/10" />
              <Skeleton className="mt-2 h-4 w-4/5 bg-white/10" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-10 h-14 w-44 rounded-full bg-white/10" />
      </div>
      <span className="sr-only">Loading verification</span>
    </main>
  );
}
