"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Loader2, Minus, Plus, Users, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import ShortletDateRangeCalendar from "@/components/property/ShortletDateRangeCalendar";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import {
  getPropertyAvailability,
  overlapsUnavailable,
  type UnavailableRange,
} from "@/lib/availability";
import {
  createShortletBooking,
  getBookingQuote,
  type BookingQuote,
} from "@/lib/bookings";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface ShortletBookingDialogProps {
  hostName?: string;
  hostRole?: string;
  maximumGuests?: number | null;
  minimumNights?: number | null;
  onClose: () => void;
  open: boolean;
  price: number;
  propertyId: string;
  propertyPublicId?: string;
  propertyTitle: string;
}

/** The picker's ceiling when a host set no limit. The server allows more. */
const UNLIMITED_GUEST_CEILING = 16;

function formatNaira(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ShortletBookingDialog({
  maximumGuests,
  minimumNights,
  onClose,
  open,
  price,
  propertyId,
  propertyPublicId,
  propertyTitle,
}: ShortletBookingDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const { notify } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [unavailable, setUnavailable] = useState<UnavailableRange[]>([]);
  const [quotedFor, setQuotedFor] = useState<{
    key: string;
    value: BookingQuote | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [guests, setGuests] = useState(1);
  const numericId = Number(propertyId);
  const minimum = Math.max(minimumNights ?? 1, 1);
  const guestCeiling = maximumGuests ?? UNLIMITED_GUEST_CEILING;
  const dateKey = `${numericId}:${startDate}:${endDate}:${guests}`;
  const quote = quotedFor?.key === dateKey ? quotedFor.value : null;

  const localProblem = useMemo((): string | null => {
    if (!startDate || !endDate) return null;
    const nights = Math.round(
      (new Date(`${endDate}T00:00:00`).getTime() -
        new Date(`${startDate}T00:00:00`).getTime()) /
        86400000,
    );
    if (nights < minimum)
      return `Choose at least ${minimum} ${minimum === 1 ? "night" : "nights"}.`;
    if (overlapsUnavailable(unavailable, startDate, endDate))
      return "Those dates are unavailable. Try another stay.";
    return null;
  }, [endDate, minimum, startDate, unavailable]);

  useEffect(() => {
    if (!open || !Number.isFinite(numericId)) return;
    let active = true;

    void getPropertyAvailability(propertyPublicId ?? numericId).then(
      (result) => {
        if (active) setUnavailable(result.data);
      },
    );

    return () => {
      active = false;
    };
  }, [numericId, open, propertyPublicId]);

  useEffect(() => {
    if (!open || !startDate || !endDate || localProblem) return;
    let active = true;
    void getBookingQuote(numericId, startDate, endDate, guests).then(
      (result) => {
        if (!active) return;
        setQuotedFor({
          key: `${numericId}:${startDate}:${endDate}:${guests}`,
          value: result.data,
        });
        setError(result.message ?? result.data?.unavailableReason ?? "");
      },
    );
    return () => {
      active = false;
    };
  }, [endDate, guests, localProblem, numericId, open, startDate]);

  const isQuoting =
    Boolean(startDate && endDate) &&
    localProblem === null &&
    quotedFor?.key !== dateKey;

  const submit = async (): Promise<void> => {
    if (!startDate || !endDate || localProblem || !quote) return;
    if (quote.unavailableReason) return;
    setIsSubmitting(true);
    const result = await createShortletBooking(
      numericId,
      startDate,
      endDate,
      undefined,
      guests,
    );
    setIsSubmitting(false);
    if (!result.data) {
      setError(result.message ?? "That booking could not be made.");
      return;
    }
    notify({
      title: "Shortlet request sent",
      description: `${propertyTitle} is waiting on the host to confirm.`,
      variant: "success",
    });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[130] flex h-[100dvh] items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close shortlet request"
            onClick={onClose}
            className="modal-backdrop absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortlet-title"
            className="relative max-h-[100dvh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-bg shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg px-5 py-4 sm:px-7">
              <div>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-accent-alt">
                  Shortlet
                </p>
                <h2
                  id="shortlet-title"
                  className="mt-1 font-display text-2xl font-bold text-primary"
                >
                  Choose your stay
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={19} />
              </button>
            </header>
            <div className="p-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:p-7 sm:pb-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-body text-sm font-bold text-primary">
                    {propertyTitle}
                  </p>
                  <p className="mt-1 font-body text-xs text-muted">
                    {formatNaira(price)} per night
                  </p>
                </div>
                <p className="flex items-center gap-2 font-body text-xs text-muted">
                  <CalendarDays size={15} /> Minimum stay {minimum}{" "}
                  {minimum === 1 ? "night" : "nights"}
                </p>
              </div>
              <ShortletDateRangeCalendar
                startDate={startDate}
                endDate={endDate}
                unavailable={unavailable}
                onChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                  setError("");
                }}
              />
              <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-accent-alt" />
                  <div>
                    <p className="font-body text-sm font-bold text-primary">
                      Guests
                    </p>
                    <p className="font-body text-xs text-muted">
                      {maximumGuests
                        ? `This home sleeps up to ${maximumGuests}`
                        : "Including you"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuests((count) => Math.max(count - 1, 1))}
                    disabled={guests <= 1}
                    aria-label="One guest fewer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>
                  <span
                    className="w-6 text-center font-body text-base font-bold text-primary"
                    aria-live="polite"
                  >
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setGuests((count) => Math.min(count + 1, guestCeiling))
                    }
                    disabled={guests >= guestCeiling}
                    aria-label="One more guest"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-soft p-4">
                  <p className="font-body text-xs text-muted">Check-in</p>
                  <p className="mt-1 font-body text-sm font-bold text-primary">
                    {startDate || "Select a date"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-soft p-4">
                  <p className="font-body text-xs text-muted">Check-out</p>
                  <p className="mt-1 font-body text-sm font-bold text-primary">
                    {endDate || "Select a date"}
                  </p>
                </div>
              </div>
              {localProblem || error ? (
                <p className="mt-4 rounded-lg border border-red-500/30 px-4 py-3 font-body text-sm font-medium text-red-700">
                  {localProblem ?? error}
                </p>
              ) : null}
              {quote ? (
                <div className="mt-5 rounded-xl border border-border p-5">
                  <div className="flex justify-between font-body text-sm text-muted">
                    <span>
                      {formatNaira(quote.unitPrice)} × {quote.periods} nights
                    </span>
                    <span>{formatNaira(quote.unitPrice * quote.periods)}</span>
                  </div>
                  {(quote.cleaningFee ?? 0) > 0 ? (
                    <div className="mt-2 flex justify-between font-body text-sm text-muted">
                      <span>Cleaning fee</span>
                      <span>{formatNaira(quote.cleaningFee ?? 0)}</span>
                    </div>
                  ) : null}
                  <div className="mt-3 flex justify-between border-t border-border pt-3 font-body font-bold text-primary">
                    <span>Total</span>
                    <span>{formatNaira(quote.total)}</span>
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void submit()}
                disabled={
                  !quote ||
                  Boolean(quote.unavailableReason) ||
                  Boolean(localProblem) ||
                  isQuoting ||
                  isSubmitting
                }
                className="fixed inset-x-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary shadow-lg transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 sm:static sm:mt-6 sm:w-full sm:shadow-none"
              >
                {isQuoting || isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {isQuoting
                  ? "Checking price"
                  : isSubmitting
                    ? "Sending request"
                    : "Request to book"}
              </button>
            </div>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
