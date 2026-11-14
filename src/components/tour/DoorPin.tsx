"use client";

import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { WallSide } from "@/lib/types/tour";

export interface DoorPinPosition {
  wallSide: WallSide;
  alongWallPercent: number;
}

export interface DoorPinData {
  id: string;
  position: DoorPinPosition;
  isFixed: boolean;
  isActive: boolean;
  /**
   * Whether the pin can be dragged right now.
   *
   * Draft pins are always draggable; that is how they are positioned.
   * Saved doors are not draggable until the host opens the editor and
   * chooses to edit the connection, so a stray touch on a finished door
   * does not move it.
   */
  isEditable: boolean;
  leadsToLabel: string | null;
}

interface DoorPinProps {
  roomName: string;
  pins: DoorPinData[];
  onMove: (pinId: string, position: DoorPinPosition) => void;
  onDragEnd?: (pinId: string) => void;
  onSelect: (pinId: string) => void;
  onSelectFixed: (pinId: string) => void;
  onRemove: (pinId: string) => void;
}

const PERSON_INSET_PCT = 14;
const CONE_SPREAD_DEG = 70;
const CONE_LENGTH_PCT = 62;

function projectToNearestWall(x: number, y: number): DoorPinPosition {
  const candidates: Array<{ d: number; side: WallSide; along: number }> = [
    { d: y, side: "TOP", along: x },
    { d: 1 - y, side: "BOTTOM", along: x },
    { d: x, side: "LEFT", along: y },
    { d: 1 - x, side: "RIGHT", along: y },
  ];
  candidates.sort((a, b) => a.d - b.d);
  const nearest = candidates[0];
  const clampedAlong = Math.max(0.05, Math.min(0.95, nearest.along));
  return { wallSide: nearest.side, alongWallPercent: clampedAlong * 100 };
}

function pinToPercent(pin: DoorPinPosition): { left: string; top: string } {
  const along = Math.max(0, Math.min(100, pin.alongWallPercent)) / 100;
  switch (pin.wallSide) {
    case "TOP":
      return { left: `${along * 100}%`, top: "0%" };
    case "BOTTOM":
      return { left: `${along * 100}%`, top: "100%" };
    case "LEFT":
      return { left: "0%", top: `${along * 100}%` };
    case "RIGHT":
      return { left: "100%", top: `${along * 100}%` };
  }
}

function computeFacingCone(entry: DoorPinPosition | null): {
  personX: number;
  personY: number;
  conePoints: string;
  labelX: number;
  labelY: number;
} | null {
  if (!entry) return null;

  let entryX: number;
  let entryY: number;
  let facingDeg: number;

  switch (entry.wallSide) {
    case "TOP":
      entryX = entry.alongWallPercent;
      entryY = 0;
      facingDeg = 90;
      break;
    case "BOTTOM":
      entryX = entry.alongWallPercent;
      entryY = 100;
      facingDeg = -90;
      break;
    case "LEFT":
      entryX = 0;
      entryY = entry.alongWallPercent;
      facingDeg = 0;
      break;
    case "RIGHT":
      entryX = 100;
      entryY = entry.alongWallPercent;
      facingDeg = 180;
      break;
  }

  const facingRad = (facingDeg * Math.PI) / 180;
  const personX = entryX + Math.cos(facingRad) * PERSON_INSET_PCT;
  const personY = entryY + Math.sin(facingRad) * PERSON_INSET_PCT;

  const halfSpread = (CONE_SPREAD_DEG / 2) * (Math.PI / 180);
  const leftRad = facingRad - halfSpread;
  const rightRad = facingRad + halfSpread;

  const leftX = personX + Math.cos(leftRad) * CONE_LENGTH_PCT;
  const leftY = personY + Math.sin(leftRad) * CONE_LENGTH_PCT;
  const rightX = personX + Math.cos(rightRad) * CONE_LENGTH_PCT;
  const rightY = personY + Math.sin(rightRad) * CONE_LENGTH_PCT;

  const labelDistance = CONE_LENGTH_PCT * 0.45;
  const labelX = personX + Math.cos(facingRad) * labelDistance;
  const labelY = personY + Math.sin(facingRad) * labelDistance;

  return {
    personX,
    personY,
    conePoints: `${personX},${personY} ${leftX},${leftY} ${rightX},${rightY}`,
    labelX,
    labelY,
  };
}

