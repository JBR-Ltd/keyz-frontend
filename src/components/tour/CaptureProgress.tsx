"use client";

import type { Room } from "@/lib/types/tour";

interface CaptureProgressProps {
  rooms: Room[];
  onAddAnotherRoom: () => void;
  onFinish: () => void;
}

export default function CaptureProgress({ rooms, onAddAnotherRoom, onFinish }: CaptureProgressProps) {
  return (
    <section aria-labelledby="tour-capture-progress">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Capture Progress
      </p>
      <h2 id="tour-capture-progress" className="mt-2 font-display text-2xl font-bold text-primary">
        {rooms.length} {rooms.length === 1 ? "room" : "rooms"} captured
      </h2>

      <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
        {rooms.map((room) => (
          <li key={room.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-body text-sm font-bold text-primary">{room.roomName}</span>
            <span className="font-body text-xs text-muted">{room.roomType}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onAddAnotherRoom}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-primary/30 bg-bg px-6 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Capture Another Room
        </button>
        <button
          type="button"
          disabled={rooms.length === 0}
          onClick={onFinish}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Finish Capturing
        </button>
      </div>
    </section>
  );
}