// src/app/tours/[publicId]/TourPageClient.tsx
//
// The client shell for the standalone tour page. Loads the public bundle
// from the anonymous endpoint and hands it to TourShell in fullscreen mode.

"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import TourShell from "@/components/tour/TourShell";
import { getPublicTour } from "@/lib/api/tours";
import type { PublicTour } from "@/lib/types/tour";

interface TourPageClientProps {
  publicId: string;
}

export default function TourPageClient({
  publicId,
}: TourPageClientProps): ReactElement {
  const [tour, setTour] = useState<PublicTour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await getPublicTour(publicId);
        if (!active) return;
        setTour(next);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load tour");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [publicId]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a1622]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  const hasAnyPanorama = tour?.floors.some((floor) =>
    floor.rooms.some((room) => room.panorama !== null),
  );

  if (error || !tour || !hasAnyPanorama) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-body text-sm text-muted">
          {error ?? "This tour isn't available yet."}
        </p>
        <Link
          href={`/property/${publicId}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 font-body text-sm font-bold text-white"
        >
          <ArrowLeft size={15} />
          Back to listing
        </Link>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-[#0a1622]">
      <div className="relative flex-1">
        <TourShell tour={tour} />
        <Link
          href={`/property/${publicId}`}
          aria-label="Back to listing"
          className="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-primary/70 text-white backdrop-blur-md transition-colors hover:bg-primary"
        >
          <ArrowLeft size={17} />
        </Link>
      </div>
    </main>
  );
}
