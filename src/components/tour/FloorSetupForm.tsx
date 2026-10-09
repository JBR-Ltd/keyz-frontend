"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Check, Layers, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/toast";
import {
  createFloor,
  deleteFloor,
  getFloorsForProperty,
  updateFloor,
} from "@/lib/api/tours/floors";
import type { Floor } from "@/lib/types/tour";

interface FloorSetupFormProps {
  propertyId: number;
  onContinue: (floor: Floor) => void;
  /**
   * Optional. When provided and at least one floor exists, a "Review tour"
   * button appears. It is how a host jumps to the tour overview without
   * walking through every floor again.
   */
  onReviewTour?: () => void;
}

const FLOOR_SUGGESTIONS = [
  "Ground Floor",
  "First Floor",
  "Second Floor",
  "Third Floor",
];

const INPUT_CLASS_NAME =
  "mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function FloorSetupForm({
  propertyId,
  onContinue,
  onReviewTour,
}: FloorSetupFormProps): ReactElement {
  const { notify } = useToast();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState(FLOOR_SUGGESTIONS[0]);
  const [floorNumber, setFloorNumber] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Floor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getFloorsForProperty(propertyId);
      setFloors(list);
      setSelectedId(list[list.length - 1]?.id ?? null);
    } catch {
      setFloors([]);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const handleAddFloor = async (): Promise<void> => {
    if (!name.trim()) return;
    setIsAdding(true);
    try {
      const created = await createFloor(propertyId, {
        floorNumber,
        name: name.trim(),
      });
      setFloors((current) => [...current, created]);
      setSelectedId(created.id);
      const next = floors.length + 1;
      setName(FLOOR_SUGGESTIONS[next] ?? `Floor ${next + 1}`);
      setFloorNumber(next + 1);
    } catch (error) {
      notify({
        title: "Could not add the floor",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (floor: Floor): void => {
    setEditingId(floor.id);
    setEditName(floor.name);
    setEditNumber(floor.floorNumber);
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (): Promise<void> => {
    if (editingId === null || !editName.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await updateFloor(editingId, {
        name: editName.trim(),
        floorNumber: editNumber,
      });
      setFloors((current) =>
        current.map((f) => (f.id === updated.id ? updated : f)),
      );
      setEditingId(null);
    } catch (error) {
      notify({
        title: "Could not update the floor",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteFloor(pendingDelete.id);
      setFloors((current) => current.filter((f) => f.id !== pendingDelete.id));
      if (selectedId === pendingDelete.id) setSelectedId(null);
      notify({
        title: "Floor deleted",
        description: `${pendingDelete.name} and its rooms were removed.`,
        variant: "success",
      });
      setPendingDelete(null);
    } catch (error) {
      notify({
        title: "Could not delete the floor",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContinue = (): void => {
    const chosen = floors.find((floor) => floor.id === selectedId);
    if (chosen) onContinue(chosen);
  };

  const showReview = onReviewTour !== undefined && floors.length > 0;

  return (
    <section aria-labelledby="tour-floor-setup">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
            Floors
          </p>
          <h2
            id="tour-floor-setup"
            className="mt-2 font-display text-2xl font-bold text-primary"
          >
            Which floor are you capturing?
          </h2>
        </div>
        {showReview ? (
          <button
            type="button"
            onClick={onReviewTour}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/20 bg-bg px-4 font-body text-xs font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10"
          >
            <Layers size={13} aria-hidden="true" />
            Review tour
          </button>
        ) : null}
      </div>

      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Every room you capture next will belong to the floor you pick here.
        Add as many floors as the property has.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <p className="flex items-center gap-2 font-body text-sm text-muted">
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            Loading floors...
          </p>
        ) : floors.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface-soft/40 px-4 py-6 text-center font-body text-sm text-muted">
            No floors yet. Add the first one below.
          </p>
        ) : (
          <ul className="grid gap-2">
            {floors.map((floor) => {
              const isEditing = editingId === floor.id;
              const isSelected = floor.id === selectedId;

              if (isEditing) {
                return (
                  <li
                    key={floor.id}
                    className="rounded-lg border border-accent bg-accent/5 p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end">
                      <label>
                        <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                          Name
                        </span>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-1 min-h-10 w-full rounded-md border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label>
                        <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted">
                          Number
                        </span>
                        <input
                          type="number"
                          value={editNumber}
                          onChange={(e) =>
                            setEditNumber(Number(e.target.value) || 1)
                          }
                          min={1}
                          className="mt-1 min-h-10 w-full rounded-md border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => void saveEdit()}
                          disabled={isSavingEdit || !editName.trim()}
                          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 font-body text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSavingEdit ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-bg px-4 font-body text-xs font-bold text-primary transition-colors hover:bg-surface-soft"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={floor.id}>
                  <div
                    className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-all duration-200 ease-in-out ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-bg hover:border-accent/60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(floor.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className="block font-body text-sm font-bold text-primary">
                          {floor.name}
                        </span>
                        {floor.isFloorPlanConfirmed ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 font-body text-[10px] font-bold text-green-800">
                            Confirmed
                          </span>
                        ) : null}
                      </span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                        Level {floor.floorNumber}
                      </span>
                    </button>

                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(floor)}
                        aria-label={`Edit ${floor.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg text-primary transition-colors hover:border-accent hover:bg-accent/10"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(floor)}
                        aria-label={`Delete ${floor.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 bg-bg text-red-700 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

     <div
  data-tour="floor-add-form"
  className="mt-6 rounded-lg border border-border bg-surface-soft/40 p-5"
>
        <p className="font-body text-sm font-bold text-primary">Add a floor</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <label>
            <span className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={INPUT_CLASS_NAME}
              placeholder="Ground Floor"
            />
          </label>
          <label>
            <span className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Number
            </span>
            <input
              type="number"
              value={floorNumber}
              onChange={(event) =>
                setFloorNumber(Number(event.target.value) || 1)
              }
              className={INPUT_CLASS_NAME}
              min={1}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void handleAddFloor()}
          disabled={isAdding || !name.trim()}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus size={15} aria-hidden="true" />
          )}
          Add floor
        </button>
      </div>

    <button
  type="button"
  data-tour="floor-continue"
  onClick={handleContinue}
  disabled={selectedId === null}
  className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
>
  Continue to capture
</button>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name ?? "this floor"}"?`}
        description={
          <>
            This will also remove every room, panorama, door pin, and
            staircase attached to it.{" "}
            <strong className="text-primary">This cannot be undone.</strong>
          </>
        }
        confirmLabel="Delete floor"
        tone="danger"
        isConfirming={isDeleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