export default function DoorPin({
  roomName,
  pins,
  onMove,
  onDragEnd,
  onSelect,
  onSelectFixed,
  onRemove,
}: DoorPinProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const entry = useMemo(() => {
    const fixed = pins.find((p) => p.isFixed);
    return fixed ? fixed.position : null;
  }, [pins]);

  const cone = useMemo(() => computeFacingCone(entry), [entry]);

  const handlePointerDown = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      pinId: string,
      isFixed: boolean,
      isEditable: boolean,
    ): void => {
      event.stopPropagation();

      if (isFixed) {
        onSelectFixed(pinId);
        return;
      }

      onSelect(pinId);

      // A pin that is not editable still selects — the editor needs to open
      // so the host can click Edit connection. It just does not capture the
      // pointer, so no drag starts.
      if (!isEditable) return;

      setDraggingId(pinId);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [onSelect, onSelectFixed],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>): void => {
      if (!draggingId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      if (x < -0.05 || x > 1.05 || y < -0.05 || y > 1.05) return;

      const position = projectToNearestWall(x, y);
      onMove(draggingId, position);
    },
    [draggingId, onMove],
  );

  const handlePointerUp = useCallback((): void => {
    if (draggingId !== null && onDragEnd) {
      onDragEnd(draggingId);
    }
    setDraggingId(null);
  }, [draggingId, onDragEnd]);

  return (
    <div className="space-y-3">
      <p className="font-body text-sm leading-6 text-muted">
        Drag each pin to show where a doorway is in the{" "}
        <strong className="text-primary">{roomName}</strong>. Tap the pin to
        answer what is through it.
      </p>

      <div className="flex w-full justify-center">
        <div className="w-full max-w-md">
          <div className="relative">
            <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-7 font-body text-xs font-bold tracking-widest text-muted">
              N
            </span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-7 font-body text-xs font-bold tracking-widest text-muted">
              S
            </span>
            <span className="absolute left-0 top-1/2 -translate-x-7 -translate-y-1/2 font-body text-xs font-bold tracking-widest text-muted">
              W
            </span>
            <span className="absolute right-0 top-1/2 translate-x-7 -translate-y-1/2 font-body text-xs font-bold tracking-widest text-muted">
              E
            </span>

            <div
              ref={containerRef}
              className="relative aspect-square w-full select-none touch-none rounded-xl border-2 border-border bg-surface-soft"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border/60"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border/60"
              />

              <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center font-body text-xs font-bold uppercase tracking-[0.18em] text-primary/25">
                {roomName}
              </span>

              {cone ? (
                <>
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <polygon
                      points={cone.conePoints}
                      fill="rgba(201, 145, 58, 0.10)"
                      stroke="rgba(201, 145, 58, 0.45)"
                      strokeWidth="0.6"
                      strokeDasharray="2,2"
                    />
                  </svg>

                  <div
                    className="pointer-events-none absolute flex items-center justify-center"
                    style={{
                      left: `${cone.personX}%`,
                      top: `${cone.personY}%`,
                      transform: "translate(-50%, -50%)",
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: "#04344c",
                      color: "white",
                      fontSize: 13,
                    }}
                  >
                    🧍
                  </div>

                  <div
                    className="pointer-events-none absolute whitespace-nowrap rounded bg-primary/85 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white"
                    style={{
                      left: `${cone.labelX}%`,
                      top: `${cone.labelY}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    facing this direction
                  </div>
                </>
              ) : null}

              {pins.map((pin) => {
                const isDragging = draggingId === pin.id;
                const style = pinToPercent(pin.position);

                // Cursor tells the host what to expect: a fixed pin is
                // clickable only; an editable pin can be dragged; an
                // uneditable pin still selects on click.
                const cursor = pin.isFixed
                  ? "cursor-pointer"
                  : pin.isEditable
                    ? isDragging
                      ? "cursor-grabbing"
                      : "cursor-grab"
                    : "cursor-pointer";

                return (
                  <button
                    key={pin.id}
                    type="button"
                    onPointerDown={(event) =>
                      handlePointerDown(
                        event,
                        pin.id,
                        pin.isFixed,
                        pin.isEditable,
                      )
                    }
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    aria-label={`${pin.isFixed ? "Entry" : "Door"} pin${
                      pin.isEditable ? "" : " — open its editor to move"
                    }`}
                    className={[
                      "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-2 py-1 font-body text-[10px] font-bold uppercase tracking-wider shadow-sm transition-transform",
                      cursor,
                      pin.isFixed
                        ? "border-primary bg-primary text-white"
                        : pin.isActive
                          ? "border-accent bg-accent text-primary"
                          : "border-border bg-bg text-primary hover:border-accent",
                      isDragging ? "scale-125" : "scale-100",
                    ].join(" ")}
                    style={{
                      ...style,
                      marginLeft: "-0.25rem",
                      marginTop: "-0.25rem",
                    }}
                  >
                    {pin.isFixed ? "Entry" : "Door"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center font-body text-[11px] text-muted">
        Tap a pin to open its editor. Linked doors can be repositioned from
        there with Edit connection.
      </p>

      {pins.some((p) => !p.isFixed && p.isActive) ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => {
              const active = pins.find((p) => p.isActive && !p.isFixed);
              if (active) onRemove(active.id);
            }}
            className="rounded-full border border-red-300 bg-bg px-4 py-2 font-body text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            Remove door
          </button>
        </div>
      ) : null}
    </div>
  );
}
