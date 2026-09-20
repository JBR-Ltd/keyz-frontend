"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CalendarDays, Check, Loader2, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";
import { createRentalRequest, type MoveInPreference } from "@/lib/bookings";
import type { RentalMode } from "@/lib/hostListings";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface RentalRequestDialogProps {
  hostName: string;
  hostRole: string;
  onClose: () => void;
  open: boolean;
  price: number;
  propertyId: string;
  propertyTitle: string;
  rentalMode: RentalMode;
}

const PREFERENCES: Array<{
  description: string;
  label: string;
  value: MoveInPreference;
}> = [
  {
    value: "ASAP",
    label: "As soon as possible",
    description: "I am ready to move soon",
  },
  {
    value: "WITHIN_30_DAYS",
    label: "Within 30 days",
    description: "I need a little time to prepare",
  },
  {
    value: "EXACT_DATE",
    label: "Choose a date",
    description: "I have a preferred move-in day",
  },
  {
    value: "FLEXIBLE",
    label: "I am flexible",
    description: "I can agree a date with the host",
  },
];

function formatNaira(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function earliestMoveIn(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export default function RentalRequestDialog({
  hostName,
  hostRole,
  onClose,
  open,
  price,
  propertyId,
  propertyTitle,
  rentalMode,
}: RentalRequestDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const { notify } = useToast();
  const [step, setStep] = useState<"details" | "review">("details");
  const [preference, setPreference] = useState<MoveInPreference>("ASAP");
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose, open]);

  const continueToReview = (): void => {
    if (preference === "EXACT_DATE" && !preferredDate) {
      setError("Choose your preferred move-in date.");
      return;
    }
    setError("");
    setStep("review");
  };

  const submit = async (): Promise<void> => {
    setIsSubmitting(true);
    setError("");
    const result = await createRentalRequest({
      propertyId: Number(propertyId),
      moveInPreference: preference,
      preferredMoveInDate:
        preference === "EXACT_DATE" ? preferredDate : undefined,
      message: message.trim() || undefined,
    });
    setIsSubmitting(false);
    if (!result.data) {
      setError(result.message ?? "That rental request could not be sent.");
      return;
    }
    notify({
      title: "Rental request sent",
      description: `${propertyTitle} is waiting on the host to respond.`,
      variant: "success",
    });
    onClose();
  };

  if (!open) return null;
  const selected = PREFERENCES.find((item) => item.value === preference);

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close rental request"
            onClick={onClose}
            className="absolute inset-0 bg-primary/50"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rental-request-title"
            className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-bg shadow-2xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={step === "review" ? () => setStep("details") : onClose}
                aria-label={step === "review" ? "Back" : "Close"}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {step === "review" ? <ArrowLeft size={19} /> : <X size={19} />}
              </button>
              <p className="font-body text-sm font-bold text-primary">
                {step === "details" ? "Request to rent" : "Review request"}
              </p>
              <span className="w-10 font-body text-xs text-muted">
                {step === "details" ? "1 of 2" : "2 of 2"}
              </span>
            </header>

            <div className="p-5 sm:p-7">
              <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-accent-alt">
                Long-term rental
              </p>
              <h2
                id="rental-request-title"
                className="mt-2 font-display text-3xl font-bold text-primary"
              >
                {propertyTitle}
              </h2>
              <p className="mt-2 font-body text-sm text-muted">
                {formatNaira(price)} per{" "}
                {rentalMode === "MONTHLY" ? "month" : "year"}
              </p>
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-border p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">
                  {hostName
                    .split(" ")
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span>
                  <span className="block font-body text-sm font-bold text-primary">
                    {hostName}
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-muted">
                    Listed by {hostRole.toLowerCase()}
                  </span>
                </span>
              </div>

              {step === "details" ? (
                <>
                  <fieldset className="mt-7">
                    <legend className="font-body text-base font-bold text-primary">
                      When would you like to move in?
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {PREFERENCES.map((item) => {
                        const active = preference === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setPreference(item.value)}
                            className={`relative rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "border-primary bg-primary text-white" : "border-border bg-bg hover:border-primary/30 hover:bg-surface-soft"}`}
                          >
                            <span className="block pr-6 font-body text-sm font-bold">
                              {item.label}
                            </span>
                            <span
                              className={`mt-1 block font-body text-xs leading-5 ${active ? "text-white/75" : "text-muted"}`}
                            >
                              {item.description}
                            </span>
                            {active ? (
                              <Check
                                size={17}
                                className="absolute right-3 top-3"
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  {preference === "EXACT_DATE" ? (
                    <div className="mt-5">
                      <label
                        htmlFor="preferred-move-in-date"
                        className="font-body text-sm font-bold text-primary"
                      >
                        Preferred move-in date
                      </label>
                      <DatePicker
                        id="preferred-move-in-date"
                        ariaLabel="Preferred move-in date"
                        className="mt-2"
                        minDate={earliestMoveIn()}
                        value={preferredDate}
                        onChange={setPreferredDate}
                      />
                    </div>
                  ) : null}
                  <label className="mt-5 block">
                    <span className="flex justify-between gap-4 font-body text-sm font-bold text-primary">
                      <span>Introduce yourself</span>
                      <span className="font-normal text-muted">Optional</span>
                    </span>
                    <textarea
                      value={message}
                      maxLength={500}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Tell the host a little about yourself and your plans for the home."
                      className="mt-2 min-h-28 w-full resize-none rounded-xl border border-border bg-bg p-4 font-body text-sm text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                    <span className="mt-1 block text-right font-body text-xs text-muted">
                      {message.length}/500
                    </span>
                  </label>
                </>
              ) : (
                <div className="mt-7 space-y-4">
                  <div className="rounded-xl bg-surface-soft p-5">
                    <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-muted">
                      Move-in preference
                    </p>
                    <p className="mt-2 font-body text-base font-bold text-primary">
                      {selected?.label}
                    </p>
                    {preferredDate ? (
                      <p className="mt-1 font-body text-sm text-muted">
                        {new Date(
                          `${preferredDate}T00:00:00`,
                        ).toLocaleDateString("en-NG", { dateStyle: "long" })}
                      </p>
                    ) : null}
                  </div>
                  {message.trim() ? (
                    <div className="rounded-xl border border-border p-5">
                      <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-muted">
                        Your message
                      </p>
                      <p className="mt-2 font-body text-sm leading-6 text-primary">
                        {message.trim()}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                    <CalendarDays
                      size={20}
                      className="mt-0.5 shrink-0 text-accent-alt"
                    />
                    <p className="font-body text-sm leading-6 text-muted">
                      This sends a request only. The host must respond, and no
                      payment is taken now.
                    </p>
                  </div>
                </div>
              )}

              {error ? (
                <p className="mt-4 rounded-lg border border-red-500/30 px-4 py-3 font-body text-sm font-medium text-red-700">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={
                  step === "details" ? continueToReview : () => void submit()
                }
                disabled={isSubmitting}
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {step === "details"
                  ? "Review request"
                  : isSubmitting
                    ? "Sending request"
                    : "Send rental request"}
              </button>
            </div>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
