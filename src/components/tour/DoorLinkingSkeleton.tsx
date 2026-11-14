// src/components/tour/DoorLinkingSkeleton.tsx
//
// Mirrors the DoorLinking layout so the page never sits blank while the
// tour data is being fetched.

"use client";

import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoorLinkingSkeleton(): ReactElement {
  return (
    <section aria-busy="true" aria-label="Loading door editor">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-4 w-3/4 max-w-xl" />

      <div className="mt-6 flex w-full justify-center">
        <div className="w-full max-w-md">
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-3 w-40" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-44 rounded-full" />
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-bg p-5 shadow-sm">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-6 w-64 max-w-full" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="mt-3 h-10 w-full" />
        <Skeleton className="mt-3 h-24 w-full" />
        <div className="mt-5 flex justify-end gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      <span className="sr-only">Loading door editor</span>
    </section>
  );
}
