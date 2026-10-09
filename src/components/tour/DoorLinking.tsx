// src/components/tour/DoorLinking.tsx
//
// The per-room door editor. Saved doors (from the server) and draft pins
// (local, not yet saved) live on the same board.
//
// Dragging: only draft pins and saved doors that are currently being edited
// are draggable. A linked door at rest holds its place, so a stray touch
// cannot shift it; the host opens the door's editor and clicks Edit
// connection to enable dragging for that door.
//
// After a successful Save and link, the new door is auto-selected so the
// host sees the same compact "Linked to X" view they get when reopening a
// saved door. The picker does not stay open once the save succeeds.

"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import type {
  CreateDoorRequest,
  CreateStaircaseRequest,
  Door,
  DoorKind,
  Room,
  Staircase,
  UpdateDoorRequest,
  WallSide,
} from "@/lib/types/tour";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import DoorPin, {
  type DoorPinData,
  type DoorPinPosition,
} from "./DoorPin";
import RoomDoorEditor, {
  type CreateAndLinkInput,
} from "./RoomDoorEditor";
import StaircaseForm from "./StaircaseForm";

interface DraftPin {
  localId: string;
  position: DoorPinPosition;
  kind: DoorKind;
  leadsToRoomId: number | null;
  leadsToLabel: string | null;
}

interface DoorLinkingProps {
  room: Room;
  allRooms: Room[];
  savedDoors: Door[];
  staircases: Staircase[];
  /** Resolves true only when the door was saved. */
  onCreateDoor: (
    input: Omit<CreateDoorRequest, "roomId" | "createReciprocal">,
  ) => Promise<boolean>;
  onMoveSavedDoor: (
    doorId: number,
    position: DoorPinPosition,
  ) => Promise<void>;
  /** Resolves true only when the update was saved. */
  onUpdateSavedDoor: (
    doorId: number,
    patch: UpdateDoorRequest,
  ) => Promise<boolean>;
  onDeleteDoor: (doorId: number) => Promise<void>;
  onCreateAndLinkNewRoom: (input: CreateAndLinkInput) => Promise<Room | null>;
  onCaptureLinkedRoom: (roomId: number) => void;
  onCreateStaircase: (
    input: Omit<CreateStaircaseRequest, "hostRoomId">,
  ) => Promise<boolean>;
  onUpdateStaircase: (
    staircaseId: number,
    input: Omit<CreateStaircaseRequest, "hostRoomId">,
  ) => Promise<boolean>;
  onDeleteStaircase: (staircaseId: number) => Promise<void>;
  onContinue: () => void | Promise<void>;
}

function createLocalId(): string {
  return `pin-${Math.random().toString(36).slice(2, 9)}`;
}

const WALL_TO_YAW: Record<WallSide, number> = {
  TOP: 0,
  RIGHT: 90,
  BOTTOM: 180,
  LEFT: 270,
};

const WALL_TO_COMPASS: Record<WallSide, "N" | "E" | "S" | "W"> = {
  TOP: "N",
  RIGHT: "E",
  BOTTOM: "S",
  LEFT: "W",
};

function pickFreePosition(
  saved: Door[],
  drafts: DraftPin[],
): DoorPinPosition {
  const occupied = new Set<string>();
  for (const d of saved) {
    if (d.wallSide) {
      occupied.add(`${d.wallSide}-${Math.round(d.alongWallPercent ?? 50)}`);
    }
  }
  for (const p of drafts) {
    occupied.add(
      `${p.position.wallSide}-${Math.round(p.position.alongWallPercent)}`,
    );
  }

  const candidates: DoorPinPosition[] = [
    { wallSide: "BOTTOM", alongWallPercent: 50 },
    { wallSide: "BOTTOM", alongWallPercent: 30 },
    { wallSide: "BOTTOM", alongWallPercent: 70 },
    { wallSide: "LEFT", alongWallPercent: 50 },
    { wallSide: "RIGHT", alongWallPercent: 50 },
    { wallSide: "TOP", alongWallPercent: 50 },
    { wallSide: "BOTTOM", alongWallPercent: 15 },
    { wallSide: "BOTTOM", alongWallPercent: 85 },
    { wallSide: "LEFT", alongWallPercent: 25 },
    { wallSide: "LEFT", alongWallPercent: 75 },
    { wallSide: "RIGHT", alongWallPercent: 25 },
    { wallSide: "RIGHT", alongWallPercent: 75 },
  ];

  const free = candidates.find(
    (c) => !occupied.has(`${c.wallSide}-${Math.round(c.alongWallPercent)}`),
  );
  return free ?? candidates[0];
}

