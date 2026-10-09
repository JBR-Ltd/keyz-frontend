// src/components/tour/RoomBoardPage.tsx
//
// The landlord/agent capture tracking board. Shows every room on every floor
// of the property's virtual tour, grouped by floor. Each floor carries its
// own actions (open its floor plan, add a room to it) so the host never has
// to pick a floor up front.

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
import { getFloorsForProperty } from "@/lib/api/tours/floors";
import { deleteRoom, getRoomsForFloor, updateRoom } from "@/lib/api/tours/rooms";
import { ROOM_TYPES, SIZE_OPTIONS } from "@/lib/tourConstants";
import type { Floor, Room, SizeBucket } from "@/lib/types/tour";

interface RoomBoardPageProps {
  propertyId: number;
  role: "landlord" | "agent";
}

interface FloorWithRooms {
  floor: Floor;
  rooms: Room[];
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; floors: FloorWithRooms[] };

const INPUT_CLASS_NAME =
  "mt-2 min-h-11 w-full rounded-lg border border-border bg-bg px-3 font-body text-sm text-primary outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function RoomBoardPage({
  propertyId,
  role,
}: RoomBoardPageProps): ReactElement {
  const { notify } = useToast();
  const router = useRouter();

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setState({ status: "loading" });
    try {
      const floors = await getFloorsForProperty(propertyId);
      const withRooms = await Promise.all(
        floors.map(async (floor) => ({
          floor,
          rooms: await getRoomsForFloor(floor.id),
        })),
      );
      setState({ status: "ready", floors: withRooms });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not load the rooms for this property.",
      });
    }
  }, [propertyId]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const summary = useMemo(() => {
    if (state.status !== "ready") {
      return { total: 0, ready: 0, pending: 0, retake: 0, floors: 0 };
    }
    const allRooms = state.floors.flatMap((f) => f.rooms);
    const total = allRooms.length;
    const ready = allRooms.filter((r) => r.status === "ready").length;
    const retake = allRooms.filter((r) => r.status === "retake").length;
    return {
      total,
      ready,
      pending: total - ready - retake,
      retake,
      floors: state.floors.length,
    };
  }, [state]);

  const tourBase = `/${role}/listings/${propertyId}/tour`;

  const handleRoomClick = (room: Room, floor: Floor): void => {
    const params = new URLSearchParams();
    params.set("floor", String(floor.id));
    params.set("room", String(room.id));
    router.push(`${tourBase}?${params.toString()}`);
  };

  const handleAddRoom = (floor: Floor): void => {
    const params = new URLSearchParams();
    params.set("floor", String(floor.id));
    params.set("action", "add-room");
    router.push(`${tourBase}?${params.toString()}`);
  };

  const handleOpenFloorPlan = (floor: Floor): void => {
    router.push(
      `/${role}/listings/${propertyId}/floor-plan?floor=${floor.id}`,
    );
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
        setState((current) => {
          if (current.status !== "ready") return current;
          return {
            status: "ready",
            floors: current.floors.map((entry) => ({
              ...entry,
              rooms: entry.rooms.filter((r) => r.id !== room.id),
            })),
          };
        });
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
    [notify],
  );

  const handleRoomUpdated = useCallback((updated: Room): void => {
    setState((current) => {
      if (current.status !== "ready") return current;
      return {
        status: "ready",
        floors: current.floors.map((entry) => ({
          ...entry,
          rooms: entry.rooms.map((r) => (r.id === updated.id ? updated : r)),
        })),
      };
    });
    setEditingRoom(null);
  }, []);

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
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:border-accent"
          >
            Retry
          </button>
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
              Manage rooms
            </h1>
            <p className="mt-2 max-w-2xl font-body text-sm text-muted">
              Every room across every floor of this tour. Track which are
              captured, which need a retake, and which are ready to publish.
              Hover a tile to edit or delete it.
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
          </div>
        </header>

        <section className="mt-8 rounded-xl border border-border bg-bg p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat
              label="Total rooms"
              value={String(summary.total)}
              tone="neutral"
            />
            <Stat label="Ready" value={String(summary.ready)} tone="success" />
            <Stat
              label="Pending"
              value={String(summary.pending)}
              tone="accent"
            />
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

        {state.floors.length === 0 ? (
          <section className="mt-10 rounded-xl border border-dashed border-primary/20 bg-surface-soft/40 p-12 text-center">
            <p className="font-display text-xl font-bold text-primary">
              No floors yet
            </p>
            <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted">
              Start the virtual tour to add your first floor, then capture its
              rooms one by one.
            </p>
            <Link
              href={`/${role}/listings/${propertyId}/tour`}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <Sparkles size={15} aria-hidden="true" />
              Set up your tour
            </Link>
          </section>
        ) : (
          <div className="mt-10 space-y-10">
            {state.floors.map(({ floor, rooms }) => (
              <FloorSection
                key={floor.id}
                floor={floor}
                rooms={rooms}
                deletingId={deletingId}
                onRoomClick={(room) => handleRoomClick(room, floor)}
                onEditRoom={setEditingRoom}
                onDeleteRoom={(room) => void handleDelete(room)}
                onAddRoom={() => handleAddRoom(floor)}
                onOpenFloorPlan={() => handleOpenFloorPlan(floor)}
              />
            ))}
          </div>
        )}

        {state.floors.length > 0 ? (
          <section className="mt-10 rounded-xl border border-accent/40 bg-accent/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-accent-alt">
                  <Sparkles
                    size={12}
                    className="mr-1.5 inline"
                    aria-hidden="true"
                  />
                  Next step
                </p>
                <p className="mt-2 font-body text-sm leading-6 text-primary">
                  {summary.total === 0
                    ? "Add rooms to your floors to start capturing."
                    : summary.ready === 0
                      ? "Capture at least one room before generating a floor plan."
                      : summary.pending === 0
                        ? "Every room across every floor is captured. Generate and review each floor plan."
                        : `${summary.pending} room${summary.pending === 1 ? "" : "s"} still need capturing across ${summary.floors} floor${summary.floors === 1 ? "" : "s"}.`}
                </p>
              </div>
            </div>
          </section>
        ) : null}
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

