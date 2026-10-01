"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { VisibleRangePlugin } from "@photo-sphere-viewer/visible-range-plugin";

import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";

interface TourLink {
  nodeId: string;
  name: string;
  position: { yaw: string; pitch: string };
}

interface TourNode {
  id: string;
  panorama: string;
  name?: string;
  caption?: string;
  links: TourLink[];
}

interface FloorOption {
  id: number;
  name: string;
  levelIndex: number;
}

interface RoomOption {
  id: number;
  roomName: string;
  panorama: string | null;
}

interface PanoramaViewerProps {
  nodes: TourNode[];
  startNodeId: string;
  activeNodeId: string;
  onNodeChange: (nodeId: string) => void;
  rooms?: RoomOption[];
  floors?: FloorOption[];
  currentFloorId?: number;
  onFloorChange?: (floorId: number) => void;
}

const HORIZONTAL_RANGE: [string, string] = ["-175deg", "175deg"];

// The visible range plugin clamps yaw to [-175, 175]. Degrees.
const LEFT_BOUNDARY_DEG = -175;
const RIGHT_BOUNDARY_DEG = 175;
// How close to a boundary counts as "already there". Keeps a tiny residual
// from the animation from leaving the button enabled.
const BOUNDARY_EPSILON_DEG = 3;

