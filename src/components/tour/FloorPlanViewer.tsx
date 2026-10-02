"use client";

import type { ReactElement } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Layers,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import FloorPlan3DView from "@/components/tour/FloorPlan3DView";
import {
  confirmFloorPlan,
  deleteFloorPlan,
  getFloorPlan,
  putFloorPlan,
} from "@/lib/api/tours/floorPlans";
import { nudgeRoomPlacement } from "@/lib/api/tours/rooms";
import { computeLayout } from "@/lib/tour/floorPlanLayout";
import { buildGraph } from "@/lib/tour/buildGraph";
import { generateSimpleBlueprint } from "@/lib/tour/blueprint";
import type {
  Floor,
  FloorPlanResponse,
  Room,
  Staircase,
} from "@/lib/types/tour";

interface FloorPlanViewerProps {
  floorId: number;
  floorName?: string;
  rooms: Room[];
  staircases?: Staircase[];
  previewHref?: string;
  onBackToFloors?: () => void;
  onConfirm?: () => void;
  onRoomClick?: (roomId: number) => void;
}

type ViewMode = "blueprint" | "3d";

// ============================================================
// Blueprint canvas: drag to pan, wheel/pinch to zoom
// ============================================================

interface BlueprintCanvasProps {
  svg: string;
}

