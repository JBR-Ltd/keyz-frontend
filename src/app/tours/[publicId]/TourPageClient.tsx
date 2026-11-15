// src/app/tours/[publicId]/TourPageClient.tsx
//
// The client shell for the standalone tour page. Loads the public bundle
// from the anonymous endpoint and hands it to TourShell in fullscreen mode.

"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Share2 } from "lucide-react";
import TourShell from "@/components/tour/TourShell";
import ShareDialog from "@/components/public/ShareDialog";
import { getPublicTour } from "@/lib/api/tours";
import { buildPublicShareUrl } from "@/lib/share";
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
  const [isShareOpen, setIsShareOpen] = useState(false);

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

  const previewImage = tour.floors
    .flatMap((floor) => floor.rooms)
    .find((room) => room.panorama !== null)?.panorama?.url;
  const shareContent = {
    kind: "tour" as const,
    title: `Virtual tour of ${tour.propertyName}`,
    description: `Explore ${tour.propertyName} with a virtual tour on Rello.`,
    url: buildPublicShareUrl(
      `/tours/${encodeURIComponent(tour.propertyPublicId)}`,
    ),
    imageUrl: previewImage,
  };

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-[#0a1622]">
      <div className="relative flex-1">
        <TourShell tour={tour} />
        <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            aria-label="Share this virtual tour"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-primary/70 text-white backdrop-blur-md transition-colors hover:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Share2 size={18} aria-hidden="true" />
          </button>
          <Link
            href={`/property/${tour.propertyPublicId}`}
            aria-label="Back to listing"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-primary/70 text-white backdrop-blur-md transition-colors hover:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <ShareDialog
        open={isShareOpen}
        content={shareContent}
        onClose={() => setIsShareOpen(false)}
      />
    </main>
  );
}