function RotateIcon({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <path
        d="M4 12a8 8 0 1 1 2.6 5.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M4 17v-5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <path
        d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FloorsIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 11h.01M15 11h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PanoramaViewer({
  nodes,
  startNodeId,
  activeNodeId,
  onNodeChange,
  rooms = [],
  floors = [],
  currentFloorId,
  onFloorChange,
}: PanoramaViewerProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<Viewer | null>(null);
  const tourPluginRef = useRef<VirtualTourPlugin | null>(null);
  const lastAppliedNodeId = useRef<string>(startNodeId);
  const onNodeChangeRef = useRef(onNodeChange);
  onNodeChangeRef.current = onNodeChange;

  const [roomStartIndex, setRoomStartIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [currentYaw, setCurrentYaw] = useState(0);

  const lastPaginationKey = useRef<string>(`${activeNodeId}:5`);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 640 ? 3 : 5);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Viewer({
      container: containerRef.current,
      defaultZoomLvl: 0,
      defaultPitch: 0,
      navbar: false,
      plugins: [
        VirtualTourPlugin.withConfig({
          nodes,
          startNodeId,
          renderMode: "3d",
          transitionOptions: {
            rotation: true,
            speed: "20rpm",
            effect: "fade",
          },
        }),
        VisibleRangePlugin.withConfig({
          horizontalRange: HORIZONTAL_RANGE,
          verticalRange: ["0deg", "0deg"],
        }),
      ],
    });

    viewerInstanceRef.current = viewer;
    const tourPlugin = viewer.getPlugin(
      VirtualTourPlugin,
    ) as VirtualTourPlugin | null;
    tourPluginRef.current = tourPlugin;

    const handlePositionUpdated = (event: unknown) => {
      const e = event as { position?: { yaw: number } };
      if (e.position) setCurrentYaw(e.position.yaw);
    };
    viewer.addEventListener("position-updated", handlePositionUpdated as never);

    let cleanupNodeChanged: (() => void) | null = null;

    if (tourPlugin) {
      const handleNodeChanged = (event: { node: Pick<TourNode, "id"> }) => {
        lastAppliedNodeId.current = event.node.id;
        onNodeChangeRef.current(event.node.id);
      };
      tourPlugin.addEventListener("node-changed", handleNodeChanged);
      cleanupNodeChanged = () =>
        tourPlugin.removeEventListener("node-changed", handleNodeChanged);
    }

    return () => {
      viewer.removeEventListener("position-updated", handlePositionUpdated);
      cleanupNodeChanged?.();
      viewer.destroy();
      viewerInstanceRef.current = null;
      tourPluginRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tourPlugin = tourPluginRef.current;
    if (!tourPlugin) return;
    if (lastAppliedNodeId.current === activeNodeId) return;
    lastAppliedNodeId.current = activeNodeId;
    tourPlugin.setCurrentNode(activeNodeId);
  }, [activeNodeId]);

  useEffect(() => {
    const key = `${activeNodeId}:${itemsPerPage}`;
    if (lastPaginationKey.current === key) return;
    lastPaginationKey.current = key;

    if (!rooms.length) return;
    const activeIndex = rooms.findIndex((r) => String(r.id) === activeNodeId);
    if (activeIndex === -1) return;
    const pageStart = Math.floor(activeIndex / itemsPerPage) * itemsPerPage;
    setRoomStartIndex(pageStart);
  }, [activeNodeId, rooms, itemsPerPage]);

  // === Room navigation (image-overlay arrows) ===

  const moveToAdjacentRoom = (direction: 1 | -1): void => {
    if (rooms.length === 0) return;
    const idx = rooms.findIndex((r) => String(r.id) === activeNodeId);
    if (idx === -1) return;

    for (let step = 1; step <= rooms.length; step++) {
      const raw = idx + direction * step;
      const probe = ((raw % rooms.length) + rooms.length) % rooms.length;
      const target = rooms[probe];
      if (target && target.panorama !== null) {
        onNodeChange(String(target.id));
        return;
      }
    }
  };

  const hasOtherReadyRoom = rooms.some(
    (r) => r.panorama !== null && String(r.id) !== activeNodeId,
  );

  // === Pagination (room-selector arrows in the dock) ===

  const paginateBack = () => {
    setRoomStartIndex((prev) => Math.max(0, prev - itemsPerPage));
  };

  const paginateForward = () => {
    setRoomStartIndex((prev) =>
      Math.min(
        Math.max(0, rooms.length - itemsPerPage),
        prev + itemsPerPage,
      ),
    );
  };

  // === Sweep ===

  const currentYawDeg = (currentYaw * 180) / Math.PI;
  const atLeftBoundary =
    currentYawDeg <= LEFT_BOUNDARY_DEG + BOUNDARY_EPSILON_DEG;
  const atRightBoundary =
    currentYawDeg >= RIGHT_BOUNDARY_DEG - BOUNDARY_EPSILON_DEG;

  const handleSweep = (direction: "left" | "right") => {
    const viewer = viewerInstanceRef.current;
    if (!viewer || isSweeping) return;

    // Aim at the boundary on the pressed side. The visible-range plugin
    // clamps yaw at that boundary, so this is a straight sweep from
    // wherever the camera currently is to the edge.
    const targetDeg =
      direction === "left" ? LEFT_BOUNDARY_DEG : RIGHT_BOUNDARY_DEG;

    setIsSweeping(true);
    const clear = () => setIsSweeping(false);

    try {
      const result = viewer.animate({
        yaw: `${targetDeg}deg`,
        speed: "3rpm",
      });
      const maybeThenable = result as unknown as { then?: unknown } | undefined;
      if (
        maybeThenable &&
        typeof maybeThenable.then === "function"
      ) {
        (maybeThenable as unknown as Promise<void>).then(clear, clear);
      } else {
        window.setTimeout(clear, 8000);
      }
    } catch {
      clear();
    }
  };

  const handleZoom = (delta: number) => {
    const viewer = viewerInstanceRef.current;
    if (!viewer) return;
    try {
      const currentZoom = viewer.getZoomLevel();
      viewer.zoom(Math.min(100, Math.max(0, currentZoom + delta)));
    } catch (err) {
      console.error("Zoom failed:", err);
    }
  };

  const handleToggleFullscreen = () => {
    viewerInstanceRef.current?.toggleFullscreen();
  };

  const sortedFloors = [...floors].sort((a, b) => a.levelIndex - b.levelIndex);
  const currentFloorIndex = sortedFloors.findIndex(
    (f) => f.id === currentFloorId,
  );
  const nextFloor =
    currentFloorIndex >= 0 && currentFloorIndex < sortedFloors.length - 1
      ? sortedFloors[currentFloorIndex + 1]
      : null;

  const handleGoToNextFloor = () => {
    if (!nextFloor || !onFloorChange) return;
    onFloorChange(nextFloor.id);
  };

  const visibleRooms = rooms.slice(
    roomStartIndex,
    roomStartIndex + itemsPerPage,
  );
  const canPaginateBack = roomStartIndex > 0;
  const canPaginateForward = roomStartIndex + itemsPerPage < rooms.length;
  const showFloorControls =
    floors.length > 1 && onFloorChange && currentFloorId !== undefined;

  return (
    <div className="flex h-full w-full flex-col bg-[#0a1622] p-2 md:p-0">
      <div className="relative mx-auto h-[50vh] w-full max-w-full overflow-hidden rounded-2xl border border-white/10 md:mx-0 md:h-full md:rounded-none md:border-none">
        <div ref={containerRef} className="h-full w-full" />

        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ boxShadow: "inset 0 0 100px rgba(9,26,40,0.6)" }}
        />

        {rooms.length > 0 ? (
          <>
            <button
              type="button"
              disabled={!hasOtherReadyRoom}
              onClick={() => moveToAdjacentRoom(-1)}
              className={`absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-xl transition-all sm:h-12 sm:w-12 ${
                hasOtherReadyRoom
                  ? "border-sky-400/50 bg-[#0a1622]/90 text-white hover:border-sky-300 hover:bg-[#0a1622] active:scale-95"
                  : "pointer-events-none opacity-0"
              }`}
              aria-label="Previous room"
              title="Previous room"
            >
              <ChevronIcon direction="left" />
            </button>

            <button
              type="button"
              disabled={!hasOtherReadyRoom}
              onClick={() => moveToAdjacentRoom(1)}
              className={`absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-xl transition-all sm:h-12 sm:w-12 ${
                hasOtherReadyRoom
                  ? "border-sky-400/50 bg-[#0a1622]/90 text-white hover:border-sky-300 hover:bg-[#0a1622] active:scale-95"
                  : "pointer-events-none opacity-0"
              }`}
              aria-label="Next room"
              title="Next room"
            >
              <ChevronIcon direction="right" />
            </button>
          </>
        ) : null}

        {showFloorControls ? (
          <div className="pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-2">
            <button
              type="button"
              disabled={!nextFloor}
              onClick={handleGoToNextFloor}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg transition ${
                nextFloor
                  ? "border-sky-400/50 bg-[#0a1622]/95 text-sky-200 hover:border-sky-300 hover:bg-[#0a1622] active:scale-95"
                  : "cursor-not-allowed border-white/10 bg-[#0a1622]/70 text-white/40"
              }`}
            >
              <FloorsIcon />
              <span className="whitespace-nowrap">
                {nextFloor ? `Next: ${nextFloor.name}` : "Top floor"}
              </span>
            </button>
          </div>
        ) : null}
      </div>

      {showFloorModal && showFloorControls ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-white/20 bg-[#0a1622] p-4 shadow-2xl">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-sky-300">
              <FloorsIcon /> Switch floor
            </h3>
            <div className="flex flex-col gap-2">
              {sortedFloors.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    onFloorChange?.(f.id);
                    setShowFloorModal(false);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    f.id === currentFloorId
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span>{f.name}</span>
                  {f.id === currentFloorId ? (
                    <span className="text-[10px] uppercase text-sky-300">
                      Active
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowFloorModal(false)}
              className="mt-4 w-full rounded-xl bg-white/10 py-2 text-xs font-medium text-white/70 hover:bg-white/15"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-white/15 bg-[#0a1622] p-2.5 shadow-2xl md:absolute md:bottom-4 md:left-4 md:right-4 md:z-20 md:mt-0 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
          {showFloorControls ? (
            <button
              type="button"
              onClick={() => setShowFloorModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 text-xs font-semibold text-sky-200 transition-all hover:border-sky-300 hover:bg-sky-500/20 active:scale-95"
            >
              <FloorsIcon />
              <span>Floors</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => handleSweep("left")}
            disabled={isSweeping || atLeftBoundary}
            aria-label="Turn full left"
            title={
              atLeftBoundary
                ? "Already at the left edge"
                : "Sweep to the left edge"
            }
            className="flex h-9 items-center gap-1.5 rounded-full border border-sky-400/40 bg-white/5 px-3 text-xs font-medium text-sky-200 transition-all hover:border-sky-300 hover:bg-sky-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateIcon />
            <span>Turn Full Left</span>
          </button>

          <button
            type="button"
            onClick={() => handleSweep("right")}
            disabled={isSweeping || atRightBoundary}
            aria-label="Turn full right"
            title={
              atRightBoundary
                ? "Already at the right edge"
                : "Sweep to the right edge"
            }
            className="flex h-9 items-center gap-1.5 rounded-full border border-sky-400/40 bg-white/5 px-3 text-xs font-medium text-sky-200 transition-all hover:border-sky-300 hover:bg-sky-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateIcon flip />
            <span>Turn Full Right</span>
          </button>

          <div className="hidden h-5 w-px bg-white/15 sm:block" />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleZoom(15)}
              aria-label="Zoom in"
              title="Zoom In"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-base font-bold text-white/80 transition-all hover:border-white/30 hover:bg-white/10 active:scale-95"
            >
              +
            </button>

            <button
              type="button"
              onClick={() => handleZoom(-15)}
              aria-label="Zoom out"
              title="Zoom Out"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-base font-bold text-white/80 transition-all hover:border-white/30 hover:bg-white/10 active:scale-95"
            >
              −
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label="Toggle fullscreen"
              title="Fullscreen"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm text-white/80 transition-all hover:border-white/30 hover:bg-white/10 active:scale-95"
            >
              ⛶
            </button>
          </div>
        </div>

        {rooms.length > 0 ? (
          <div className="flex w-full items-center justify-end gap-1.5 md:ml-auto md:w-auto">
            <button
              type="button"
              disabled={!canPaginateBack}
              onClick={paginateBack}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                canPaginateBack
                  ? "border-white/20 bg-white/5 text-white hover:border-sky-300 hover:bg-sky-500/10 active:scale-95"
                  : "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/30"
              }`}
              title="Show previous rooms"
              aria-label="Show previous rooms"
            >
              <ChevronIcon direction="left" />
            </button>

            <div className="grid flex-1 grid-cols-3 gap-1 sm:grid-cols-5 md:w-[480px]">
              {visibleRooms.map((room) => {
                const isActive = String(room.id) === activeNodeId;
                const isReady = room.panorama !== null;
                return (
                  <button
                    key={room.id}
                    type="button"
                    disabled={!isReady}
                    onClick={() => onNodeChange(String(room.id))}
                    title={room.roomName}
                    className={`flex h-8 w-full items-center justify-center rounded-full border px-2 text-[11px] font-medium transition-all ${
                      isActive
                        ? "border-sky-300 bg-sky-500/20 text-sky-100 shadow-md shadow-sky-500/10"
                        : isReady
                          ? "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                          : "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/30"
                    }`}
                  >
                    <span className="truncate text-center">
                      {room.roomName}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!canPaginateForward}
              onClick={paginateForward}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                canPaginateForward
                  ? "border-white/20 bg-white/5 text-white hover:border-sky-300 hover:bg-sky-500/10 active:scale-95"
                  : "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/30"
              }`}
              title="Show next rooms"
              aria-label="Show next rooms"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
