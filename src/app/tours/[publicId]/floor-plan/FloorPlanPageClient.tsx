// src/app/tours/[publicId]/floor-plan/FloorPlanPageClient.tsx
//
// The client shell for the standalone floor-plan page. Everything comes from
// the public bundle: floors, rooms, placements, staircases. Nothing reads an
// owner-only endpoint, so this works for a signed-out visitor on a
// published tour.

"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import BlueprintCanvas from "@/components/tour/BlueprintCanvas";
import FloorPlan3DView from "@/components/tour/FloorPlan3DView";
import { buildGraph } from "@/lib/tour/buildGraph";
import { generateSimpleBlueprint } from "@/lib/tour/blueprint";
import { getPublicTour } from "@/lib/api/tours";
import type {
  Door,
  Floor,
  PublicTour,
  PublicTourDoor,
  PublicTourFloor,
  PublicTourRoom,
  Room,
} from "@/lib/types/tour";

type ViewMode = "blueprint" | "3d";

interface FloorPlanPageClientProps {
  publicId: string;
  initialFloorId?: number;
  initialViewMode?: ViewMode;
}

// ---------------------------------------------------------------------------
// Adapters from the public bundle shape to the internal shapes the graph and
// the 3D scene expect. Everything here is a pure function of the payload.
// ---------------------------------------------------------------------------

function publicDoorToDoor(
  d: PublicTourDoor,
  roomId: number,
  roomName: string,
): Door {
  return {
    id: d.id,
    roomId,
    roomName,
    panoramaId: null,
    positionYawDeg: d.yawDeg ?? 0,
    positionPitchDeg: d.pitchDeg ?? 0,
    wallSide: d.wallSide,
    compassDirection: d.compassDirection,
    alongWallPercent: d.alongWallPercent,
    x: null,
    y: null,
    kind: d.kind ?? "DOOR",
    isFixed: d.isFixed,
    leadsToRoomId: d.leadsToRoomId,
    leadsToRoomName: null,
    leadsToLabel: d.leadsToLabel,
    isReciprocalOf: null,
    reciprocalDoorId: null,
    reciprocalDoorRoomName: null,
  };
}

function publicRoomToRoom(pr: PublicTourRoom): Room {
  return {
    id: pr.id,
    floorId: 0,
    roomName: pr.name,
    roomType: pr.type,
    sizeBucket: pr.sizeBucket,
    sizeEstimateSqft: null,
    status: pr.status,
    fovAngle: 0,
    panorama: pr.panorama?.url ?? null,
    panoramas: [],
    doors: pr.doors.map((d) => publicDoorToDoor(d, pr.id, pr.name)),
    staircases: [],
    floorPlanPosition: null,
  };
}

function publicFloorToFloor(pf: PublicTourFloor, propertyId: number): Floor {
  return {
    id: pf.id,
    propertyId,
    floorNumber: pf.floorNumber,
    name: pf.name,
    isFloorPlanConfirmed: pf.confirmed,
    floorPlanConfirmedAt: null,
  };
}

export default function FloorPlanPageClient({
  publicId,
  initialFloorId,
  initialViewMode = "blueprint",
}: FloorPlanPageClientProps): ReactElement {
  const [tour, setTour] = useState<PublicTour | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void (async () => {
      try {
        const next = await getPublicTour(publicId);
        if (!active) return;
        setTour(next);

        const target =
          initialFloorId !== undefined
            ? next.floors.find((f) => f.id === initialFloorId) ??
              next.floors[0]
            : next.floors[0];
        setActiveFloorId(target?.id ?? null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load floor plan",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [publicId, initialFloorId]);

  const activeFloor = useMemo(() => {
    if (!tour) return null;
    if (activeFloorId === null) return tour.floors[0] ?? null;
    return tour.floors.find((f) => f.id === activeFloorId) ?? tour.floors[0] ?? null;
  }, [tour, activeFloorId]);

  const roomsForView = useMemo(
    () => activeFloor?.rooms.map(publicRoomToRoom) ?? [],
    [activeFloor],
  );

  const floorForView = useMemo(
    () => (activeFloor ? publicFloorToFloor(activeFloor, 0) : null),
    [activeFloor],
  );

  const graph = useMemo(() => {
    if (!activeFloor) return null;
    return buildGraph({
      floorId: activeFloor.id,
      floorName: activeFloor.name,
      confirmed: activeFloor.confirmed,
      placements: activeFloor.placements,
      unplacedRoomIds: [],
      rooms: roomsForView,
      staircases: activeFloor.staircases,
    });
  }, [activeFloor, roomsForView]);

  const blueprintSVG = useMemo(() => {
    if (!graph) return "";
    return generateSimpleBlueprint(graph, roomsForView);
  }, [graph, roomsForView]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (error || !tour || !activeFloor || !graph || !floorForView) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-body text-sm text-muted">
          {error ?? "This floor plan isn't available."}
        </p>
        <Link
          href={`/property/${publicId}`}
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-body text-sm font-bold text-white"
        >
          Back to listing
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-16">
      <header className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href={`/property/${publicId}`}
          className="inline-flex items-center gap-2 font-body text-sm font-medium text-muted hover:text-primary"
        >
          <ArrowLeft size={15} />
          Back to listing
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
              Floor plan
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-primary">
              {activeFloor.name}
            </h1>
          </div>

          <div className="flex gap-2 rounded-lg border border-border bg-bg p-1">
            <button
              type="button"
              onClick={() => setViewMode("blueprint")}
              className={`rounded-md px-4 py-2 font-body text-sm font-medium transition-colors ${
                viewMode === "blueprint"
                  ? "bg-primary text-white"
                  : "text-primary/60 hover:text-primary"
              }`}
            >
              Blueprint
            </button>
            <button
              type="button"
              onClick={() => setViewMode("3d")}
              className={`rounded-md px-4 py-2 font-body text-sm font-medium transition-colors ${
                viewMode === "3d"
                  ? "bg-primary text-white"
                  : "text-primary/60 hover:text-primary"
              }`}
            >
              Walkthrough
            </button>
          </div>
        </div>
      </header>

      {tour.floors.length > 1 ? (
        <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {tour.floors.map((floor) => {
              const isActive = floor.id === activeFloor.id;
              return (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => setActiveFloorId(floor.id)}
                  className={`min-h-10 rounded-full px-4 font-body text-sm font-bold transition-colors ${
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
        </div>
      ) : null}

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6 lg:px-8">
        {viewMode === "blueprint" ? (
          <BlueprintCanvas svg={blueprintSVG} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
            <FloorPlan3DView
              floor={floorForView}
              rooms={roomsForView}
              graph={graph}
              onRoomClick={(roomId) => {
                window.location.href = `/tours/${publicId}?room=${roomId}`;
              }}
            />
          </div>
        )}

        <p className="mt-4 text-center font-body text-xs text-muted">
          {graph.disclaimer}
        </p>
      </div>
    </main>
  );
}
