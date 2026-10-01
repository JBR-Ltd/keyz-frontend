// src/components/tour/StaircaseForm.tsx
//
// Staircase manager for one room. Three views:
//
//   list  — saved staircases as info cards (Edit / Remove). Nothing here can
//           be dragged, so a stray touch never moves a saved stair.
//   new   — blank form; the marker is draggable.
//   edit  — same form pre-filled from a saved stair. The marker is only
//           draggable because the host pressed Edit.
//
// After a successful save the form drops back to the list and the saved card
// is highlighted. Removing goes through ConfirmDialog, never window.confirm.
//
// The form does not talk to the server. It hands a request to the wizard and
// waits for a boolean: true = saved, false = failed (the wizard has already
// shown the error, and the form stays open so nothing typed is lost).

"use client";

import type {
  PointerEvent as ReactPointerEvent,
  ReactElement,
} from "react";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type {
  CreateStaircaseRequest,
  DoorKind,
  StairDirection,
  Staircase,
  WallSide,
} from "@/lib/types/tour";

type StaircaseInput = Omit<CreateStaircaseRequest, "hostRoomId">;

interface StaircaseFormProps {
  roomName: string;
  staircases: Staircase[];
  onCreate: (input: StaircaseInput) => Promise<boolean>;
  onUpdate: (staircaseId: number, input: StaircaseInput) => Promise<boolean>;
  onRemove: (staircaseId: number) => Promise<void>;
  onCancel: () => void;
}

interface Position {
  wallSide: WallSide;
  alongWallPercent: number;
}

type Size = "SMALL" | "MEDIUM" | "LARGE";
type Mode = { kind: "list" } | { kind: "new" } | { kind: "edit"; id: number };

const WALL_LABELS: Record<WallSide, string> = {
  TOP: "N",
  RIGHT: "E",
  BOTTOM: "S",
  LEFT: "W",
};

const FOOTPRINTS: Record<
  Size,
  { label: string; gw: number; gh: number; hint: string }
> = {
  SMALL: { label: "Small", gw: 1, gh: 1, hint: "Spiral or tight" },
  MEDIUM: { label: "Medium", gw: 1, gh: 2, hint: "Straight run" },
  LARGE: { label: "Large", gw: 2, gh: 2, hint: "Grand staircase" },
};

function sizeFromFootprint(gw: number, gh: number): Size {
  const match = (Object.keys(FOOTPRINTS) as Size[]).find(
    (key) => FOOTPRINTS[key].gw === gw && FOOTPRINTS[key].gh === gh,
  );
  return match ?? "MEDIUM";
}

function directionLabel(direction: StairDirection): string {
  return direction === "UP" ? "Up" : direction === "DOWN" ? "Down" : "Up & down";
}

function projectToNearestWall(x: number, y: number): Position {
  const candidates: Array<{ d: number; side: WallSide; along: number }> = [
    { d: y, side: "TOP", along: x },
    { d: 1 - y, side: "BOTTOM", along: x },
    { d: x, side: "LEFT", along: y },
    { d: 1 - x, side: "RIGHT", along: y },
  ];
  candidates.sort((a, b) => a.d - b.d);
  const nearest = candidates[0];
  const along = Math.max(0.05, Math.min(0.95, nearest.along));
  return { wallSide: nearest.side, alongWallPercent: along * 100 };
}

