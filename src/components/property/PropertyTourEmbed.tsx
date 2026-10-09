// src/components/property/PropertyTourEmbed.tsx
//
// The "explore this home" cluster on the property detail page. Reads the
// anonymous public bundle by the listing's public id.
//
// Owns the entire section — divider, header, and body — so the parent never
// renders a heading for a tour that does not exist. Three states:
//
//   loading      → skeleton frame
//   ready        → three cards: Virtual tour, Floor plan, 3D walkthrough.
//                  Each opens in a new tab. The 3D walkthrough deep-links
//                  to the Walkthrough tab on the floor-plan page via
//                  ?view=3d.
//   unavailable  → dashed card ("not set up yet")
//
// A listing that is not live, or whose tour was never published, 404s on the
// fetch and lands on "unavailable" — that is what hides the floor plan and
// 3D walkthrough from tenants until the host publishes the tour.

"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Compass,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { getPublicTour } from "@/lib/api/tours";
import type { PublicTour } from "@/lib/types/tour";

interface PropertyTourEmbedProps {
  publicId: string;
}

type TourState =
  | { status: "loading" }
  | { status: "ready"; tour: PublicTour }
  | { status: "unavailable" };

export default function PropertyTourEmbed({
  publicId,
}: PropertyTourEmbedProps): ReactElement {
  const [state, setState] = useState<TourState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    // Deferred, so the effect body itself never sets state
    queueMicrotask(() => {
      if (active) setState({ status: "loading" });
    });

    void (async () => {
      try {
        const next = await getPublicTour(publicId);
        if (!active) return;
        const hasAnyPanorama = next.floors.some((floor) =>
          floor.rooms.some((room) => room.panorama !== null),
        );
        setState(
          hasAnyPanorama
            ? { status: "ready", tour: next }
            : { status: "unavailable" },
        );
      } catch {
        if (!active) return;
        setState({ status: "unavailable" });
      }
    })();

    return () => {
      active = false;
    };
  }, [publicId]);

  return (
    <>
      <div className="my-6 border-t border-border" />
      <section id="virtual-tour" className="scroll-mt-24">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
          See it for yourself
        </p>
        <h2 className="mt-2 font-display text-xl font-bold text-primary">
          Explore this home
        </h2>

        {state.status === "loading" ? (
          <div
            role="status"
            aria-label="Loading tour options"
            className="mt-4 flex min-h-32 items-center justify-center rounded-2xl bg-surface-soft"
          >
            <Loader2 size={20} className="animate-spin text-muted" />
            <span className="sr-only">Loading tour options</span>
          </div>
        ) : null}

        {state.status === "unavailable" ? (
          <div className="mt-4 flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-soft/60 px-6 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg text-muted">
              <Compass size={22} aria-hidden="true" />
            </span>
            <p className="font-body text-sm font-bold text-primary">
              Virtual tour not set up yet
            </p>
            <p className="max-w-md font-body text-sm leading-6 text-muted">
              The host hasn&apos;t published a walkable tour for this home.
              Request a viewing to see it in person.
            </p>
          </div>
        ) : null}

        {state.status === "ready" ? (
          <ReadyCards tour={state.tour} publicId={publicId} />
        ) : null}
      </section>
    </>
  );
}

interface ReadyCardsProps {
  publicId: string;
  tour: PublicTour;
}

function ReadyCards({ publicId, tour }: ReadyCardsProps): ReactElement {
  const floorCount = tour.floors.length;
  const roomCount = tour.floors.reduce(
    (total, floor) => total + floor.rooms.length,
    0,
  );
  const summaryLine = `${floorCount} floor${floorCount === 1 ? "" : "s"} · ${roomCount} room${roomCount === 1 ? "" : "s"}`;

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      <ExploreCard
        href={`/tours/${publicId}`}
        icon={<Compass size={24} aria-hidden="true" />}
        title="Virtual tour"
        description={`Walk every room at your own pace — ${summaryLine}.`}
        ctaLabel="Open virtual tour"
      />
      <ExploreCard
        href={`/tours/${publicId}/floor-plan`}
        icon={<LayoutGrid size={24} aria-hidden="true" />}
        title="Floor plan"
        description={`See how the ${floorCount === 1 ? "floor" : "floors"} fit together, room by room.`}
        ctaLabel="Open floor plan"
      />
      <ExploreCard
        href={`/tours/${publicId}/floor-plan?view=3d`}
        icon={<Boxes size={24} aria-hidden="true" />}
        title="3D walkthrough"
        description="Step inside the schematic and click through the layout."
        ctaLabel="Open 3D walkthrough"
      />
    </div>
  );
}

interface ExploreCardProps {
  ctaLabel: string;
  description: string;
  href: string;
  icon: ReactElement;
  title: string;
}

function ExploreCard({
  ctaLabel,
  description,
  href,
  icon,
  title,
}: ExploreCardProps): ReactElement {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-bg p-5 shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent-alt">
        {icon}
      </span>
      <p className="mt-4 font-body text-base font-bold text-primary">
        {title}
      </p>
      <p className="mt-1 flex-1 font-body text-sm leading-6 text-muted">
        {description}
      </p>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {ctaLabel}
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
