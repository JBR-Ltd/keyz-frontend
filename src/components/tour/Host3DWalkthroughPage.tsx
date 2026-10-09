// src/components/tour/Host3DWalkthroughPage.tsx
//
// Host-side dedicated 3D walkthrough page. Loads the property's floors, picks
// the requested one (?floor=), builds the graph from the saved floor plan
// (falling back to the computed layout when no plan exists yet), and renders
// FloorPlan3DView on its own.

"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LayoutGrid, Loader2 } from "lucide-react";
import FloorPlan3DView from "@/components/tour/FloorPlan3DView";
import { useToast } from "@/components/ui/toast";
import { getFloorsForProperty } from "@/lib/api/tours/floors";
import { getFloorPlan } from "@/lib/api/tours/floorPlans";
import { getRoomsForFloor } from "@/lib/api/tours/rooms";
import { getStaircasesForFloor } from "@/lib/api/tours/staircases";
import { buildGraph } from "@/lib/tour/buildGraph";
import { computeLayout } from "@/lib/tour/floorPlanLayout";
import type {
  Floor,
  FloorPlanResponse,
  Room,
  Staircase,
} from "@/lib/types/tour";

interface Host3DWalkthroughPageProps {
  propertyId: number;
  role: "agent" | "landlord";
  initialFloorId?: number;
}

interface FloorBundle {
  floor: Floor;
  rooms: Room[];
  staircases: Staircase[];
  plan: FloorPlanResponse | null;
}

export default function Host3DWalkthroughPage({
  propertyId,
  role,
  initialFloorId,
}: Host3DWalkthroughPageProps): ReactElement {
  const { notify } = useToast();
  const router = useRouter();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<number | null>(
    initialFloorId ?? null,
  );
  const [bundle, setBundle] = useState<FloorBundle | null>(null);
  const [isLoadingFloors, setIsLoadingFloors] = useState(true);
  const [isLoadingBundle, setIsLoadingBundle] = useState(false);
  const [error, setError] = useState("");

  // Load the property's floors once.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const list = await getFloorsForProperty(propertyId);
        if (!active) return;
        setFloors(list);
        if (list.length === 0) {
          setError(
            "This property has no floors yet. Start the tour to add one.",
          );
          setIsLoadingFloors(false);
          return;
        }
        setActiveFloorId((current) =>
          current !== null && list.some((f) => f.id === current)
            ? current
            : list[0].id,
        );
        setIsLoadingFloors(false);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load the floors.",
        );
        setIsLoadingFloors(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [propertyId]);

  // Load rooms, staircases and the saved floor plan for the active floor.
  useEffect(() => {
    if (activeFloorId === null) return;
    let active = true;
    // Deferred, so the effect body itself never sets state
    queueMicrotask(() => {
      if (active) setIsLoadingBundle(true);
    });
    void (async () => {
      try {
        const [rooms, staircases, plan] = await Promise.all([
          getRoomsForFloor(activeFloorId),
          getStaircasesForFloor(activeFloorId),
          getFloorPlan(activeFloorId).catch(() => null),
        ]);
        if (!active) return;
        const floor = floors.find((f) => f.id === activeFloorId);
        if (!floor) {
          setError("That floor could not be found.");
          setIsLoadingBundle(false);
          return;
        }
        setBundle({ floor, rooms, staircases, plan });
        setIsLoadingBundle(false);
      } catch (err) {
        if (!active) return;
        notify({
          title: "Could not load the walkthrough",
          description: err instanceof Error ? err.message : undefined,
          variant: "error",
        });
        setIsLoadingBundle(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeFloorId, floors, notify]);

  const graph = useMemo(() => {
    if (!bundle) return null;
    const layout = computeLayout(bundle.rooms);
    return buildGraph({
      floorId: bundle.floor.id,
      floorName: bundle.floor.name,
      confirmed: bundle.plan?.confirmed ?? false,
      placements: bundle.plan?.placements ?? layout.placements,
      unplacedRoomIds: bundle.plan?.unplacedRoomIds ?? layout.unplacedRoomIds,
      rooms: bundle.rooms,
      staircases: bundle.staircases,
      derivedEdges: layout.edges,
    });
  }, [bundle]);

  const floorForView = useMemo<Floor | null>(() => {
    if (!bundle) return null;
    return {
      id: bundle.floor.id,
      propertyId,
      floorNumber: bundle.floor.floorNumber,
      name: bundle.floor.name,
      isFloorPlanConfirmed: bundle.plan?.confirmed ?? false,
      floorPlanConfirmedAt: null,
    };
  }, [bundle, propertyId]);

  const handleRoomClick = (roomId: number): void => {
    if (activeFloorId === null) return;
    const params = new URLSearchParams();
    params.set("floor", String(activeFloorId));
    params.set("room", String(roomId));
    router.push(`/${role}/listings/${propertyId}/tour?${params.toString()}`);
  };

  if (isLoadingFloors) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (error || floors.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-body text-sm text-red-700">
          {error || "This property has no floors yet."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${role}/listings/${propertyId}/rooms`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:border-accent"
          >
            <ArrowLeft size={15} />
            Back to rooms
          </Link>
          <Link
            href={`/${role}/listings/${propertyId}/tour`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white"
          >
            Open the tour wizard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-10 lg:pt-12">
        <Link
          href={
            activeFloorId !== null
              ? `/${role}/listings/${propertyId}/floor-plan?floor=${activeFloorId}`
              : `/${role}/listings/${propertyId}/rooms`
          }
          className="inline-flex items-center gap-2 font-body text-sm font-medium text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to floor plan
        </Link>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
              3D walkthrough
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-primary">
              {bundle?.floor.name ?? "Walkthrough"}
            </h1>
            <p className="mt-2 max-w-2xl font-body text-sm text-muted">
              Step inside the schematic. Click a room to jump straight into
              its capture.
            </p>
          </div>

          {activeFloorId !== null ? (
            <Link
              href={`/${role}/listings/${propertyId}/floor-plan?floor=${activeFloorId}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LayoutGrid size={15} aria-hidden="true" />
              Open floor plan
            </Link>
          ) : null}
        </header>

        {floors.length > 1 ? (
          <nav
            aria-label="Floors"
            className="mt-6 flex flex-wrap gap-2 rounded-lg border border-border bg-bg p-1.5"
          >
            {floors.map((f) => {
              const isActive = f.id === activeFloorId;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFloorId(f.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-md px-4 py-2 font-body text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {f.name}
                </button>
              );
            })}
          </nav>
        ) : null}

        <div className="mt-8">
          {isLoadingBundle || !bundle || !graph || !floorForView ? (
            <div className="flex min-h-[600px] items-center justify-center rounded-xl border border-border bg-bg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm">
              <FloorPlan3DView
                floor={floorForView}
                rooms={bundle.rooms}
                graph={graph}
                onRoomClick={handleRoomClick}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
