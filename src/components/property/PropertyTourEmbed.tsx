// src/components/property/PropertyTourEmbed.tsx
//
// Inline tour on the property detail page. Reads the anonymous public
// bundle by the listing's public id. If the tour is not published, or the
// listing is not live, the fetch 404s and this renders nothing — the
// property page simply has no tour section.
//
// This replaces the CSS background-pan fake that used to sit here, which
// called an owner-only endpoint and showed every logged-out visitor an
// error.

"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import TourShell from "@/components/tour/TourShell";
import { getPublicTour } from "@/lib/api/tours";
import type { PublicTour } from "@/lib/types/tour";

interface PropertyTourEmbedProps {
  publicId: string;
}

export default function PropertyTourEmbed({
  publicId,
}: PropertyTourEmbedProps): ReactElement | null {
  const [tour, setTour] = useState<PublicTour | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void (async () => {
      try {
        const next = await getPublicTour(publicId);
        if (!active) return;
        setTour(next);
      } catch {
        if (!active) return;
        setTour(null);
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
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-surface-soft">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  const hasAnyPanorama = tour?.floors.some((floor) =>
    floor.rooms.some((room) => room.panorama !== null),
  );

  if (!tour || !hasAnyPanorama) {
    return null;
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[#0a1622]">
      <TourShell tour={tour} />
    </div>
  );
}
