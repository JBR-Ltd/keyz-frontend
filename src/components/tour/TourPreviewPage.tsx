// src/components/tour/TourPreviewPage.tsx
//
// The owner's preview of their own tour, drafts and all. Reads the
// owner-preview bundle at GET /api/tours/properties/{pid}/full-tour, which
// enforces ownership server-side (seller or listedByUserId).
//
// Same TourShell the renter-facing pages use, so what the host sees is what
// a renter will see once it is published.

"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2, Wand2 } from "lucide-react";
import TourShell from "@/components/tour/TourShell";
import { getTourPreview } from "@/lib/api/tours";
import type { PublicTour } from "@/lib/types/tour";

interface TourPreviewPageProps {
  propertyId: number;
  role: "landlord" | "agent";
}

export default function TourPreviewPage({
  propertyId,
  role,
}: TourPreviewPageProps): ReactElement {
  const [tour, setTour] = useState<PublicTour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await getTourPreview(propertyId);
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
  }, [propertyId]);

  const listingHref = `/${role}/listings/${propertyId}`;
  const wizardHref = `${listingHref}/tour`;

  const hasAnyPanorama = tour?.floors.some((floor) =>
    floor.rooms.some((room) => room.panorama !== null),
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a1622]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </main>
    );
  }

  if (error || !tour || !hasAnyPanorama) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-body text-sm text-white/70">
          {error ?? "Nothing to preview yet. Capture at least one room first."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={listingHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 font-body text-sm font-bold text-white/90 transition-colors hover:border-sky-300 hover:bg-sky-500/10"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to listing
          </Link>
          <Link
            href={wizardHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sky-500 px-6 font-body text-sm font-bold text-white transition-colors hover:bg-sky-400"
          >
            <Wand2 size={15} aria-hidden="true" />
            Open the tour wizard
          </Link>
        </div>
      </main>
    );
  }

  const isPublished = tour.published;

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-[#0a1622]">
      <div className="relative flex-1">
        <TourShell tour={tour} />

        {/*
          Owner-only chrome. Never shown to a renter: they only reach this
          component from the listing page, and only the wizard links here.
          Two rows on narrow screens, one row on sm+.
        */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:p-4">
          <span
            className={`pointer-events-auto inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 font-body text-[11px] font-bold shadow-lg sm:text-xs ${
              isPublished
                ? "border-sky-400/50 bg-sky-500/15 text-sky-200"
                : "border-white/25 bg-[#0a1622]/90 text-white/85"
            }`}
          >
            <Eye size={13} aria-hidden="true" />
            {isPublished ? "Preview · Live" : "Preview · Draft"}
          </span>

          <div className="pointer-events-auto flex flex-wrap gap-2 sm:justify-end">
            <Link
              href={wizardHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-[#0a1622]/90 px-3 font-body text-[11px] font-bold text-white/90 transition-colors hover:border-sky-300 hover:bg-sky-500/15 sm:h-10 sm:gap-2 sm:px-4 sm:text-xs"
            >
              <Wand2 size={14} aria-hidden="true" />
              Back to wizard
            </Link>
            <Link
              href={listingHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-[#0a1622]/90 px-3 font-body text-[11px] font-bold text-white/90 transition-colors hover:border-sky-300 hover:bg-sky-500/15 sm:h-10 sm:gap-2 sm:px-4 sm:text-xs"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Listing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