interface FloorSectionProps {
  floor: Floor;
  rooms: Room[];
  deletingId: number | null;
  onRoomClick: (room: Room) => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onAddRoom: () => void;
  onOpenFloorPlan: () => void;
}

function FloorSection({
  floor,
  rooms,
  deletingId,
  onRoomClick,
  onEditRoom,
  onDeleteRoom,
  onAddRoom,
  onOpenFloorPlan,
}: FloorSectionProps): ReactElement {
  const readyCount = rooms.filter((r) => r.status === "ready").length;

  return (
    <section
      aria-labelledby={`floor-section-${floor.id}`}
      className="rounded-xl border border-border bg-bg shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface-soft/40 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id={`floor-section-${floor.id}`}
              className="font-display text-xl font-bold text-primary"
            >
              {floor.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-body text-[10px] font-bold ${
                floor.isFloorPlanConfirmed
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {floor.isFloorPlanConfirmed
                ? "Floor plan confirmed"
                : "Floor plan not confirmed"}
            </span>
          </div>
          <p className="mt-1 font-body text-xs text-muted">
            {rooms.length === 0
              ? "No rooms captured on this floor yet."
              : `${readyCount} of ${rooms.length} room${rooms.length === 1 ? "" : "s"} ready`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenFloorPlan}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-bg px-4 font-body text-xs font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <LayoutGrid size={13} aria-hidden="true" />
            Open floor plan
          </button>
          <button
            type="button"
            onClick={onAddRoom}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 font-body text-xs font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus size={13} aria-hidden="true" />
            Add room
          </button>
        </div>
      </header>

      <div className="p-5">
        {rooms.length === 0 ? (
          <div className="rounded-lg border border-dashed border-primary/20 bg-surface-soft/40 px-6 py-10 text-center">
            <p className="font-body text-sm font-bold text-primary">
              No rooms on this floor yet
            </p>
            <p className="mx-auto mt-1 max-w-md font-body text-xs text-muted">
              Add the first room to start capturing. Each room gets its own
              panorama, door pins, and status.
            </p>
            <button
              type="button"
              onClick={onAddRoom}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <Plus size={14} aria-hidden="true" />
              Add the first room
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => (
              <li key={room.id}>
                <RoomTile
                  room={room}
                  onClick={onRoomClick}
                  onEdit={onEditRoom}
                  onDelete={onDeleteRoom}
                  isDeleting={deletingId === room.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
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