function BlueprintCanvas({ svg }: BlueprintCanvasProps): ReactElement {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureRef = useRef<{
    startOffset: { x: number; y: number };
    startCenter: { x: number; y: number };
    startDistance: number;
    startZoom: number;
  } | null>(null);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Native wheel listener with { passive: false } so preventDefault() stops
  // the page from scrolling behind the canvas. React's synthetic onWheel is
  // passive in some setups, which silently ignores preventDefault.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.5, Math.min(4, z * factor)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pts = Array.from(pointersRef.current.values());
    if (pts.length === 1) {
      gestureRef.current = {
        startOffset: offset,
        startCenter: pts[0],
        startDistance: 0,
        startZoom: zoom,
      };
    } else if (pts.length === 2) {
      const [a, b] = pts;
      gestureRef.current = {
        startOffset: offset,
        startCenter: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        startDistance: Math.hypot(a.x - b.x, a.y - b.y),
        startZoom: zoom,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gestureRef.current;
    if (!g) return;
    const pts = Array.from(pointersRef.current.values());

    if (pts.length === 1) {
      setOffset({
        x: g.startOffset.x + (pts[0].x - g.startCenter.x),
        y: g.startOffset.y + (pts[0].y - g.startCenter.y),
      });
    } else if (pts.length === 2 && g.startDistance > 0) {
      const [a, b] = pts;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const next = Math.max(
        0.5,
        Math.min(4, g.startZoom * (distance / g.startDistance)),
      );
      setZoom(next);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    const remaining = Array.from(pointersRef.current.values());
    if (remaining.length === 0) {
      gestureRef.current = null;
    } else if (remaining.length === 1) {
      gestureRef.current = {
        startOffset: offset,
        startCenter: remaining[0],
        startDistance: 0,
        startZoom: zoom,
      };
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-[480px] w-full touch-none select-none overflow-hidden overscroll-contain rounded-lg border border-border bg-white sm:h-[560px]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: "grab" }}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center [&>svg]:pointer-events-none"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <div
          className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5">
        <span className="rounded-full bg-black/55 px-2 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={reset}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 font-body text-[10px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <Maximize2 size={10} aria-hidden="true" />
          Reset
        </button>
      </div>

      <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white/90 backdrop-blur-sm">
        Drag to pan · Pinch or scroll to zoom
      </p>
    </div>
  );
}

// ============================================================
// FloorPlanViewer
// ============================================================

export default function FloorPlanViewer({
  floorId,
  floorName,
  rooms,
  staircases = [],
  previewHref,
  onBackToFloors,
  onConfirm,
  onRoomClick,
}: FloorPlanViewerProps): ReactElement {
  const { notify } = useToast();
  const [plan, setPlan] = useState<FloorPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("blueprint");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await getFloorPlan(floorId);
      setPlan(fetched);
    } catch {
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [floorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (source: FloorPlanResponse): Promise<void> => {
      setIsSaving(true);
      try {
        const saved = await putFloorPlan(floorId, {
          placements: source.placements,
        });
        setPlan(saved);
        notify({ title: "Floor plan saved", variant: "success" });
      } catch (error) {
        notify({
          title: "Could not save the floor plan",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [floorId, notify],
  );

  const handleGenerate = useCallback(async () => {
    if (rooms.length === 0) {
      notify({ title: "Add a room first", variant: "error" });
      return;
    }
    const layout = computeLayout(rooms);
    const draft: FloorPlanResponse = {
      floorId,
      floorName: plan?.floorName ?? floorName ?? "",
      confirmed: false,
      placements: layout.placements,
      unplacedRoomIds: layout.unplacedRoomIds,
    };
    await save(draft);
  }, [floorId, floorName, plan?.floorName, rooms, notify, save]);

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      await confirmFloorPlan(floorId);
      await load();
      onConfirm?.();
    } catch (error) {
      notify({
        title: "Could not confirm the floor plan",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsConfirming(false);
    }
  }, [floorId, load, notify, onConfirm]);

  const handleDeleteConfirmed = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteFloorPlan(floorId);
      setPlan(null);
      setShowDeleteConfirm(false);
      notify({ title: "Floor plan deleted", variant: "success" });
    } catch (error) {
      notify({
        title: "Could not delete the floor plan",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [floorId, notify]);

  const handleNudge = useCallback(
    async (roomId: number, dx: number, dy: number) => {
      const placement = plan?.placements.find((p) => p.roomId === roomId);
      if (!placement || placement.gridX === null || placement.gridY === null) {
        return;
      }
      try {
        await nudgeRoomPlacement(
          roomId,
          placement.gridX + dx,
          placement.gridY + dy,
        );
        await load();
      } catch (error) {
        notify({
          title: "Could not move the room",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      }
    },
    [plan, load, notify],
  );

  const graph = useMemo(() => {
    if (!plan) return null;
    const layout = computeLayout(rooms);
    return buildGraph({
      floorId,
      floorName: plan.floorName,
      confirmed: plan.confirmed,
      placements: plan.placements,
      unplacedRoomIds: plan.unplacedRoomIds,
      rooms,
      staircases,
      derivedEdges: layout.edges,
    });
  }, [plan, rooms, floorId, staircases]);

  const floorForView: Floor = useMemo(
    () => ({
      id: floorId,
      propertyId: 0,
      floorNumber: 0,
      name: plan?.floorName ?? floorName ?? "Floor",
      isFloorPlanConfirmed: plan?.confirmed ?? false,
      floorPlanConfirmedAt: null,
    }),
    [floorId, floorName, plan?.floorName, plan?.confirmed],
  );

  const blueprintSVG = useMemo(() => {
    if (!graph) return "";
    return generateSimpleBlueprint(graph, rooms);
  }, [graph, rooms]);

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading floor plan" className="space-y-4">
        <Skeleton className="h-[360px] w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-11 w-20 rounded-full" />
        </div>
        <span className="sr-only">Loading floor plan</span>
      </div>
    );
  }

  if (!plan || plan.placements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-surface-soft p-8 text-center">
          <p className="font-body text-sm font-bold text-primary">
            No floor plan yet
          </p>
          <p className="mt-2 font-body text-xs text-muted">
            Generate a schematic from the rooms and doors you captured.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isSaving || rooms.length === 0}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Generating…" : "Generate floor plan"}
        </button>
        {rooms.length === 0 ? (
          <p className="text-center font-body text-xs text-muted">
            Add at least one room to generate a floor plan.
          </p>
        ) : null}
      </div>
    );
  }

  const nodeById = new Map(
    (graph?.nodes ?? []).map((n) => [n.roomId, n] as const),
  );

  const unplacedNames = plan.unplacedRoomIds
    .map(
      (id) =>
        nodeById.get(id)?.name ??
        rooms.find((r) => r.id === id)?.roomName ??
        `Room ${id}`,
    )
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface-soft p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-[11px] font-medium uppercase tracking-wide text-muted">
            {graph?.disclaimer ?? "Interactive floor plan"}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {onBackToFloors ? (
              <button
                type="button"
                onClick={onBackToFloors}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-bg px-3 py-1.5 font-body text-xs font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
              >
                <Layers size={12} aria-hidden="true" />
                Back to floors
              </button>
            ) : null}
            <div className="flex gap-1 rounded-lg border border-border bg-bg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("blueprint")}
                className={`rounded-md px-3 py-1.5 font-body text-xs font-bold transition-colors ${
                  viewMode === "blueprint"
                    ? "bg-primary text-white"
                    : "text-primary/70 hover:text-primary"
                }`}
              >
                Blueprint
              </button>
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`rounded-md px-3 py-1.5 font-body text-xs font-bold transition-colors ${
                  viewMode === "3d"
                    ? "bg-primary text-white"
                    : "text-primary/70 hover:text-primary"
                }`}
              >
                Walkthrough
              </button>
            </div>

            {previewHref ? (
              <Link
                href={previewHref}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-bg px-3 py-1.5 font-body text-xs font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
              >
                <ExternalLink size={12} aria-hidden="true" />
                Preview as renter
              </Link>
            ) : null}
          </div>
        </div>

        {viewMode === "blueprint" ? (
          <BlueprintCanvas svg={blueprintSVG} />
        ) : graph ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <FloorPlan3DView
              floor={floorForView}
              rooms={rooms}
              graph={graph}
              onRoomClick={onRoomClick}
            />
          </div>
        ) : null}

        {unplacedNames.length > 0 ? (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="font-body text-sm text-amber-800">
              {unplacedNames.length} room
              {unplacedNames.length === 1 ? "" : "s"} not yet wired into the
              layout: <strong>{unplacedNames.join(", ")}</strong>. They sit on
              the side of the plan. Add a door from the room they connect
              through, or leave them as is and confirm.
            </p>
          </div>
        ) : null}
      </div>

      {selectedRoomId !== null ? (
        <div className="rounded-lg border border-border bg-bg p-3">
          <p className="font-body text-xs font-bold text-primary">
            Nudge {nodeById.get(selectedRoomId)?.name ?? "room"}
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => void handleNudge(selectedRoomId, 0, -1)}
              className="min-h-9 rounded-md border border-border bg-bg font-body text-xs font-bold text-primary hover:border-accent"
            >
              Up
            </button>
            <button
              type="button"
              onClick={() => void handleNudge(selectedRoomId, 0, 1)}
              className="min-h-9 rounded-md border border-border bg-bg font-body text-xs font-bold text-primary hover:border-accent"
            >
              Down
            </button>
            <button
              type="button"
              onClick={() => void handleNudge(selectedRoomId, -1, 0)}
              className="min-h-9 rounded-md border border-border bg-bg font-body text-xs font-bold text-primary hover:border-accent"
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => void handleNudge(selectedRoomId, 1, 0)}
              className="min-h-9 rounded-md border border-border bg-bg font-body text-xs font-bold text-primary hover:border-accent"
            >
              Right
            </button>
          </div>
          {onRoomClick && !nodeById.get(selectedRoomId)?.isStaircase ? (
            <button
              type="button"
              onClick={() => onRoomClick(selectedRoomId)}
              className="mt-3 w-full rounded-full bg-primary px-4 py-2 font-body text-xs font-bold text-white transition-colors hover:bg-primary/90"
            >
              Step inside this room →
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-center font-body text-xs text-muted">
          In the Walkthrough, click a room to select it. In the Blueprint,
          drag to pan and pinch or scroll to zoom.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isSaving}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-bg px-6 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {isSaving ? "Regenerating…" : "Regenerate"}
        </button>
        {!plan.confirmed ? (
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isConfirming}
            className="flex-1 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? "Confirming…" : "Confirm floor plan"}
          </button>
        ) : (
          <>
            <span className="inline-flex min-h-11 flex-1 cursor-default items-center justify-center gap-2 rounded-full border border-green-300 bg-green-100 px-6 py-3 font-body text-sm font-bold text-green-800">
              <Check size={14} aria-hidden="true" />
              Confirmed
            </span>
            <button
              type="button"
              onClick={() => onConfirm?.()}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-6 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              Go to overview
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-full border border-red-300 bg-bg px-4 py-3 font-body text-sm font-bold text-red-700 transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this floor plan?"
        description="The room placements for this floor are removed and the plan will need confirming again before you can publish. You can regenerate it any time."
        confirmLabel="Delete floor plan"
        tone="danger"
        isConfirming={isDeleting}
        onConfirm={() => void handleDeleteConfirmed()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
