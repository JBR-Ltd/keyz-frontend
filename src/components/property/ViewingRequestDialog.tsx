"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, MapPin, Video, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { requestViewing, type ViewingType } from "@/lib/viewings";

interface ViewingRequestDialogProps {
  /** Absent when the listing has no virtual tour set up. */
  allowVirtual: boolean;
  onClose: () => void;
  open: boolean;
  propertyId: string;
  propertyTitle: string;
}

const NOTE_LIMIT = 500;

/** Local datetime for the input, which has no timezone of its own. */
function toInputValue(value: Date): string {
  const offset = value.getTimezoneOffset() * 60_000;

  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

/** Tomorrow at ten, so the field opens on something a person would pick. */
function defaultSlot(): string {
  const slot = new Date();
  slot.setDate(slot.getDate() + 1);
  slot.setHours(10, 0, 0, 0);

  return toInputValue(slot);
}

export default function ViewingRequestDialog({
  allowVirtual,
  onClose,
  open,
  propertyId,
  propertyTitle,
}: ViewingRequestDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const [type, setType] = useState<ViewingType>(
    allowVirtual ? "VIRTUAL" : "IN_PERSON",
  );
  const [startAt, setStartAt] = useState(defaultSlot);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  const submit = async (): Promise<void> => {
    setFormError("");

    if (!startAt) {
      setFormError("Choose a time.");
      return;
    }

    if (new Date(startAt) <= new Date()) {
      setFormError("Choose a time in the future.");
      return;
    }

    setIsSubmitting(true);

    // The input gives local time without a zone; seconds keep the server parser happy
    const result = await requestViewing(
      Number(propertyId),
      type,
      `${startAt}:00`,
      note.trim() || undefined,
    );

    setIsSubmitting(false);

    if (!result.data) {
      setFormError(result.message ?? "That viewing could not be requested.");
      return;
    }

    notify({
      title: "Viewing requested",
      description: `The host will confirm a time for ${propertyTitle}.`,
      variant: "success",
    });
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Close viewing request"
            onClick={onClose}
            className="absolute inset-0 bg-primary/45"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Request a viewing of ${propertyTitle}`}
            className="relative w-full max-w-lg rounded-t-2xl bg-bg p-6 shadow-xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                  Request a viewing
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-primary">
                  {propertyTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 font-body text-sm leading-6 text-muted">
              Nothing is booked or charged. The host picks a time and confirms.
            </p>

            <div
              className="mt-6 flex gap-2"
              role="radiogroup"
              aria-label="Kind of viewing"
            >
              {([
                { icon: Video, id: "VIRTUAL" as const, label: "Video tour" },
                { icon: MapPin, id: "IN_PERSON" as const, label: "In person" },
              ]).map((option) => {
                const Icon = option.icon;
                const active = type === option.id;
                // A listing with no tour set up cannot host a video walk-through
                const disabled = option.id === "VIRTUAL" && !allowVirtual;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={disabled}
                    onClick={() => setType(option.id)}
                    className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-border text-primary hover:bg-primary/5"
                    }`}
                  >
                    <Icon size={17} />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block">
              <span className="font-body text-sm font-bold text-primary">
                Preferred time
              </span>
              <input
                type="datetime-local"
                value={startAt}
                min={toInputValue(new Date())}
                onChange={(event) => setStartAt(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>

            <label className="mt-5 block">
              <span className="font-body text-sm font-bold text-primary">
                Anything the host should know
              </span>
              <textarea
                value={note}
                maxLength={NOTE_LIMIT}
                rows={3}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Weekday evenings suit me best."
                className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>

            {formError ? (
              <p className="mt-4 rounded-lg border border-red-500/30 px-4 py-3 font-body text-sm font-medium text-red-700">
                {formError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={isSubmitting}
              className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}
              Send request
            </button>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
