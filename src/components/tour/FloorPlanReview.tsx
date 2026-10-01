"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { iconForRoom } from "@/lib/tour/roomIcons";
import type { Floor, Room, TourSummary } from "@/lib/types/tour";

interface FloorPlanReviewProps {
  floor: Floor;
  rooms: Room[];
  tourSummary?: TourSummary | null;
  /** Pre-built preview link. When provided, a "Preview as renter" button appears. */
  previewHref?: string;
  onPublish: () => void;
  onAddAnotherFloor?: () => void;
  onContinueCapturing?: () => void;
}

export default function FloorPlanReview({
  floor,
  rooms,
  tourSummary,
  previewHref,
  onPublish,
  onAddAnotherFloor,
  onContinueCapturing,
}: FloorPlanReviewProps): ReactElement {
  const readyCount = rooms.filter((room) => room.status === "ready").length;
  const publishable = tourSummary?.isPublishable ?? false;
  const blockers: string[] = [];

  if (tourSummary) {
    if (tourSummary.notReadyCount > 0) {
      blockers.push(
        `${tourSummary.notReadyCount} room${tourSummary.notReadyCount === 1 ? "" : "s"} not ready`,
      );
    }
    if (tourSummary.unconfirmedFloorCount > 0) {
      blockers.push(
        `${tourSummary.unconfirmedFloorCount} floor plan${tourSummary.unconfirmedFloorCount === 1 ? "" : "s"} not confirmed`,
      );
    }
    if (tourSummary.panoramaCount === 0) {
      blockers.push("No panoramas");
    }
  }

  return (
    <section aria-labelledby="tour-floor-plan-review">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Review
      </p>
      <h2
        id="tour-floor-plan-review"
        className="mt-2 font-display text-2xl font-bold text-primary"
      >
        {floor.name}
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        {readyCount} of {rooms.length} rooms ready on this floor. Publish the
        tour once every floor has a confirmed plan, or add another floor or room
        first.
      </p>

      <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
        {rooms.map((room, index) => {
          const isReady = room.status === "ready";
          return (
            <li key={room.id} className="flex items-center gap-4 px-4 py-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-xs font-bold ${
                  isReady ? "bg-primary text-white" : "bg-primary/10 text-muted"
                }`}
              >
                {index + 1}
              </span>
              <span className="text-base leading-none">
                {iconForRoom(room)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-body text-sm font-bold text-primary">
                  {room.roomName}
                </span>
                <span className="block truncate font-body text-xs text-muted">
                  {room.roomType}
                </span>
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-body text-[10px] font-bold ${
                  isReady
                    ? "bg-green-100 text-green-800"
                    : "bg-primary/10 text-muted"
                }`}
              >
                {isReady ? "Ready" : room.status}
              </span>
            </li>
          );
        })}
      </ul>

      {blockers.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="font-body text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
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
        {previewHref ? (
          <Link
            href={previewHref}
            target="_blank"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Preview as renter
          </Link>
        ) : null}
        {tourSummary?.isPublished && tourSummary.propertyPublicId ? (
          <Link
            href={`/tours/${tourSummary.propertyPublicId}/floor-plan?floor=${floor.id}`}
            target="_blank"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Open floor plan
          </Link>
        ) : null}
        {onAddAnotherFloor ? (
          <button
            type="button"
            onClick={onAddAnotherFloor}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
          >
            <Plus size={14} aria-hidden="true" />
            Add another floor
          </button>
        ) : null}
        {onContinueCapturing ? (
          <button
            type="button"
            onClick={onContinueCapturing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
          >
            Capture another room
          </button>
        ) : null}
        <button
          type="button"
          onClick={onPublish}
          disabled={
            tourSummary !== null &&
            tourSummary !== undefined &&
            !publishable
          }
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Publish virtual tour
        </button>
      </div>
    </section>
  );
}
