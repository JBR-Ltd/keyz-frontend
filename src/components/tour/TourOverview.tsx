// src/components/tour/TourOverview.tsx
//
// The tour's home page. Every floor, every room, in one place. This is where
// a host lands after confirming a floor plan and where the wizard's flow
// returns whenever a floor finishes.
//
// Actions per floor: open it (progress for that floor), open its floor plan,
// or jump straight into a specific room's capture.
//
// Tour-level actions: add another floor, preview as a renter, publish.

"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  Rocket,
} from "lucide-react";
import { iconForTypeAndName } from "@/lib/tour/roomIcons";
import type {
  PublicTour,
  PublicTourFloor,
  TourSummary,
} from "@/lib/types/tour";

interface TourOverviewProps {
  tour: PublicTour;
  summary: TourSummary | null;
  previewHref?: string;
  isPublishing?: boolean;
  onAddAnotherFloor: () => void;
  onOpenFloor: (floorId: number) => void;
  onOpenRoom: (floorId: number, roomId: number) => void;
  onOpenFloorPlan: (floorId: number) => void;
  onPublish: () => void;
}

function floorStats(floor: PublicTourFloor): { total: number; ready: number } {
  const total = floor.rooms.length;
  const ready = floor.rooms.filter((r) => r.status === "ready").length;
  return { total, ready };
}

export default function TourOverview({
  tour,
  summary,
  previewHref,
  isPublishing = false,
  onAddAnotherFloor,
  onOpenFloor,
  onOpenRoom,
  onOpenFloorPlan,
  onPublish,
}: TourOverviewProps): ReactElement {
  const publishable = summary?.isPublishable ?? false;
  const published = summary?.isPublished ?? tour.published;
  const blockers: string[] = [];

  if (summary) {
    if (summary.notReadyCount > 0) {
      blockers.push(
        `${summary.notReadyCount} room${summary.notReadyCount === 1 ? "" : "s"} not captured yet`,
      );
    }
    if (summary.unconfirmedFloorCount > 0) {
      blockers.push(
        `${summary.unconfirmedFloorCount} floor plan${summary.unconfirmedFloorCount === 1 ? "" : "s"} not confirmed`,
      );
    }
    if (summary.panoramaCount === 0) {
      blockers.push("No panoramas uploaded");
    }
  }

  return (
    <section aria-labelledby="tour-overview">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
            Tour overview
          </p>
          <h2
            id="tour-overview"
            className="mt-2 font-display text-2xl font-bold text-primary"
          >
            {tour.propertyName || "Your tour"}
          </h2>
          <p className="mt-2 font-body text-sm leading-6 text-muted">
            Every floor, every room, in one place. Add a floor, revisit a
            room, or publish once everything is ready.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs font-bold ${
            published
              ? "bg-green-100 text-green-800"
              : "bg-primary/10 text-primary"
          }`}
        >
          {published ? (
            <>
              <CheckCircle2 size={12} aria-hidden="true" />
              Live
            </>
          ) : (
            "Draft"
          )}
        </span>
      </div>

      {tour.floors.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-primary/20 bg-surface-soft/40 p-8 text-center">
          <p className="font-body text-sm font-bold text-primary">
            No floors yet
          </p>
          <p className="mt-1 font-body text-xs text-muted">
            Add a floor, then capture its rooms.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {tour.floors.map((floor) => {
            const { total, ready } = floorStats(floor);
            return (
              <li
                key={floor.id}
                className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface-soft/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-bold text-primary">
                      {floor.name}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 font-body text-xs text-muted">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${
                          floor.confirmed
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {floor.confirmed ? "Confirmed" : "Not confirmed"}
                      </span>
                      <span>
                        {ready}/{total} room{total === 1 ? "" : "s"} ready
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFloor(floor.id)}
                      className="rounded-full border border-primary/20 bg-bg px-3 py-1.5 font-body text-xs font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
                    >
                      Open floor
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenFloorPlan(floor.id)}
                      className="rounded-full border border-primary/20 bg-bg px-3 py-1.5 font-body text-xs font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
                    >
                      Floor plan
                    </button>
                  </div>
                </div>

                {floor.rooms.length > 0 ? (
                  <ul className="flex flex-wrap gap-2 px-4 py-3">
                    {floor.rooms.map((room) => (
                      <li key={room.id}>
                        <button
                          type="button"
                          onClick={() => onOpenRoom(floor.id, room.id)}
                          title={
                            room.status === "ready"
                              ? `${room.name} — ready`
                              : `${room.name} — not captured`
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                            room.status === "ready"
                              ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                              : "border-border bg-bg text-muted hover:border-accent hover:bg-accent/10"
                          }`}
                        >
                          <span>{iconForTypeAndName(room.type, room.name)}</span>
                          <span className="max-w-[10rem] truncate">
                            {room.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 font-body text-xs text-muted">
                    No rooms on this floor yet.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {blockers.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
            <AlertCircle size={12} aria-hidden="true" />
            Before you can publish
          </p>
          <ul className="mt-2 list-disc pl-5 font-body text-sm text-amber-800">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAddAnotherFloor}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
        >
          <Plus size={14} aria-hidden="true" />
          Add another floor
        </button>

        {previewHref ? (
          <Link
            href={previewHref}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Preview as renter
          </Link>
        ) : null}

        <button
          type="button"
          onClick={onPublish}
          disabled={!publishable || isPublishing}
          title={
            publishable
              ? "Publish this tour"
              : "Fill in the blockers above before publishing"
          }
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPublishing ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Publishing…
            </>
          ) : (
            <>
              <Rocket size={14} aria-hidden="true" />
              {published ? "Update published tour" : "Publish virtual tour"}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
