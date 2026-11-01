// src/components/tour/TourShell.tsx
//
// One viewer for both the standalone /tours/[publicId] page and the embed on
// the property detail page. It takes a loaded PublicTour and wires the
// panorama viewer, the floor switcher, and the room dock.
//
// No fetching happens here. Callers load the bundle and pass it in, which
// keeps the "what happens on 404" decision at the caller.

"use client";

import { useMemo, useState, type ReactElement } from "react";
import PanoramaViewer from "@/components/tour/PanoramaViewer";
import type { PublicTour, PublicTourFloor } from "@/lib/types/tour";

interface TourShellProps {
  tour: PublicTour;
}

interface TourNode {
  id: string;
  panorama: string;
  name?: string;
  caption?: string;
  // Deliberately empty. Navigation is the dock, prev/next and door chips.
  // See the plan's architecture decision 7.
  links: [];
}

function buildNodes(floors: PublicTourFloor[]): TourNode[] {
  const nodes: TourNode[] = [];
  for (const floor of floors) {
    for (const room of floor.rooms) {
      if (room.panorama === null) continue;
      nodes.push({
        id: String(room.id),
        panorama: room.panorama.url,
        name: room.name,
        caption: `${room.name} · ${floor.name}`,
        links: [],
      });
    }
  }
  return nodes;
}

export default function TourShell({ tour }: TourShellProps): ReactElement {
  const [activeFloorId, setActiveFloorId] = useState<number | null>(
    tour.floors[0]?.id ?? null,
  );
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    const firstFloor = tour.floors[0];
    const firstRoom = firstFloor?.rooms.find((r) => r.panorama !== null);
    return firstRoom ? String(firstRoom.id) : null;
  });

  const nodes = useMemo(() => buildNodes(tour.floors), [tour]);

  const activeFloor = useMemo(() => {
    if (activeFloorId === null) return tour.floors[0] ?? null;
    return (
      tour.floors.find((f) => f.id === activeFloorId) ?? tour.floors[0] ?? null
    );
  }, [tour, activeFloorId]);

  const roomOptions = useMemo(() => {
    if (!activeFloor) return [];
    return activeFloor.rooms
      .filter((r) => r.panorama !== null)
      .map((r) => ({
        id: r.id,
        roomName: r.name,
        panorama: r.panorama?.url ?? null,
      }));
  }, [activeFloor]);

  const floorOptions = useMemo(
    () =>
      tour.floors.map((f) => ({
        id: f.id,
        name: f.name,
        levelIndex: f.floorNumber,
      })),
    [tour],
  );

  const handleFloorChange = (floorId: number): void => {
    const floor = tour.floors.find((f) => f.id === floorId);
    if (!floor) return;
    setActiveFloorId(floorId);
    const room = floor.rooms.find((r) => r.panorama !== null);
    setActiveRoomId(room ? String(room.id) : null);
  };

  if (!activeRoomId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a1622] font-body text-sm text-white/60">
        This tour has no panoramas yet.
      </div>
    );
  }

  return (
    <PanoramaViewer
      nodes={nodes}
      startNodeId={activeRoomId}
      activeNodeId={activeRoomId}
      onNodeChange={setActiveRoomId}
      rooms={roomOptions}
      floors={floorOptions}
      currentFloorId={activeFloorId ?? undefined}
      onFloorChange={handleFloorChange}
    />
  );
}
