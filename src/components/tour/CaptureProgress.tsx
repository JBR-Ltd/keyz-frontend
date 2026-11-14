"use client";

import type { ReactElement } from "react";
import { CheckCircle2, Plus, Rocket } from "lucide-react";
import { iconForRoom } from "@/lib/tour/roomIcons";
import type { Room, RoomStatus } from "@/lib/types/tour";

interface CaptureProgressProps {
  rooms: Room[];
  onAddAnotherRoom: () => void;
  onReviewFloorPlan: () => void;
  onRoomClick?: (room: Room) => void;
  /**
   * When true, a Publish button appears on this step. The summary has
   * already confirmed every room is READY and every floor plan is
   * confirmed, so publishing is the next thing to do — no need to walk
   * through floor plan → confirm → overview first.
   */
  canPublish?: boolean;
  isPublishing?: boolean;
  onPublish?: () => void;
}

const STATUS_BADGE: Record<
  RoomStatus,
  { label: string; className: string }
> = {
  empty: { label: "Not captured", className: "bg-primary/10 text-muted" },
  scanning: { label: "Scanning", className: "bg-accent/90 text-primary" },
  uploading: { label: "Uploading", className: "bg-accent/90 text-primary" },
  ready: { label: "Ready", className: "bg-green-100 text-green-800" },
  retake: { label: "Retake needed", className: "bg-red-100 text-red-800" },
};

export default function CaptureProgress({
  rooms,
  onAddAnotherRoom,
  onReviewFloorPlan,
  onRoomClick,
  canPublish = false,
  isPublishing = false,
  onPublish,
}: CaptureProgressProps): ReactElement {
  const readyCount = rooms.filter((room) => room.status === "ready").length;
  const allReady = rooms.length > 0 && readyCount === rooms.length;

  return (
    <section aria-labelledby="tour-capture-progress">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Progress
      </p>
      <h2
        id="tour-capture-progress"
        className="mt-2 font-display text-2xl font-bold text-primary"
      >
        {readyCount} of {rooms.length}{" "}
        {rooms.length === 1 ? "room" : "rooms"} ready
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Tap a room to open it so that you can change its size, retake the sweep, or edit the
        doors and staircases. When every room is ready and every floor plan is
        confirmed, publishing appears here.
      </p>

      {canPublish && onPublish ? (
        <div className="mt-6 rounded-xl border border-accent/50 bg-accent/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-body text-[11px] font-bold uppercase tracking-[0.16em] text-accent-alt">
                <Rocket size={12} className="mr-1 inline" aria-hidden="true" />
                Ready to publish
              </p>
              <p className="mt-1 font-body text-sm text-primary">
                Every room is captured and every floor plan is confirmed.
                Publish now, or keep adjusting. Don&apos;t worry, publishing can be re-run any
                time.
              </p>
            </div>
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
              <Rocket size={15} aria-hidden="true" />
              {isPublishing ? "Publishing…" : "Publish virtual tour"}
            </button>
          </div>
        </div>
      ) : null}

     <div data-tour="progress-grid" className="mt-6 grid grid-cols-2 gap-3">
        {rooms.map((room) => {
          const badge = STATUS_BADGE[room.status];
          const clickable = Boolean(onRoomClick);
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onRoomClick?.(room)}
              disabled={!clickable}
              className={[
                "overflow-hidden rounded-xl border border-border bg-bg text-left shadow-sm transition-all duration-200",
                clickable
                  ? "hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  : "cursor-default",
              ].join(" ")}
            >
              <div className="relative flex aspect-[16/10] items-center justify-center bg-[repeating-linear-gradient(118deg,#E7DFD3_0,#E7DFD3_9px,#F1EAE0_9px,#F1EAE0_18px)]">
                <span className="font-mono text-[10px] text-[#A2907A]">
                  panorama · {room.roomName.toLowerCase()}
                </span>
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-1 font-body text-[10px] font-bold ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{iconForRoom(room)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-bold text-primary">
                      {room.roomName}
                    </p>
                    <p className="truncate font-body text-xs text-muted">
                      {room.roomType}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onAddAnotherRoom}
          className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 text-muted transition-colors hover:border-accent hover:text-accent-alt"
        >
          <Plus size={22} aria-hidden="true" />
          <span className="font-body text-xs font-bold">Add room</span>
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
       <button
  type="button"
  data-tour="progress-add"
  onClick={onAddAnotherRoom}
  className="flex-1 rounded-full border border-primary/20 bg-bg px-6 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
>
  Capture another room
</button>
       <button
  type="button"
  data-tour="progress-floor-plan"
  disabled={readyCount === 0}
  onClick={onReviewFloorPlan}
  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
>
         
          Review floor plan
        </button>
      </div>

      {allReady ? (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-2 font-body text-xs font-bold text-green-800">
          <CheckCircle2 size={14} aria-hidden="true" />
          Every room on this floor is ready.
        </p>
      ) : null}
    </section>
  );
}
