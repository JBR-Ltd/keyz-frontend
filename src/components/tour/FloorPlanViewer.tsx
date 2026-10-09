"use client";

import type { ReactElement } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Layers,
  Loader2,
  RefreshCw,
} from "lucide-react";
import BlueprintCanvas from "@/components/tour/BlueprintCanvas";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
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
  onConfirm?: () => void | Promise<void>;
  onRoomClick?: (roomId: number) => void | Promise<void>;
}

type ViewMode = "blueprint" | "3d";
type NudgeDirection = "up" | "down" | "left" | "right";

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
  const [pendingNudge, setPendingNudge] = useState<NudgeDirection | null>(null);
  const [isOpeningRoom, setIsOpeningRoom] = useState(false);
  const [isOpeningOverview, setIsOpeningOverview] = useState(false);

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
      await onConfirm?.();
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

  const handleGoToOverview = useCallback(async () => {
    if (!onConfirm) return;
    setIsOpeningOverview(true);
    try {
      await onConfirm();
    } finally {
      setIsOpeningOverview(false);
    }
  }, [onConfirm]);

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
    async (roomId: number, dx: number, dy: number): Promise<void> => {
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

  const handleNudgeClick = async (
    direction: NudgeDirection,
    dx: number,
    dy: number,
  ): Promise<void> => {
    if (selectedRoomId === null) return;
    setPendingNudge(direction);
    try {
      await handleNudge(selectedRoomId, dx, dy);
    } finally {
      setPendingNudge(null);
    }
  };

  const handleStepInside = async (): Promise<void> => {
    if (!onRoomClick || selectedRoomId === null) return;
    setIsOpeningRoom(true);
    try {
      await onRoomClick(selectedRoomId);
    } finally {
      setIsOpeningRoom(false);
    }
  };

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
          aria-busy={isSaving}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <AsyncButtonContent
            isPending={isSaving}
            pendingLabel="Generating…"
          >
            Generate floor plan
          </AsyncButtonContent>
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
            <div
  data-tour="plan-tabs"
  className="flex gap-1 rounded-lg border border-border bg-bg p-0.5"
>
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
              disabled={pendingNudge !== null}
              onClick={() => void handleNudgeClick("up", 0, -1)}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-bg font-body text-xs font-bold text-primary hover:border-accent disabled:cursor-wait disabled:opacity-60"
            >
              {pendingNudge === "up" ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                "Up"
              )}
            </button>
            <button
              type="button"
              disabled={pendingNudge !== null}
              onClick={() => void handleNudgeClick("down", 0, 1)}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-bg font-body text-xs font-bold text-primary hover:border-accent disabled:cursor-wait disabled:opacity-60"
            >
              {pendingNudge === "down" ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                "Down"
              )}
            </button>
            <button
              type="button"
              disabled={pendingNudge !== null}
              onClick={() => void handleNudgeClick("left", -1, 0)}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-bg font-body text-xs font-bold text-primary hover:border-accent disabled:cursor-wait disabled:opacity-60"
            >
              {pendingNudge === "left" ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                "Left"
              )}
            </button>
            <button
              type="button"
              disabled={pendingNudge !== null}
              onClick={() => void handleNudgeClick("right", 1, 0)}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-bg font-body text-xs font-bold text-primary hover:border-accent disabled:cursor-wait disabled:opacity-60"
            >
              {pendingNudge === "right" ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                "Right"
              )}
            </button>
          </div>
          {onRoomClick && !nodeById.get(selectedRoomId)?.isStaircase ? (
            <button
              type="button"
              disabled={isOpeningRoom}
              aria-busy={isOpeningRoom}
              onClick={() => void handleStepInside()}
              className="mt-3 w-full rounded-full bg-primary px-4 py-2 font-body text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
            >
              <AsyncButtonContent
                isPending={isOpeningRoom}
                pendingLabel="Opening room…"
              >
                Step inside this room →
              </AsyncButtonContent>
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-center font-body text-xs text-muted">
          In the Walkthrough, click a room to select it. In the Blueprint,
          drag to pan and pinch or scroll to zoom.
        </p>
      )}

     <div data-tour="plan-actions" className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isSaving}
          aria-busy={isSaving}
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
            aria-busy={isConfirming}
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
            {onConfirm ? (
              <button
                type="button"
                disabled={isOpeningOverview}
                aria-busy={isOpeningOverview}
                onClick={() => void handleGoToOverview()}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-6 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
              >
                <AsyncButtonContent
                  isPending={isOpeningOverview}
                  pendingLabel="Opening overview…"
                >
                  Go to overview
                </AsyncButtonContent>
              </button>
            ) : null}
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
