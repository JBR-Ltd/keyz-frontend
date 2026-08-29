"use client";

import type { Floor, Room } from "@/lib/types/tour";

interface FloorPlanReviewProps {
  floor: Floor;
  rooms: Room[];
  onPublish: () => void;
}

export default function FloorPlanReview({ floor, rooms, onPublish }: FloorPlanReviewProps) {
  return (
    <section aria-labelledby="tour-floor-plan-review">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Floor Plan Review
      </p>
      <h2 id="tour-floor-plan-review" className="mt-2 font-display text-2xl font-bold text-primary">
        {floor.name}
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Review the rooms captured on this floor before publishing the tour.
      </p>

      <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
        {rooms.map((room, index) => (
          <li key={room.id} className="flex items-center gap-4 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-body text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="font-body text-sm font-bold text-primary">{room.roomName}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onPublish}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Publish Virtual Tour
      </button>
    </section>
  );
}