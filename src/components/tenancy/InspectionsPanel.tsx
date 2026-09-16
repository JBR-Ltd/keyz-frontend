"use client";

import { Camera, Loader2, Plus, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  addInspectionPhoto,
  getInspections,
  removeInspectionPhoto,
  respondToInspection,
  saveInspectionItems,
  startInspection,
  submitInspection,
  type Inspection,
  type InspectionItem,
  type InspectionKind,
  type InspectionStatus,
  type ItemCondition,
} from "@/lib/tenancyRecords";

interface InspectionsPanelProps {
  bookingId: number;
  viewer: "tenant" | "host";
}

const KIND_LABELS: Record<InspectionKind, string> = {
  MOVE_IN: "Move-in report",
  MOVE_OUT: "Move-out report",
};

const STATUS_LABELS: Record<InspectionStatus, string> = {
  DRAFT: "Draft, only you can see it",
  SUBMITTED: "Waiting for an answer",
  ACKNOWLEDGED: "Acknowledged",
  CONTESTED: "Contested",
};

const CONDITION_OPTIONS: { label: string; value: ItemCondition }[] = [
  { label: "Good", value: "GOOD" },
  { label: "Fair", value: "FAIR" },
  { label: "Poor", value: "POOR" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Missing", value: "MISSING" },
];

/** Rooms most Nigerian flats have, so a report starts with something to fill in. */
const STARTER_ITEMS: InspectionItem[] = [
  { room: "Living room", item: "Walls and paint", condition: "GOOD", note: null },
  { room: "Kitchen", item: "Sink and taps", condition: "GOOD", note: null },
  { room: "Bathroom", item: "Toilet, shower and tiles", condition: "GOOD", note: null },
  { room: "Bedroom", item: "Doors, locks and windows", condition: "GOOD", note: null },
];

// === Editor for the viewer's own draft

function DraftEditor({
  bookingId,
  inspection,
  onChange,
}: {
  bookingId: number;
  inspection: Inspection;
  onChange: (updated: Inspection) => void;
}): ReactElement {
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<InspectionItem[]>(
    inspection.items.length > 0 ? inspection.items : STARTER_ITEMS,
  );
  const [note, setNote] = useState(inspection.note ?? "");
  const [photoRoom, setPhotoRoom] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "photo" | "submit">("");

  const update = (index: number, patch: Partial<InspectionItem>): void => {
    setItems((current) => current.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  };

  const fail = (message: string | undefined): void => {
    notify({ title: "That did not work", description: message ?? "Try again in a moment.", variant: "error" });
  };

  const save = async (): Promise<Inspection | null> => {
    const cleaned = items
      .map((item) => ({ ...item, room: item.room.trim(), item: item.item.trim(), note: item.note?.trim() || null }))
      .filter((item) => item.room && item.item);
    const result = await saveInspectionItems(bookingId, inspection.id, note.trim(), cleaned);

    if (!result.data) {
      fail(result.message);
      return null;
    }

    onChange(result.data);
    return result.data;
  };

  const saveOnly = async (): Promise<void> => {
    setBusy("save");
    const saved = await save();
    setBusy("");

    if (saved) {
      notify({ title: "Report saved", variant: "success" });
    }
  };

  const upload = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return;
    }

    setBusy("photo");
    const result = await addInspectionPhoto(bookingId, inspection.id, file, photoRoom.trim(), "");
    setBusy("");

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    if (!result.data) {
      fail(result.message);
      return;
    }

    onChange(result.data);
  };

  const removePhoto = async (photoId: number): Promise<void> => {
    const result = await removeInspectionPhoto(bookingId, inspection.id, photoId);

    if (result.data) {
      onChange(result.data);
    } else {
      fail(result.message);
    }
  };

  const submit = async (): Promise<void> => {
    if (!window.confirm("Submit this report? It cannot be changed afterwards, and the other side is asked to answer it.")) {
      return;
    }

    setBusy("submit");
    const saved = await save();

    if (!saved) {
      setBusy("");
      return;
    }

    const result = await submitInspection(bookingId, inspection.id);
    setBusy("");

    if (!result.data) {
      fail(result.message);
      return;
    }

    onChange(result.data);
    notify({ title: "Report submitted", description: "The other side has been asked to acknowledge it.", variant: "success" });
  };

  return (
    <div className="mt-4 grid gap-4">
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div
            key={`item-${index}`}
            className="grid gap-2 rounded-lg bg-surface-soft p-3 sm:grid-cols-[1fr_1.3fr_8rem_auto] sm:items-start"
          >
            <input
              id={`inspection-${inspection.id}-room-${index}`}
              aria-label="Room"
              value={item.room}
              maxLength={64}
              onChange={(event) => update(index, { room: event.target.value })}
              placeholder="Room"
              className="min-h-10 rounded-md border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent"
            />
            <input
              id={`inspection-${inspection.id}-item-${index}`}
              aria-label="Item"
              value={item.item}
              maxLength={128}
              onChange={(event) => update(index, { item: event.target.value })}
              placeholder="What you checked"
              className="min-h-10 rounded-md border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent"
            />
            <Select
              ariaLabel="Condition"
              value={item.condition}
              onValueChange={(value) => update(index, { condition: value as ItemCondition })}
              options={CONDITION_OPTIONS}
              className="min-h-10 w-full rounded-md border border-border bg-bg px-3 font-body text-sm text-primary"
            />
            <button
              type="button"
              onClick={() => setItems((current) => current.filter((_, position) => position !== index))}
              aria-label={`Remove ${item.item || "this line"}`}
              className="flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-primary/5 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Trash2 size={15} />
            </button>
            {item.condition !== "GOOD" ? (
              <input
                id={`inspection-${inspection.id}-note-${index}`}
                aria-label="What is wrong"
                value={item.note ?? ""}
                maxLength={1000}
                onChange={(event) => update(index, { note: event.target.value })}
                placeholder="Describe the damage or what is missing"
                className="min-h-10 rounded-md border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent sm:col-span-4"
              />
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((current) => [...current, { room: "", item: "", condition: "GOOD", note: null }])}
          className="inline-flex w-fit items-center gap-2 font-body text-sm font-bold text-accent-alt hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Plus size={15} aria-hidden="true" />
          Add a line
        </button>
      </div>

      <label htmlFor={`inspection-${inspection.id}-general`} className="font-body text-sm font-bold text-primary">
        General note
        <textarea
          id={`inspection-${inspection.id}-general`}
          rows={2}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Meter readings, number of keys handed over"
          className="mt-2 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm font-normal text-primary outline-none focus:border-accent"
        />
      </label>

      <div className="grid gap-3 rounded-lg border border-dashed border-border p-3">
        <p className="font-body text-sm font-bold text-primary">Photos ({inspection.photos.length} of 80)</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`inspection-${inspection.id}-photo-room`}
            aria-label="Room for the next photo"
            value={photoRoom}
            maxLength={64}
            onChange={(event) => setPhotoRoom(event.target.value)}
            placeholder="Room (optional)"
            className="min-h-10 flex-1 rounded-md border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent"
          />
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 font-body text-xs font-bold text-white hover:bg-accent hover:text-primary focus-within:ring-2 focus-within:ring-accent">
            {busy === "photo" ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} aria-hidden="true" />}
            Add photo
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy !== ""}
              onChange={(event) => void upload(event.target.files?.[0])}
              className="sr-only"
            />
          </label>
        </div>
        {inspection.photos.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {inspection.photos.map((photo) => (
              <li key={photo.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded evidence from storage, not a static asset */}
                <img src={photo.url} alt={photo.room ?? "Condition photo"} className="aspect-square w-full rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => void removePhoto(photo.id)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-bg/90 text-red-700 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void saveOnly()}
          disabled={busy !== ""}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        >
          {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : null}
          Save draft
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy !== ""}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        >
          {busy === "submit" ? <Loader2 size={15} className="animate-spin" /> : null}
          Submit report
        </button>
      </div>
    </div>
  );
}

// === A submitted report

function SubmittedReport({
  bookingId,
  inspection,
  onChange,
}: {
  bookingId: number;
  inspection: Inspection;
  onChange: (updated: Inspection) => void;
}): ReactElement {
  const { notify } = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const canAnswer = !inspection.mine && inspection.status === "SUBMITTED";

  const answer = async (agree: boolean): Promise<void> => {
    setBusy(true);
    const result = await respondToInspection(bookingId, inspection.id, agree, note.trim());
    setBusy(false);

    if (!result.data) {
      notify({ title: "Answer not saved", description: result.message ?? "Try again in a moment.", variant: "error" });
      return;
    }

    onChange(result.data);
    notify({ title: agree ? "Report acknowledged" : "Report contested", variant: "success" });
  };

  return (
    <div className="mt-4 grid gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[28rem] font-body text-sm">
          <thead className="bg-surface-soft text-left text-xs uppercase tracking-[0.1em] text-muted">
            <tr>
              <th className="px-3 py-2">Room</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Condition</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-primary">
            {inspection.items.map((item, index) => (
              <tr key={`${item.room}-${item.item}-${index}`}>
                <td className="px-3 py-2">{item.room}</td>
                <td className="px-3 py-2">{item.item}</td>
                <td className={`px-3 py-2 font-bold ${item.condition === "GOOD" || item.condition === "FAIR" ? "" : "text-red-700"}`}>
                  {CONDITION_OPTIONS.find((option) => option.value === item.condition)?.label}
                </td>
                <td className="px-3 py-2 text-muted">{item.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inspection.note ? <p className="font-body text-sm leading-6 text-muted">{inspection.note}</p> : null}

      {inspection.photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {inspection.photos.map((photo) => (
            <li key={photo.id}>
              <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded evidence from storage, not a static asset */}
                <img src={photo.url} alt={photo.room ?? "Condition photo"} className="aspect-square w-full rounded-md object-cover" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {inspection.responseNote ? (
        <p className="rounded-lg border-l-2 border-accent bg-accent/10 p-3 font-body text-sm leading-6 text-primary">
          <span className="font-bold">{inspection.status === "CONTESTED" ? "Contested: " : "Note: "}</span>
          {inspection.responseNote}
        </p>
      ) : null}

      {canAnswer ? (
        <div className="grid gap-3 rounded-lg bg-surface-soft p-3">
          <label htmlFor={`inspection-${inspection.id}-answer`} className="font-body text-sm font-bold text-primary">
            Does this match what you saw?
            <span className="block font-normal text-muted">Deposit claims are decided from these reports, so answer while it is fresh.</span>
          </label>
          <textarea
            id={`inspection-${inspection.id}-answer`}
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Required if you disagree"
            className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-primary outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void answer(true)}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              Acknowledge
            </button>
            <button
              type="button"
              onClick={() => void answer(false)}
              disabled={busy || !note.trim()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-700/40 px-5 font-body text-sm font-bold text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              Contest
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// === Panel

export default function InspectionsPanel({ bookingId, viewer }: InspectionsPanelProps): ReactElement {
  const { notify } = useToast();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [starting, setStarting] = useState<InspectionKind | null>(null);

  useEffect(() => {
    let active = true;

    void getInspections(bookingId).then((result) => {
      if (!active) {
        return;
      }

      setInspections(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [bookingId]);

  const replace = (updated: Inspection): void => {
    setInspections((current) =>
      current.some((item) => item.id === updated.id)
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : [...current, updated],
    );
  };

  const start = async (kind: InspectionKind): Promise<void> => {
    setStarting(kind);
    const result = await startInspection(bookingId, kind);
    setStarting(null);

    if (!result.data) {
      notify({ title: "Report not started", description: result.message ?? "Try again in a moment.", variant: "error" });
      return;
    }

    replace(result.data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status">
        <Loader2 size={20} className="animate-spin text-muted" />
        <span className="sr-only">Loading condition reports</span>
      </div>
    );
  }

  const mineByKind = (kind: InspectionKind): boolean => inspections.some((item) => item.mine && item.kind === kind);

  return (
    <div className="grid gap-5">
      <p className="rounded-xl bg-surface-soft p-4 font-body text-sm leading-6 text-muted">
        Walk through the home room by room and photograph anything that is not perfect.
        Once submitted, a report cannot be changed and {viewer === "tenant" ? "your host" : "your tenant"} is asked to
        acknowledge or contest it. It is what a deposit claim is decided from.
      </p>

      {loadError ? <p className="font-body text-sm text-red-700">{loadError}</p> : null}

      <div className="flex flex-wrap gap-3">
        {(["MOVE_IN", "MOVE_OUT"] as InspectionKind[])
          .filter((kind) => !mineByKind(kind))
          .map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => void start(kind)}
              disabled={starting !== null}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              {starting === kind ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} aria-hidden="true" />}
              Start {KIND_LABELS[kind].toLowerCase()}
            </button>
          ))}
      </div>

      {inspections.length === 0 ? (
        <p className="font-body text-sm text-muted">No condition reports on this booking yet.</p>
      ) : (
        <ul className="grid gap-4">
          {inspections.map((inspection) => (
            <li key={inspection.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-body text-base font-bold text-primary">
                    {KIND_LABELS[inspection.kind]} by {inspection.mine ? "you" : inspection.authorName}
                  </p>
                  <p className="mt-1 font-body text-xs text-muted">{STATUS_LABELS[inspection.status]}</p>
                </div>
                {inspection.intact === true ? (
                  <span className="inline-flex items-center gap-1 font-body text-xs font-bold text-emerald-700">
                    <ShieldCheck size={14} aria-hidden="true" />
                    Unchanged since submitted
                  </span>
                ) : inspection.intact === false ? (
                  <span className="inline-flex items-center gap-1 font-body text-xs font-bold text-red-700">
                    <ShieldAlert size={14} aria-hidden="true" />
                    Changed after submission
                  </span>
                ) : null}
              </div>
              {inspection.status === "DRAFT" && inspection.mine ? (
                <DraftEditor bookingId={bookingId} inspection={inspection} onChange={replace} />
              ) : (
                <SubmittedReport bookingId={bookingId} inspection={inspection} onChange={replace} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
