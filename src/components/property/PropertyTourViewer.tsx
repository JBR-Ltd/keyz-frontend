"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { Compass, Loader2, Move } from "lucide-react";
import {
  getPropertyTour,
  primaryPanorama,
  type TourFloorWithRooms,
  type TourRoomWithViews,
} from "@/lib/tour";

interface PropertyTourViewerProps {
  propertyId: number;
}

/** Wide photos read as a room when panned, so the drag is scaled to feel right. */
const DRAG_SENSITIVITY = 0.35;

export default function PropertyTourViewer({
  propertyId,
}: PropertyTourViewerProps): ReactElement | null {
  const [floors, setFloors] = useState<TourFloorWithRooms[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFloorId, setActiveFloorId] = useState<number | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  /** Horizontal offset into the panorama, as a percentage. */
  const [offset, setOffset] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, offset: 50 });

  useEffect(() => {
    let active = true;

    void getPropertyTour(propertyId).then((result) => {
      if (!active) {
        return;
      }

      setFloors(result);

      const firstFloor = result[0] ?? null;
      const firstRoom =
        firstFloor?.rooms.find((room) => room.panoramas.length > 0) ?? null;

      setActiveFloorId(firstFloor?.id ?? null);
      setActiveRoomId(firstRoom?.id ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [propertyId]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    setIsDragging(true);
    dragStart.current = { x: event.clientX, offset };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!isDragging) {
      return;
    }

    const travelled = event.clientX - dragStart.current.x;
    const width = event.currentTarget.clientWidth || 1;
    const next =
      dragStart.current.offset -
      (travelled / width) * 100 * (1 / DRAG_SENSITIVITY);

    setOffset(Math.min(Math.max(next, 0), 100));
  };

  const endDrag = (): void => setIsDragging(false);

  const chooseRoom = useCallback((room: TourRoomWithViews): void => {
    setActiveRoomId(room.id);
    // Each room opens facing the middle of its own photo
    setOffset(50);
  }, []);

  if (isLoading) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-surface-soft">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  // A listing with no panoramas has no tour, and an empty frame says nothing
  if (floors.length === 0) {
    return null;
  }

  const activeFloor =
    floors.find((floor) => floor.id === activeFloorId) ?? floors[0];
  const activeRoom =
    activeFloor.rooms.find((room) => room.id === activeRoomId) ??
    activeFloor.rooms.find((room) => room.panoramas.length > 0) ??
    activeFloor.rooms[0];
  const panorama = activeRoom ? primaryPanorama(activeRoom) : null;

  return (
    <section id="virtual-tour" className="scroll-mt-24">
      <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
        Walk through it
      </p>
      <h2 className="mt-2 font-display text-xl font-bold text-primary">
        Look around
      </h2>
      <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
        Drag to look around the room, and pick another room to move through the
        home. Photographed at the property.
      </p>

      {floors.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Floors">
          {floors.map((floor) => {
            const isActive = floor.id === activeFloor.id;

            return (
              <button
                key={floor.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveFloorId(floor.id);
                  const room = floor.rooms.find((item) => item.panoramas.length > 0);
                  setActiveRoomId(room?.id ?? null);
                  setOffset(50);
                }}
                className={`min-h-10 rounded-full px-4 font-body text-sm font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-surface-soft text-primary hover:bg-primary/10"
                }`}
              >
                {floor.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl bg-primary/5 shadow-sm">
        {panorama ? (
          <div
            role="img"
            aria-label={`Inside the ${activeRoom.roomName}`}
            onPointerDown={startDrag}
            onPointerMove={drag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`relative aspect-video w-full touch-none bg-cover ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              backgroundImage: `url(${panorama.imageUrl})`,
              backgroundPositionX: `${offset}%`,
              backgroundSize: "auto 100%",
              backgroundRepeat: "repeat-x",
            }}
          >
            <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-primary/70 px-3 py-1.5 font-body text-xs font-bold text-white">
              <Move size={13} aria-hidden="true" />
              Drag to look around
            </span>
            <span className="pointer-events-none absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-primary/70 px-3 py-1.5 font-body text-xs font-bold text-white">
              <Compass size={13} aria-hidden="true" />
              {activeRoom.roomName}
            </span>
          </div>
        ) : (
          <p className="aspect-video grid place-items-center px-6 text-center font-body text-sm text-muted">
            This room has no photo yet.
          </p>
        )}
      </div>

      {activeFloor.rooms.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFloor.rooms.map((room) => {
            const isActive = room.id === activeRoom.id;
            const hasView = room.panoramas.length > 0;

            return (
              <button
                key={room.id}
                type="button"
                disabled={!hasView}
                onClick={() => chooseRoom(room)}
                className={`min-h-10 rounded-full px-4 font-body text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 ${
                  isActive
                    ? "bg-accent text-primary"
                    : "bg-surface-soft text-primary hover:bg-primary/10"
                }`}
              >
                {room.roomName}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
