"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import {
  getPropertyAvailability,
  overlapsUnavailable,
  type UnavailableRange,
} from "@/lib/availability";
import {
  createBooking,
  getBookingQuote,
  type BookingQuote,
} from "@/lib/bookings";
import type { RentalMode } from "@/lib/hostListings";
import { useDialogFocus } from "@/lib/useDialogFocus";

// === Types

interface BookingRequestDialogProps {
  minimumNights?: number | null;
  onClose: () => void;
  open: boolean;
  price: number;
  propertyId: string;
  propertyTitle: string;
  rentalMode: RentalMode;
}

// === Constants

const MODE_COPY: Record<RentalMode, { hint: string; unit: string }> = {
  ANNUAL: {
    hint: "This home is let by the year. Rent is paid up front and held in escrow until you move in.",
    unit: "year",
  },
  MONTHLY: {
    hint: "This home is let by the month. Rent is paid up front and held in escrow until you move in.",
    unit: "month",
  },
  SHORT_STAY: {
    hint: "Pay for the whole stay up front. It is held in escrow until you check in.",
    unit: "night",
  },
};

// === Helpers

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatNaira(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

/** The soonest a stay may start. Today is not offered, to leave the host a day. */
function earliestStart(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return toIsoDate(tomorrow);
}

// === Component

export default function BookingRequestDialog({
  minimumNights,
  onClose,
  open,
  price,
  propertyId,
  propertyTitle,
  rentalMode,
}: BookingRequestDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const [startDate, setStartDate] = useState(earliestStart);
  const [endDate, setEndDate] = useState("");
  const [unavailable, setUnavailable] = useState<UnavailableRange[]>([]);
  const [quotedFor, setQuotedFor] = useState<{
    key: string;
    value: BookingQuote | null;
  } | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericId = Number(propertyId);
  const minimum = rentalMode === "SHORT_STAY" ? Math.max(minimumNights ?? 1, 1) : 1;
  const copy = MODE_COPY[rentalMode];

  useEffect(() => {
    if (!open || !Number.isFinite(numericId)) {
      return;
    }

    let active = true;

    void getPropertyAvailability(numericId).then((result) => {
      if (active) {
        setUnavailable(result.data);
      }
    });

    return () => {
      active = false;
    };
  }, [numericId, open]);

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

  /**
   * The obvious problems, checked here so the calendar reacts as dates are picked.
   * The server has the final say and its answer arrives with the quote.
   */
  const localProblem = useMemo((): string | null => {
    if (!startDate || !endDate) {
      return null;
    }

    if (toDate(endDate) <= toDate(startDate)) {
      return "The end date has to be after the start date.";
    }

    if (overlapsUnavailable(unavailable, startDate, endDate)) {
      return "Those dates are already taken. Try different ones.";
    }

    return null;
  }, [endDate, startDate, unavailable]);

  const dateKey = `${startDate}:${endDate}`;

  // The price and the remaining rules come from the server, which is the same code
  // that charges for the stay
  useEffect(() => {
    if (!startDate || !endDate || localProblem || !Number.isFinite(numericId)) {
      return;
    }

    let active = true;

    void getBookingQuote(numericId, startDate, endDate).then((result) => {
      if (!active) {
        return;
      }

      setQuotedFor({ key: `${startDate}:${endDate}`, value: result.data });
    });

    return () => {
      active = false;
    };
  }, [endDate, localProblem, numericId, startDate]);

  // A quote for other dates is not shown at all, rather than shown and wrong
  const quote = quotedFor?.key === dateKey ? quotedFor.value : null;
  // Derived rather than stored: we are waiting exactly while the quote for the
  // chosen dates has not arrived
  const isQuoting =
    Boolean(startDate && endDate) &&
    localProblem === null &&
    quotedFor?.key !== dateKey;
  const problem = localProblem ?? quote?.unavailableReason ?? null;
  const total = problem === null ? (quote?.total ?? null) : null;

  const submit = async (): Promise<void> => {
    setFormError("");

    if (!startDate || !endDate) {
      setFormError("Choose both dates.");
      return;
    }

    if (problem) {
      setFormError(problem);
      return;
    }

    setIsSubmitting(true);

    const result = await createBooking(numericId, startDate, endDate);

    setIsSubmitting(false);

    if (!result.data) {
      setFormError(result.message ?? "That booking could not be made.");
      return;
    }

    notify({
      title: "Request sent",
      description: `${propertyTitle} is waiting on the host to confirm.`,
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
            aria-label="Close booking request"
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
            aria-label={`Request ${propertyTitle}`}
            className="relative w-full max-w-lg rounded-t-2xl bg-bg p-6 shadow-xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                  Request to book
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
              {copy.hint}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="font-body text-sm font-bold text-primary">
                  {rentalMode === "SHORT_STAY" ? "Check in" : "Start date"}
                </span>
                <input
                  type="date"
                  value={startDate}
                  min={earliestStart()}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <label>
                <span className="font-body text-sm font-bold text-primary">
                  {rentalMode === "SHORT_STAY" ? "Check out" : "End date"}
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || earliestStart()}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>
            </div>

            {rentalMode === "SHORT_STAY" && minimum > 1 ? (
              <p className="mt-3 flex items-center gap-2 font-body text-xs text-muted">
                <CalendarDays size={14} />
                Minimum stay {minimum} nights
              </p>
            ) : null}

            {problem ? (
              <p className="mt-4 rounded-lg border border-red-500/30 px-4 py-3 font-body text-sm font-medium text-red-700">
                {problem}
              </p>
            ) : null}

            {total !== null ? (
              <div className="mt-5 rounded-lg bg-surface-soft p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-body text-sm text-muted">
                    {formatNaira(quote?.unitPrice ?? price)} ×{" "}
                    {quote?.periods ?? 0} {copy.unit}
                    {quote?.periods === 1 ? "" : "s"}
                  </span>
                </div>
                {(quote?.cleaningFee ?? 0) > 0 ? (
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <span className="font-body text-sm text-muted">
                      Cleaning fee
                    </span>
                    <span className="font-body text-sm text-primary">
                      {formatNaira(quote?.cleaningFee ?? 0)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                  <span className="font-body text-sm font-bold text-primary">
                    Total
                  </span>
                  <span className="font-display text-xl font-bold text-primary">
                    {formatNaira(total)}
                  </span>
                </div>
                <p className="mt-2 font-body text-xs text-muted">
                  Confirmed by the host before anything is charged.
                </p>
              </div>
            ) : null}

            {formError ? (
              <p className="mt-4 rounded-lg border border-red-500/30 px-4 py-3 font-body text-sm font-medium text-red-700">
                {formError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={isSubmitting || isQuoting || problem !== null || total === null}
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