export default function StaircaseForm({
  roomName,
  staircases,
  onCreate,
  onUpdate,
  onRemove,
  onCancel,
}: StaircaseFormProps): ReactElement {
  const [mode, setMode] = useState<Mode>(
    staircases.length === 0 ? { kind: "new" } : { kind: "list" },
  );
  const [name, setName] = useState("Staircase");
  const [position, setPosition] = useState<Position>({
    wallSide: "BOTTOM",
    alongWallPercent: 50,
  });
  const [kind, setKind] = useState<DoorKind>("OPENING");
  const [direction, setDirection] = useState<StairDirection>("UP");
  const [size, setSize] = useState<Size>("MEDIUM");

  const [isSaving, setIsSaving] = useState(false);
  const [justSavedName, setJustSavedName] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Staircase | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const startNew = (): void => {
    setName(
      staircases.length === 0 ? "Staircase" : `Staircase ${staircases.length + 1}`,
    );
    setPosition({ wallSide: "BOTTOM", alongWallPercent: 50 });
    setKind("OPENING");
    setDirection("UP");
    setSize("MEDIUM");
    setJustSavedName(null);
    setMode({ kind: "new" });
  };

  const startEdit = (staircase: Staircase): void => {
    setName(staircase.name);
    setPosition({
      wallSide: staircase.hostWallSide,
      alongWallPercent: staircase.hostAlongWallPercent,
    });
    setKind(staircase.kind);
    setDirection(staircase.direction);
    setSize(sizeFromFootprint(staircase.footprintGw, staircase.footprintGh));
    setJustSavedName(null);
    setMode({ kind: "edit", id: staircase.id });
  };

  const backToList = (): void => {
    setMode(staircases.length === 0 ? { kind: "new" } : { kind: "list" });
  };

  const handleSave = async (): Promise<void> => {
    const footprint = FOOTPRINTS[size];
    const trimmed = name.trim() || "Staircase";
    const input: StaircaseInput = {
      name: trimmed,
      hostWallSide: position.wallSide,
      hostAlongWallPercent: position.alongWallPercent,
      kind,
      direction,
      footprintGw: footprint.gw,
      footprintGh: footprint.gh,
    };

    setIsSaving(true);
    try {
      const ok =
        mode.kind === "edit"
          ? await onUpdate(mode.id, input)
          : await onCreate(input);
      if (ok) {
        setJustSavedName(trimmed);
        setMode({ kind: "list" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRemove = async (): Promise<void> => {
    if (!pendingRemove) return;
    setIsRemoving(true);
    try {
      await onRemove(pendingRemove.id);
      setPendingRemove(null);
      setJustSavedName(null);
      if (staircases.length <= 1) setMode({ kind: "new" });
    } finally {
      setIsRemoving(false);
    }
  };

  const isFormMode = mode.kind === "new" || mode.kind === "edit";

  return (
    <section className="mt-5 rounded-xl border border-border bg-bg p-5 shadow-sm">
      <p className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
        Staircase
      </p>
      <h3 className="mt-1 font-display text-lg font-bold text-primary">
        {mode.kind === "edit"
          ? `Editing ${name || "staircase"}`
          : mode.kind === "new"
            ? `Add a staircase in the ${roomName}`
            : `Staircases in the ${roomName}`}
      </h3>

      {justSavedName && mode.kind === "list" ? (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 font-body text-sm font-bold text-green-800"
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          {justSavedName} saved.
        </p>
      ) : null}

      {mode.kind === "list" ? (
        <>
          <p className="mt-2 font-body text-sm leading-6 text-muted">
            Saved staircases are locked in place. Press Edit if one needs to
            move or change.
          </p>
          <ul className="mt-4 space-y-3">
            {staircases.map((staircase) => {
              const highlighted = staircase.name === justSavedName;
              const fp = sizeFromFootprint(
                staircase.footprintGw,
                staircase.footprintGh,
              );
              return (
                <li
                  key={staircase.id}
                  className={[
                    "rounded-lg border px-4 py-3",
                    highlighted
                      ? "border-green-300 bg-green-50/60"
                      : "border-border bg-surface-soft/40",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 font-body">
                      <p className="text-sm font-bold text-primary">
                        {staircase.name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {WALL_LABELS[staircase.hostWallSide]} wall ·{" "}
                        {Math.round(staircase.hostAlongWallPercent)}% along ·{" "}
                        {directionLabel(staircase.direction)} ·{" "}
                        {FOOTPRINTS[fp].label} ({staircase.footprintGw}×
                        {staircase.footprintGh}) ·{" "}
                        {staircase.kind === "OPENING"
                          ? "open archway"
                          : "closed door"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(staircase)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-bg px-3 py-1.5 font-body text-xs font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
                      >
                        <Pencil size={12} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingRemove(staircase)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-bg px-3 py-1.5 font-body text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={12} aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={startNew}
              className="min-h-10 rounded-full border border-border bg-bg px-5 font-body text-xs font-bold text-primary transition-colors hover:bg-surface-soft"
            >
              + Add another staircase
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-10 rounded-full bg-accent px-5 font-body text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Done
            </button>
          </div>
        </>
      ) : null}

      {isFormMode ? (
        <>
          <p className="mt-2 font-body text-sm leading-6 text-muted">
            Drag the marker to the wall the stair sits on. Then tell us what
            kind of opening it is and how big it should be on the plan.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="font-body text-xs font-bold text-primary">
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Main Stair"
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>

            <div>
              <span className="font-body text-xs font-bold text-primary">
                Where does the staircase sit?
              </span>
              <StaircasePinBoard
                roomName={roomName}
                position={position}
                onChange={setPosition}
              />
            </div>

            <div>
              <span className="font-body text-xs font-bold text-primary">
                Opening type
              </span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["OPENING", "DOOR"] as DoorKind[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setKind(option)}
                    className={[
                      "min-h-10 rounded-md border font-body text-xs font-bold transition-colors",
                      kind === option
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-bg text-primary hover:border-accent",
                    ].join(" ")}
                  >
                    {option === "OPENING" ? "Open archway" : "Closed door"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="font-body text-xs font-bold text-primary">
                Direction
              </span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {(["UP", "DOWN", "BOTH"] as StairDirection[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDirection(option)}
                    className={[
                      "min-h-10 rounded-md border font-body text-xs font-bold transition-colors",
                      direction === option
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-bg text-primary hover:border-accent",
                    ].join(" ")}
                  >
                    {directionLabel(option)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="font-body text-xs font-bold text-primary">
                How big is the stair on the plan?
              </span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {(["SMALL", "MEDIUM", "LARGE"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={[
                      "rounded-md border p-2 text-left font-body text-xs transition-colors",
                      size === option
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-bg text-primary hover:border-accent",
                    ].join(" ")}
                  >
                    <div className="font-bold">{FOOTPRINTS[option].label}</div>
                    <div className="mt-0.5 text-[10px] opacity-75">
                      {FOOTPRINTS[option].hint}
                    </div>
                    <div className="mt-0.5 font-mono text-[9px] opacity-60">
                      {FOOTPRINTS[option].gw}×{FOOTPRINTS[option].gh}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={staircases.length === 0 ? onCancel : backToList}
              className="min-h-10 rounded-full border border-border bg-bg px-5 font-body text-xs font-bold text-primary transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-5 font-body text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : mode.kind === "edit" ? (
                "Save changes"
              ) : (
                "Save staircase"
              )}
            </button>
          </div>
        </>
      ) : null}

      <ConfirmDialog
        open={pendingRemove !== null}
        title={`Remove ${pendingRemove?.name ?? "this staircase"}?`}
        description="It will disappear from the floor plan and the renter tour. You can add it again afterwards."
        confirmLabel="Remove staircase"
        tone="danger"
        isConfirming={isRemoving}
        onConfirm={() => void handleConfirmRemove()}
        onCancel={() => setPendingRemove(null)}
      />
    </section>
  );
}

// ============================================================
// Pin board
// ============================================================

function StaircasePinBoard({
  roomName,
  position,
  onChange,
  interactive = true,
}: {
  roomName: string;
  position: Position;
  onChange: (p: Position) => void;
  interactive?: boolean;
}): ReactElement {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = (clientX: number, clientY: number): void => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onChange(projectToNearestWall(x, y));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!interactive) return;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!interactive || !dragging) return;
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerUp = (): void => setDragging(false);

  const along = Math.max(5, Math.min(95, position.alongWallPercent)) / 100;
  let pinLeft = "50%";
  let pinTop = "50%";
  switch (position.wallSide) {
    case "TOP":
      pinLeft = `${along * 100}%`;
      pinTop = "0%";
      break;
    case "BOTTOM":
      pinLeft = `${along * 100}%`;
      pinTop = "100%";
      break;
    case "LEFT":
      pinLeft = "0%";
      pinTop = `${along * 100}%`;
      break;
    case "RIGHT":
      pinLeft = "100%";
      pinTop = `${along * 100}%`;
      break;
  }

  return (
    <div className="mt-2 flex w-full justify-center">
      <div className="w-full max-w-sm">
        <div className="relative">
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-6 font-body text-xs font-bold tracking-widest text-muted">
            N
          </span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 font-body text-xs font-bold tracking-widest text-muted">
            S
          </span>
          <span className="absolute left-0 top-1/2 -translate-x-6 -translate-y-1/2 font-body text-xs font-bold tracking-widest text-muted">
            W
          </span>
          <span className="absolute right-0 top-1/2 translate-x-6 -translate-y-1/2 font-body text-xs font-bold tracking-widest text-muted">
            E
          </span>

          <div
            ref={boardRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={[
              "relative aspect-square w-full select-none rounded-xl border-2 border-border bg-surface-soft",
              interactive ? "cursor-crosshair touch-none" : "cursor-default opacity-90",
            ].join(" ")}
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

            <div
              className="pointer-events-none absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-primary text-base text-white shadow-md"
              style={{ left: pinLeft, top: pinTop }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 20h16M6 20V8h12v12M8 12h2M12 12h2M16 12h2M8 16h2M12 16h2M16 16h2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center font-body text-[11px] text-muted">
          {interactive
            ? "Drag anywhere on the board; the marker snaps to the nearest wall."
            : "Locked. Press Edit on the staircase to move it."}
        </p>
      </div>
    </div>
  );
}