export default function DoorLinking({
  room,
  allRooms,
  savedDoors,
  staircases,
  onCreateDoor,
  onMoveSavedDoor,
  onUpdateSavedDoor,
  onDeleteDoor,
  onCreateAndLinkNewRoom,
  onCaptureLinkedRoom,
  onCreateStaircase,
  onUpdateStaircase,
  onDeleteStaircase,
  onContinue,
}: DoorLinkingProps): ReactElement {
  const [draftPins, setDraftPins] = useState<DraftPin[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [activeSavedId, setActiveSavedId] = useState<number | null>(null);
  const [showStaircaseForm, setShowStaircaseForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  const [pendingSavedPositions, setPendingSavedPositions] = useState<
    Record<number, DoorPinPosition>
  >({});

  // Which saved door is currently being edited. Dragging a saved pin is
  // only enabled when its id is in this set.
  const [editingSavedDoorId, setEditingSavedDoorId] = useState<number | null>(
    null,
  );

  // After a successful create-and-link, the new room's id lands here. The
  // effect below finds the door that now points at it and opens its editor
  // in the compact view.
  const [pendingSelectLinkedRoomId, setPendingSelectLinkedRoomId] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (pendingSelectLinkedRoomId === null) return;
    const door = savedDoors.find(
      (d) =>
        !d.isFixed && d.leadsToRoomId === pendingSelectLinkedRoomId,
    );
    if (!door) return;
    setActiveSavedId(door.id);
    setActiveDraftId(null);
    setPendingSelectLinkedRoomId(null);
  }, [savedDoors, pendingSelectLinkedRoomId]);

  const savedPins: DoorPinData[] = useMemo(
    () =>
      savedDoors.map((door) => {
        const pending = pendingSavedPositions[door.id];
        const pos: DoorPinPosition = pending ?? {
          wallSide: door.wallSide ?? "TOP",
          alongWallPercent: door.alongWallPercent ?? 50,
        };
        return {
          id: String(door.id),
          position: pos,
          isFixed: door.isFixed,
          isActive: activeSavedId === door.id,
          isEditable: !door.isFixed && editingSavedDoorId === door.id,
          leadsToLabel: door.leadsToRoomName ?? door.leadsToLabel,
        };
      }),
    [savedDoors, activeSavedId, editingSavedDoorId, pendingSavedPositions],
  );

  const draftPinsForRender: DoorPinData[] = useMemo(
    () =>
      draftPins.map((pin) => ({
        id: pin.localId,
        position: pin.position,
        isFixed: false,
        isActive: activeDraftId === pin.localId,
        // Draft pins are always draggable: positioning them is the point.
        isEditable: true,
        leadsToLabel: pin.leadsToLabel,
      })),
    [draftPins, activeDraftId],
  );

  const activeDraft =
    draftPins.find((pin) => pin.localId === activeDraftId) ?? null;
  const activeSaved =
    activeSavedId !== null
      ? savedDoors.find((door) => door.id === activeSavedId) ?? null
      : null;

  const linkableRooms = useMemo(() => {
    const linkedIds = new Set<number>();
    savedDoors.forEach((door) => {
      if (door.leadsToRoomId !== null) linkedIds.add(door.leadsToRoomId);
    });
    draftPins.forEach((pin) => {
      if (pin.leadsToRoomId !== null) linkedIds.add(pin.leadsToRoomId);
    });
    return allRooms.filter(
      (candidate) =>
        candidate.id !== room.id && !linkedIds.has(candidate.id),
    );
  }, [allRooms, room.id, savedDoors, draftPins]);

  const otherDoors = savedDoors.filter((d) => !d.isFixed);
  const answeredDoors = otherDoors.filter(
    (d) => d.leadsToRoomId !== null || d.leadsToLabel !== null,
  );

  const handleAddDraftPin = (): void => {
    const position = pickFreePosition(savedDoors, draftPins);
    const pin: DraftPin = {
      localId: createLocalId(),
      position,
      kind: "DOOR",
      leadsToRoomId: null,
      leadsToLabel: null,
    };
    setDraftPins((current) => [...current, pin]);
    setActiveDraftId(pin.localId);
    setActiveSavedId(null);
    setEditingSavedDoorId(null);
  };

  const handleMoveDraftPin = (
    pinId: string,
    position: DoorPinPosition,
  ): void => {
    setDraftPins((current) =>
      current.map((pin) =>
        pin.localId === pinId ? { ...pin, position } : pin,
      ),
    );
  };

  const handleMoveSavedPin = (
    pinId: string,
    position: DoorPinPosition,
  ): void => {
    const doorId = Number(pinId);
    if (!Number.isFinite(doorId)) return;
    setPendingSavedPositions((prev) => ({ ...prev, [doorId]: position }));
  };

  const handleDragEnd = (pinId: string): void => {
    if (pinId.startsWith("pin-")) return;
    const doorId = Number(pinId);
    const pos = pendingSavedPositions[doorId];
    if (!pos) return;

    // Keep the override until the PUT and the door refresh have both
    // finished, so the pin never falls back to the previous value mid-save.
    void onMoveSavedDoor(doorId, pos).finally(() => {
      setPendingSavedPositions((prev) => {
        const next = { ...prev };
        delete next[doorId];
        return next;
      });
    });
  };

  const handleRemoveDraftPin = (pinId: string): void => {
    setDraftPins((current) =>
      current.filter((pin) => pin.localId !== pinId),
    );
    if (activeDraftId === pinId) setActiveDraftId(null);
  };

  const handleRemoveSavedPin = (pinId: string): void => {
    const doorId = Number(pinId);
    if (!Number.isFinite(doorId)) return;
    void onDeleteDoor(doorId);
    if (activeSavedId === doorId) {
      setActiveSavedId(null);
      setEditingSavedDoorId(null);
    }
  };

  const saveDraft = async (
    target:
      | { leadsToRoomId: number; leadsToLabel: null }
      | { leadsToRoomId: null; leadsToLabel: string },
  ): Promise<boolean> => {
    if (!activeDraft) return false;
    const draftId = activeDraft.localId;

    setIsSaving(true);
    try {
      const saved = await onCreateDoor({
        positionYawDeg: WALL_TO_YAW[activeDraft.position.wallSide],
        positionPitchDeg: 0,
        wallSide: activeDraft.position.wallSide,
        alongWallPercent: activeDraft.position.alongWallPercent,
        kind: activeDraft.kind,
        leadsToRoomId: target.leadsToRoomId,
        leadsToLabel: target.leadsToLabel,
      });
      // Keep the pin when the save failed so the host does not lose it.
      if (saved) {
        setDraftPins((current) =>
          current.filter((pin) => pin.localId !== draftId),
        );
        if (activeDraftId === draftId) setActiveDraftId(null);
      }
      return saved;
    } finally {
      setIsSaving(false);
    }
  };

  /** Wraps a saved-door update so the editor shows a saving state. */
  const runSavedUpdate = async (
    doorId: number,
    patch: UpdateDoorRequest,
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      return await onUpdateSavedDoor(doorId, patch);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAndLinkNewRoom = async (
    input: CreateAndLinkInput,
  ): Promise<void> => {
    if (!activeDraft) return;
    const draftId = activeDraft.localId;

    setIsSaving(true);
    try {
      const created = await onCreateAndLinkNewRoom(input);
      if (created) {
        setDraftPins((current) =>
          current.filter((pin) => pin.localId !== draftId),
        );
        if (activeDraftId === draftId) setActiveDraftId(null);
        // Wait for the doors to refresh, then open the new door's compact
        // view. The effect above handles that once savedDoors updates.
        setPendingSelectLinkedRoomId(created.id);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async (): Promise<void> => {
    setIsContinuing(true);
    try {
      await onContinue();
    } finally {
      setIsContinuing(false);
    }
  };

  const setActiveDraftField = <K extends keyof DraftPin>(
    key: K,
    value: DraftPin[K],
  ): void => {
    if (!activeDraft) return;
    setDraftPins((current) =>
      current.map((pin) =>
        pin.localId === activeDraft.localId
          ? { ...pin, [key]: value }
          : pin,
      ),
    );
  };

  const draftAsDoor: Door | null = activeDraft
    ? {
        id: 0,
        roomId: room.id,
        roomName: room.roomName,
        panoramaId: null,
        positionYawDeg: WALL_TO_YAW[activeDraft.position.wallSide],
        positionPitchDeg: 0,
        wallSide: activeDraft.position.wallSide,
        compassDirection: WALL_TO_COMPASS[activeDraft.position.wallSide],
        alongWallPercent: activeDraft.position.alongWallPercent,
        x: null,
        y: null,
        kind: activeDraft.kind,
        isFixed: false,
        leadsToRoomId: activeDraft.leadsToRoomId,
        leadsToRoomName:
          allRooms.find((r) => r.id === activeDraft.leadsToRoomId)
            ?.roomName ?? null,
        leadsToLabel: activeDraft.leadsToLabel,
        isReciprocalOf: null,
        reciprocalDoorId: null,
        reciprocalDoorRoomName: null,
      }
    : null;

  return (
    <section aria-labelledby="tour-door-linking">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Doorways
      </p>
      <h2
        id="tour-door-linking"
        className="mt-2 font-display text-2xl font-bold text-primary"
      >
        Show us the doors in the {room.roomName}
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Pin every opening you can see from here, then say where it leads: another
        room, outside, or a staircase. A saved door stays put until you press
        Edit connection on it.
      </p>

      <DoorPin
        roomName={room.roomName}
        pins={[...savedPins, ...draftPinsForRender]}
        onMove={(pinId, position) => {
          if (pinId.startsWith("pin-")) {
            handleMoveDraftPin(pinId, position);
          } else {
            handleMoveSavedPin(pinId, position);
          }
        }}
        onDragEnd={handleDragEnd}
        onSelect={(pinId) => {
          if (pinId.startsWith("pin-")) {
            setActiveDraftId(pinId);
            setActiveSavedId(null);
            setEditingSavedDoorId(null);
          } else {
            const id = Number(pinId);
            setActiveSavedId(id);
            setActiveDraftId(null);
            // Selecting a different pin leaves the previous one's edit
            // mode. Dragging turns off until Edit connection is pressed
            // again on this door.
            setEditingSavedDoorId(null);
          }
        }}
        onSelectFixed={(pinId) => {
          setActiveSavedId(Number(pinId));
          setActiveDraftId(null);
          setEditingSavedDoorId(null);
        }}
        onRemove={(pinId) => {
          if (pinId.startsWith("pin-")) {
            handleRemoveDraftPin(pinId);
          } else {
            handleRemoveSavedPin(pinId);
          }
        }}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-xs text-muted">
          {otherDoors.length === 0
            ? "No other doors yet."
            : `${answeredDoors.length} of ${otherDoors.length} door${
                otherDoors.length === 1 ? "" : "s"
              } linked.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
  type="button"
  data-tour="door-add"
  onClick={handleAddDraftPin}
  className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-surface-soft"
>
  + Add another door
</button>
          <button
  type="button"
  data-tour="door-staircases"
  onClick={() => setShowStaircaseForm((current) => !current)}
  className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-surface-soft"
>
            {showStaircaseForm
              ? "Hide staircases"
              : staircases.length > 0
                ? `Staircases (${staircases.length})`
                : "+ Add a staircase"}
          </button>
        </div>
      </div>

      {draftAsDoor ? (
        <RoomDoorEditor
          key={`draft-${activeDraft!.localId}`}
          door={draftAsDoor}
          isDraft
          isSaving={isSaving}
          availableRooms={linkableRooms}
          allRooms={allRooms}
          onLinkExistingRoom={(roomId) => {
            const target = allRooms.find((r) => r.id === roomId);
            setActiveDraftField("leadsToRoomId", roomId);
            setActiveDraftField("leadsToLabel", target?.roomName ?? null);
            return saveDraft({ leadsToRoomId: roomId, leadsToLabel: null });
          }}
          onCreateAndLinkNewRoom={(input) =>
            void handleCreateAndLinkNewRoom(input)
          }
          onCaptureLinkedRoom={onCaptureLinkedRoom}
          onLinkOutside={() => {
            setActiveDraftField("leadsToLabel", "Outside / Compound");
            setActiveDraftField("leadsToRoomId", null);
            return saveDraft({
              leadsToRoomId: null,
              leadsToLabel: "Outside / Compound",
            });
          }}
          onKindChange={(kind) => setActiveDraftField("kind", kind)}
          onNudge={(wall) =>
            setActiveDraftField("position", {
              ...activeDraft!.position,
              wallSide: wall,
            })
          }
          onConfirmDraft={() => undefined}
          onDismiss={() => setActiveDraftId(null)}
        />
      ) : null}

      {activeSaved ? (
        <RoomDoorEditor
          // Key by id so switching pins resets the editor's internal state,
          // including whether Edit connection is on.
          key={`saved-${activeSaved.id}`}
          door={activeSaved}
          isDraft={false}
          isSaving={isSaving}
          availableRooms={linkableRooms}
          allRooms={allRooms}
          onLinkExistingRoom={(roomId) =>
            runSavedUpdate(activeSaved.id, { leadsToRoomId: roomId })
          }
          onCreateAndLinkNewRoom={(input) =>
            void handleCreateAndLinkNewRoom(input)
          }
          onCaptureLinkedRoom={onCaptureLinkedRoom}
          onLinkOutside={() =>
            runSavedUpdate(activeSaved.id, {
              leadsToLabel: "Outside / Compound",
            })
          }
          onKindChange={(kind) =>
            void runSavedUpdate(activeSaved.id, { kind })
          }
          onNudge={(wall) =>
            void onMoveSavedDoor(activeSaved.id, {
              wallSide: wall,
              alongWallPercent: activeSaved.alongWallPercent ?? 50,
            })
          }
          onEditModeChange={(isEditing) => {
            setEditingSavedDoorId(isEditing ? activeSaved.id : null);
          }}
          onConfirmDraft={() => undefined}
          onDismiss={() => {
            setActiveSavedId(null);
            setEditingSavedDoorId(null);
          }}
        />
      ) : null}

      {showStaircaseForm ? (
        <StaircaseForm
          roomName={room.roomName}
          staircases={staircases}
          onCreate={onCreateStaircase}
          onUpdate={onUpdateStaircase}
          onRemove={onDeleteStaircase}
          onCancel={() => setShowStaircaseForm(false)}
        />
      ) : null}

      <div className="mt-6 flex justify-end">
       <button
  type="button"
  data-tour="door-continue"
  disabled={isSaving || isContinuing}
  aria-busy={isContinuing}
  onClick={() => void handleContinue()}
  className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-wait disabled:opacity-60"
>
          <AsyncButtonContent
            isPending={isContinuing}
            pendingLabel="Loading rooms…"
          >
            Continue
          </AsyncButtonContent>
        </button>
      </div>
    </section>
  );
}
