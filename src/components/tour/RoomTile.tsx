// src/components/tour/RoomTile.tsx
//
// One room in the RoomBoardPage grid. Shows a preview, a status badge, and
// a footer button whose label varies by state. The icon comes from
// lib/tour/roomIcons.ts so the three surfaces (this, CaptureProgress,
// FloorPlanReview) cannot drift.

"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  ImageOff,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { iconForRoom } from "@/lib/tour/roomIcons";
import type { Room, RoomStatus } from "@/lib/types/tour";

interface RoomTileProps {
  room: Room;
  onClick: (room: Room) => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  /** True while the delete request is in flight for this room. */
  isDeleting?: boolean;
}

const STATUS_BADGE: Record<
  RoomStatus,
  { label: string; className: string; icon: ReactElement }
> = {
  empty: {
    label: "Not captured",
    className: "bg-primary/10 text-primary",
    icon: <ImageOff size={11} aria-hidden="true" />,
  },
  scanning: {
    label: "Scanning",
    className: "bg-accent/90 text-primary",
    icon: <Loader2 size={11} className="animate-spin" aria-hidden="true" />,
  },
  uploading: {
    label: "Uploading",
    className: "bg-accent/90 text-primary",
    icon: <Clock size={11} aria-hidden="true" />,
  },
  ready: {
    label: "Ready",
    className: "bg-green-100 text-green-800",
    icon: <CheckCircle2 size={11} aria-hidden="true" />,
  },
  retake: {
    label: "Retake needed",
    className: "bg-red-100 text-red-800",
    icon: <RotateCcw size={11} aria-hidden="true" />,
  },
};

export default function RoomTile({
  room,
  onClick,
  onEdit,
  onDelete,
  isDeleting = false,
}: RoomTileProps): ReactElement {
  const badge = STATUS_BADGE[room.status];
  const hasPanorama = room.panorama != null;

  const footerLabel =
    room.status === "ready"
      ? "Review"
      : room.status === "retake"
        ? "Retake"
        : "Continue";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md">
      <button
        type="button"
        onClick={() => onClick(room)}
        className="flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        aria-label={`Open ${room.roomName} in the tour wizard`}
      >
        <div className="relative aspect-[16/10] bg-surface-soft">
          {hasPanorama ? (
            <Image
              src={room.panorama!}
              alt={room.roomName}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(118deg,#E7DFD3_0,#E7DFD3_9px,#F1EAE0_9px,#F1EAE0_18px)]">
              <span className="font-mono text-[10px] text-[#A2907A]">
                no panorama yet
              </span>
            </div>
          )}

          <span
            className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 font-body text-[10px] font-bold ${badge.className}`}
          >
            {badge.icon}
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-3">
          <span className="text-base leading-none">{iconForRoom(room)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-sm font-bold text-primary">
              {room.roomName}
            </span>
            <span className="block truncate font-body text-xs text-muted">
              {room.roomType}
            </span>
          </span>
        </div>

        <div className="border-t border-border bg-surface-soft/40 px-3 py-2">
          <span className="font-body text-xs font-bold text-primary">
            {footerLabel} →
          </span>
        </div>
      </button>

      <div className="pointer-events-none absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(room);
          }}
          aria-label={`Edit ${room.roomName}`}
          className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-bg/95 text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-accent/20 hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Pencil size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(room);
          }}
          disabled={isDeleting}
          aria-label={`Delete ${room.roomName}`}
          className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-bg/95 text-red-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
        >
          {isDeleting ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={13} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
