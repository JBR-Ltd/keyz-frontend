"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

interface BlueprintCanvasProps {
  svg: string;
  className?: string;
}

/**
 * The shared, clamped zoom + pan surface for a floor-plan SVG.
 *
 * Zoom-out stops at 100% so the SVG always fills its frame — the user never
 * sees the blank background around it. Zoom-in goes up to 400%. Panning only
 * works above 100%, and the offset snaps back to origin the moment zoom
 * returns to 100%.
 */
export default function BlueprintCanvas({
  svg,
  className,
}: BlueprintCanvasProps): ReactElement {
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

  // When we return to 100%, drop any pan so the SVG sits flush in the frame.
  useEffect(() => {
    if (zoom <= MIN_ZOOM) {
      setOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Native wheel listener with { passive: false } so preventDefault() stops
  // the page from scrolling behind the canvas. React's synthetic onWheel is
  // passive in some setups, which silently ignores preventDefault.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // At 100% the SVG already fills the frame, so panning could only reveal
    // whitespace. Require a zoom first.
    if (zoom <= MIN_ZOOM) return;
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
        MIN_ZOOM,
        Math.min(MAX_ZOOM, g.startZoom * (distance / g.startDistance)),
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
      className={cn(
        "relative h-[480px] w-full touch-none select-none overflow-hidden overscroll-contain rounded-lg border border-border bg-white sm:h-[560px]",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: zoom <= MIN_ZOOM ? "default" : "grab" }}
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
