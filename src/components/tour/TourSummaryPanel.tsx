// src/components/tour/TourSummaryPanel.tsx
//
// Shows the state of a listing's virtual tour on the manage-listing page.
// One aggregate read, no N+1. Also shows publish state and the list of
// blockers, so the host knows exactly what to do next.

"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Compass,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { getTourSummary } from "@/lib/api/tours/publish";
import type { TourSummary } from "@/lib/types/tour";

interface TourSummaryPanelProps {
  propertyId: number;
  role: "agent" | "landlord";
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: TourSummary };

export default function TourSummaryPanel({
  propertyId,
  role,
}: TourSummaryPanelProps): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const summary = await getTourSummary(propertyId);
      setState({ status: "ready", summary });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not load the tour summary.",
      });
    }
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const tourHref = `/${role}/listings/${propertyId}/tour`;
  const roomsHref = `/${role}/listings/${propertyId}/rooms`;

  return (
    <section>
      {/* <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">
            Virtual tour
          </h2>
          <p className="mt-2 max-w-2xl font-body text-sm text-muted">
            Capture rooms in 360°, pin the doors, and publish a walkable tour
            renters can explore before they book.
          </p>
        </div>
      </div> */}

      <div className="mt-6 rounded-xl border border-border bg-bg p-6 shadow-sm">
        {state.status === "loading" ? (
          <div className="flex items-center gap-3 font-body text-sm text-muted">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Loading tour…
          </div>
        ) : null}

        {state.status === "error" ? (
          <div>
            <p className="font-body text-sm text-red-700">{state.message}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 font-body text-sm font-bold text-primary focus-visible:outline focus-visible:outline-accent"
            >
              Retry
            </button>
          </div>
        ) : null}

        {state.status === "ready" ? (
          <ReadyState
            summary={state.summary}
            tourHref={tourHref}
            roomsHref={roomsHref}
          />
        ) : null}
      </div>
    </section>
  );
}

interface ReadyStateProps {
  summary: TourSummary;
  tourHref: string;
  roomsHref: string;
}

function ReadyState({
  summary,
  tourHref,
  roomsHref,
}: ReadyStateProps): ReactElement {
  const isStarted = summary.roomCount > 0;

  const blockers: string[] = [];
  if (summary.notReadyCount > 0) {
    blockers.push(
      `${summary.notReadyCount} room${summary.notReadyCount === 1 ? "" : "s"} not ready`,
    );
  }
  if (summary.unplacedCount > 0) {
    blockers.push(
      `${summary.unplacedCount} room${summary.unplacedCount === 1 ? "" : "s"} not placed`,
    );
  }
  if (summary.unconfirmedFloorCount > 0) {
    blockers.push(
      `${summary.unconfirmedFloorCount} floor${summary.unconfirmedFloorCount === 1 ? "" : "s"} not confirmed`,
    );
  }
  if (summary.panoramaCount === 0) {
    blockers.push("No panoramas yet");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {summary.isPublished ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 font-body text-xs font-bold text-green-800">
            <CheckCircle2 size={12} aria-hidden="true" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 font-body text-xs font-bold text-primary">
            Draft
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              icon={<LayoutGrid size={16} aria-hidden="true" />}
              label="Floors"
              value={String(summary.floorCount)}
            />
            <Stat
              icon={<Compass size={16} aria-hidden="true" />}
              label="Rooms"
              value={String(summary.roomCount)}
            />
            <Stat
              icon={<Camera size={16} aria-hidden="true" />}
              label="Panoramas"
              value={String(summary.panoramaCount)}
            />
          </dl>

          <p className="mt-5 font-body text-sm text-muted">
            {!isStarted
              ? "Start by creating a floor, then capture each room in it."
              : summary.isPublished
                ? "This tour is live. Any structural change takes it offline until you publish again."
                : summary.isPublishable
                  ? "This tour is ready. Publish it and renters will see it on the listing page."
                  : "Keep going — the checklist below shows what still needs doing."}
          </p>

          {!summary.isPublished && blockers.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 font-body text-sm text-muted">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        {isStarted ? (
          <Link
            href={roomsHref}
            className="inline-flex min-h-11 items-center gap-2 rounded border border-primary/20 bg-bg px-5 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Track rooms
          </Link>
        ) : null}
        <Link
          href={tourHref}
          className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-5 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isStarted ? "Continue tour" : "Start tour"}
        </Link>
      </div>
    </div>
  );
}

interface StatProps {
  icon: ReactElement;
  label: string;
  value: string;
}

function Stat({ icon, label, value }: StatProps): ReactElement {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="font-accent text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          {label}
        </dt>
        <dd className="font-display text-lg font-bold text-primary">{value}</dd>
      </div>
    </div>
  );
}
