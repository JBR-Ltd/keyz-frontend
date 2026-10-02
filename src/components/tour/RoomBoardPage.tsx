// src/components/tour/RoomBoardPage.tsx
//
// The landlord's capture tracking board. Lists every room on a floor with
// its status and jumps into the tour wizard at the right point. If the caller
// did not supply a floor (via ?floor=), the board fetches the property's
// floors and picks the first. If the property has more than one floor, a
// switcher appears under the header.

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LayoutGrid,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import RoomTile from "@/components/tour/RoomTile";
import { useToast } from "@/components/ui/toast";
import { getFloor, getFloorsForProperty } from "@/lib/api/tours/floors";
import { deleteRoom, getRoomsForFloor, updateRoom } from "@/lib/api/tours/rooms";
import { ROOM_TYPES, SIZE_OPTIONS } from "@/lib/tourConstants";
import type { Floor, Room, SizeBucket } from "@/lib/types/tour";

interface RoomBoardPageProps {
  propertyId: number;
  floorId?: number;
  role: "landlord" | "agent";
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; floor: Floor; rooms: Room[] };

const INPUT_CLASS_NAME =
  "mt-2 min-h-11 w-full rounded-lg border border-border bg-bg px-3 font-body text-sm text-primary outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function RoomBoardPage({
  propertyId,
  floorId,
  role,
}: RoomBoardPageProps): ReactElement {
  const { notify } = useToast();
  const router = useRouter();

  const [floors, setFloors] = useState<Floor[] | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<number | null>(
    floorId ?? null,
  );
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // If the caller did not pass a floor, resolve one. Otherwise skip straight
  // to loading the rooms.
  useEffect(() => {
    if (activeFloorId !== null) return;

    let active = true;
    void (async () => {
      try {
        const list = await getFloorsForProperty(propertyId);
        if (!active) return;
        setFloors(list);
        if (list.length === 0) {
          setState({
            status: "error",
            message:
              "This property has no floors yet. Open the tour wizard to add one.",
          });
          return;
        }
        setActiveFloorId(list[0].id);
      } catch (error) {
        if (!active) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load this property's floors.",
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [propertyId, activeFloorId]);

  const loadRooms = useCallback(async (fid: number) => {
    setState({ status: "loading" });
    try {
      const [floor, rooms] = await Promise.all([
        getFloor(fid),
        getRoomsForFloor(fid),
      ]);
      setState({ status: "ready", floor, rooms });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not load rooms for this floor.",
      });
    }
  }, []);

  useEffect(() => {
    if (activeFloorId !== null) void loadRooms(activeFloorId);
  }, [activeFloorId, loadRooms]);

  // Fetch the full floor list once, for the switcher. This runs in parallel
  // with the initial room load and is idempotent.
  useEffect(() => {
    if (floors !== null) return;
    let active = true;
    void (async () => {
      try {
        const list = await getFloorsForProperty(propertyId);
        if (!active) return;
        setFloors(list);
      } catch {
        // The switcher is optional; the room list already renders.
      }
    })();
    return () => {
      active = false;
    };
  }, [propertyId, floors]);

  const summary = useMemo(() => {
    if (state.status !== "ready") {
      return { total: 0, ready: 0, pending: 0, retake: 0 };
    }
    const total = state.rooms.length;
    const ready = state.rooms.filter((r) => r.status === "ready").length;
    const retake = state.rooms.filter((r) => r.status === "retake").length;
    return { total, ready, pending: total - ready - retake, retake };
  }, [state]);

  const tourBase = `/${role}/listings/${propertyId}/tour`;

  const handleRoomClick = (room: Room): void => {
    const activeFloor = state.status === "ready" ? state.floor.id : null;
    const params = new URLSearchParams();
    if (activeFloor !== null) params.set("floor", String(activeFloor));
    params.set("room", String(room.id));
    router.push(`${tourBase}?${params.toString()}`);
  };

  const handleAddRoom = (): void => {
    const activeFloor = state.status === "ready" ? state.floor.id : null;
    const params = new URLSearchParams();
    if (activeFloor !== null) params.set("floor", String(activeFloor));
    params.set("action", "add-room");
    router.push(`${tourBase}?${params.toString()}`);
  };

  const handleOpenFloorPlan = (): void => {
    const activeFloor = state.status === "ready" ? state.floor.id : null;
    if (activeFloor === null) return;
    router.push(`/tours/${propertyId}/floor-plan?floor=${activeFloor}`);
  };

  const handleSwitchFloor = (id: number): void => {
    setActiveFloorId(id);
  };

  const handleDelete = useCallback(
    async (room: Room): Promise<void> => {
      const confirmed = window.confirm(
        `Delete "${room.roomName}"? This will also delete its panorama, door pins, and any staircase attached to it. This cannot be undone.`,
      );
      if (!confirmed) return;

      setDeletingId(room.id);
      try {
        await deleteRoom(room.id);
        if (state.status === "ready") {
          setState({
            ...state,
            rooms: state.rooms.filter((r) => r.id !== room.id),
          });
        }
        notify({
          title: "Room deleted",
          description: `${room.roomName} was removed.`,
          variant: "success",
        });
      } catch (error) {
        notify({
          title: "Could not delete the room",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [state, notify],
  );

  const handleRoomUpdated = useCallback(
    (updated: Room): void => {
      if (state.status === "ready") {
        setState({
          ...state,
          rooms: state.rooms.map((r) => (r.id === updated.id ? updated : r)),
        });
      }
      setEditingRoom(null);
    },
    [state],
  );

  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-body text-sm text-red-700">{state.message}</p>
        <div className="flex flex-wrap gap-3">
          {activeFloorId !== null ? (
            <button
              type="button"
              onClick={() => void loadRooms(activeFloorId)}
              className="inline-flex min-h-11 items-center rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:border-accent"
            >
              Retry
            </button>
          ) : null}
          <Link
            href={`/${role}/listings/${propertyId}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white"
          >
            <ArrowLeft size={15} />
            Back to listing
          </Link>
        </div>
      </main>
    );
  }

  const { floor, rooms } = state;

  return (
    <main className="min-h-screen bg-bg pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-10 lg:pt-12">
        <Link
          href={`/${role}/listings/${propertyId}`}
          className="inline-flex items-center gap-2 font-body text-sm font-medium text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to listing
        </Link>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
              Room board
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-primary">
              {floor.name}
            </h1>
            <p className="mt-2 max-w-2xl font-body text-sm text-muted">
              Track which rooms are captured, which need a retake, and which
              are ready to publish. Hover a tile to edit or delete it.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${role}/listings/${propertyId}/tour?action=overview`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LayoutGrid size={15} aria-hidden="true" />
              Manage floors
            </Link>
            <button
              type="button"
              onClick={handleOpenFloorPlan}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LayoutGrid size={15} aria-hidden="true" />
              Open floor plan
            </button>
            <button
              type="button"
              onClick={handleAddRoom}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Plus size={15} aria-hidden="true" />
              Add room
            </button>
          </div>
        </header>

        {floors && floors.length > 1 ? (
          <nav
            aria-label="Floors"
            className="mt-6 flex flex-wrap gap-2 rounded-lg border border-border bg-bg p-1.5"
          >
            {floors.map((f) => {
              const isActive = f.id === floor.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSwitchFloor(f.id)}
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

        <section className="mt-8 rounded-xl border border-border bg-bg p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Total rooms" value={String(summary.total)} tone="neutral" />
            <Stat label="Ready" value={String(summary.ready)} tone="success" />
            <Stat label="Pending" value={String(summary.pending)} tone="accent" />
            <Stat label="Retakes" value={String(summary.retake)} tone="danger" />
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width:
                  summary.total > 0
                    ? `${(summary.ready / summary.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </section>

        {rooms.length === 0 ? (
          <section className="mt-10 rounded-xl border border-dashed border-primary/20 bg-surface-soft/40 p-12 text-center">
            <p className="font-display text-xl font-bold text-primary">
              No rooms on this floor yet
            </p>
            <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted">
              Add the first room to start capturing. Each room gets its own
              panorama, door pins, and status.
            </p>
            <button
              type="button"
              onClick={handleAddRoom}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <Plus size={15} aria-hidden="true" />
              Add the first room
            </button>
          </section>
        ) : (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-primary">
                Rooms on this floor
              </h2>
              <p className="font-body text-xs text-muted">
                {rooms.length} room{rooms.length === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => (
                <li key={room.id}>
                  <RoomTile
                    room={room}
                    onClick={handleRoomClick}
                    onEdit={setEditingRoom}
                    onDelete={(r) => void handleDelete(r)}
                    isDeleting={deletingId === room.id}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-xl border border-accent/40 bg-accent/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-accent-alt">
                <Sparkles size={12} className="mr-1.5 inline" aria-hidden="true" />
                Next step
              </p>
              <p className="mt-2 font-body text-sm leading-6 text-primary">
                {summary.total === 0
                  ? "Add rooms to this floor to start capturing."
                  : summary.ready === 0
                    ? "Capture at least one room before generating the floor plan."
                    : summary.pending === 0
                      ? "Every room is captured. Generate and review the floor plan."
                      : `${summary.pending} room${summary.pending === 1 ? "" : "s"} still need capturing.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                params.set("floor", String(floor.id));
                params.set("action", "floor-plan");
                router.push(`${tourBase}?${params.toString()}`);
              }}
              disabled={summary.ready === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LayoutGrid size={15} aria-hidden="true" />
              Go to floor plan
            </button>
          </div>
        </section>
      </div>

      {editingRoom ? (
        <EditRoomDialog
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onUpdated={handleRoomUpdated}
        />
      ) : null}
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "accent" | "danger";
}): ReactElement {
  const colors: Record<typeof tone, string> = {
    neutral: "text-primary",
    success: "text-green-700",
    accent: "text-accent-alt",
    danger: "text-red-700",
  };
  return (
    <div>
      <p className="font-body text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl font-bold ${colors[tone]}`}>
        {value}
      </p>
    </div>
  );
}

interface EditRoomDialogProps {
  room: Room;
  onClose: () => void;
  onUpdated: (room: Room) => void;
}

function EditRoomDialog({
  room,
  onClose,
  onUpdated,
}: EditRoomDialogProps): ReactElement {
  const { notify } = useToast();
  const [roomName, setRoomName] = useState(room.roomName);
  const [roomType, setRoomType] = useState(room.roomType);
  const [sizeBucket, setSizeBucket] = useState<SizeBucket>(
    room.sizeBucket ?? "MEDIUM",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    if (!roomName.trim()) {
      notify({ title: "Name cannot be empty", variant: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateRoom(room.id, {
        roomName: roomName.trim(),
        roomType,
        sizeBucket,
      });
      onUpdated(updated);
      notify({
        title: "Room updated",
        description: `${updated.roomName} was saved.`,
        variant: "success",
      });
    } catch (error) {
      notify({
        title: "Could not update the room",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-primary/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-room-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              Edit room
            </p>
            <h2
              id="edit-room-title"
              className="mt-1 font-display text-xl font-bold text-primary"
            >
              {room.roomName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label>
            <span className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Room name
            </span>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={INPUT_CLASS_NAME}
              placeholder="Master Bedroom"
              autoFocus
            />
          </label>

          <label>
            <span className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Room type
            </span>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className={INPUT_CLASS_NAME}
            >
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Size
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SIZE_OPTIONS.map((option) => {
                const isSelected = sizeBucket === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSizeBucket(option.value)}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-bg hover:border-accent/60"
                    }`}
                  >
                    <p className="font-body text-sm font-bold text-primary">
                      {option.label}
                    </p>
                    <p className="mt-0.5 font-body text-[10px] text-muted">
                      {option.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full border border-border bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-surface-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !roomName.trim()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
