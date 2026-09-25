"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Loader2, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import MoveInDateCalendar from "@/components/bookings/MoveInDateCalendar";
import PropertyPrice from "@/components/property/PropertyPrice";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import {
  recordMoveInDate,
  updateBookingStatus,
  type Booking,
  type MoveInPreference,
} from "@/lib/bookings";
import { formatDay, shiftDays, todayIso } from "@/lib/bookingPayments";
import { useDialogFocus } from "@/lib/useDialogFocus";

// === Types

export type AcceptDialogMode = "accept" | "move-in";

interface AcceptBookingDialogProps {
  booking: Booking | null;
  mode: AcceptDialogMode;
  onClose: () => void;
  onSaved: (booking: Booking) => void;
}

// === Constants

/** Far enough back to record a tenant who was already living in the home. */
const EARLIEST_MOVE_IN_DAYS_AGO = 90;

/** The server refuses anything further ahead. */
const LATEST_MOVE_IN_DAYS_AHEAD = 365;

const PREFERENCE_LABELS: Record<MoveInPreference, string> = {
  ASAP: "As soon as possible",
  WITHIN_30_DAYS: "Within 30 days",
  EXACT_DATE: "A set date",
  FLEXIBLE: "Flexible",
};

// === Helpers

function initialMoveIn(booking: Booking | null): string {
  if (!booking) {
    return "";
  }

  if (booking.tenancyStartDate) {
    return booking.tenancyStartDate;
  }

  return booking.moveInPreference === "EXACT_DATE" &&
    booking.preferredMoveInDate
    ? booking.preferredMoveInDate
    : "";
}

// === Component

/**
 * Accepting a request, or changing an accepted tenancy's move-in.
 *
 * A rental cannot be accepted without a move-in: the tenant's payment is released
 * to the host a few days after it, so an open-ended acceptance would leave the
 * money with nothing to release from.
 */
export default function AcceptBookingDialog({
  booking,
  mode,
  onClose,
  onSaved,
}: AcceptBookingDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const open = booking !== null;
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const { notify } = useToast();
  const [moveInDate, setMoveInDate] = useState(() => initialMoveIn(booking));
  const [bounds] = useState(() => {
    const today = todayIso();

    return {
      min: shiftDays(today, -EARLIEST_MOVE_IN_DAYS_AGO),
      max: shiftDays(today, LATEST_MOVE_IN_DAYS_AHEAD),
    };
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  if (!booking) {
    return null;
  }

  const isRental = booking.bookingKind !== "SHORT_STAY";
  const tenantName = booking.tenant?.name ?? "The tenant";

  const save = async (): Promise<void> => {
    if (isRental && !moveInDate) {
      setError("Choose the move-in date you are agreeing to.");
      return;
    }

    setIsSaving(true);
    setError("");

    const result =
      mode === "move-in"
        ? await recordMoveInDate(booking.id, moveInDate)
        : await updateBookingStatus(
            booking.id,
            "CONFIRMED",
            isRental ? { moveInDate } : {},
          );

    setIsSaving(false);

    if (!result.data) {
      setError(result.message ?? "That did not save. Try again.");
      return;
    }

    notify({
      title: mode === "move-in" ? "Move-in date saved" : "Request accepted",
      description:
        mode === "move-in"
          ? `${tenantName} has been emailed the new date.`
          : `${tenantName} has been asked to pay to secure it.`,
      variant: "success",
    });
    onSaved(result.data);
  };

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[140] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close"
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
            aria-labelledby="accept-booking-title"
            className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-bg shadow-2xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={19} />
              </button>
              <p className="font-body text-sm font-bold text-primary">
                {mode === "move-in" ? "Change move-in date" : "Accept request"}
              </p>
              <span className="w-10" />
            </header>

            <div className="p-5 sm:p-7">
              <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-accent-alt">
                {isRental ? "Long-term rental" : "Shortlet"}
              </p>
              <h2
                id="accept-booking-title"
                className="mt-2 font-display text-3xl font-bold text-primary"
              >
                {booking.propertyTitle}
              </h2>

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-border p-4">
                <UserRound size={19} className="text-accent-alt" />
                <span className="min-w-0">
                  <span className="block truncate font-body text-sm font-bold text-primary">
                    {tenantName}
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-muted">
                    {booking.tenant?.identityVerified
                      ? "Identity verified"
                      : "Identity not verified yet"}
                  </span>
                </span>
              </div>

              {booking.tenantMessage && mode === "accept" ? (
                <blockquote className="mt-4 rounded-xl bg-surface-soft p-4 font-body text-sm leading-6 text-primary">
                  &ldquo;{booking.tenantMessage}&rdquo;
                </blockquote>
              ) : null}

              {isRental ? (
                <section className="mt-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-body text-base font-bold text-primary">
                      Move-in date
                    </h3>
                    {booking.moveInPreference ? (
                      <p className="font-body text-xs text-muted">
                        They asked for:{" "}
                        {PREFERENCE_LABELS[booking.moveInPreference]}
                        {booking.preferredMoveInDate
                          ? `, ${formatDay(booking.preferredMoveInDate)}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <MoveInDateCalendar
                      value={moveInDate}
                      onChange={(value) => {
                        setMoveInDate(value);
                        setError("");
                      }}
                      minDate={bounds.min}
                      maxDate={bounds.max}
                      suggestedDate={booking.preferredMoveInDate}
                    />
                  </div>
                  <p className="mt-3 flex items-center gap-2 font-body text-sm text-primary">
                    <CalendarDays size={16} className="text-accent-alt" />
                    {moveInDate
                      ? `Moving in ${formatDay(moveInDate)}`
                      : "No date chosen yet"}
                  </p>
                </section>
              ) : (
                <dl className="mt-6 grid gap-3 rounded-xl bg-surface-soft p-5 font-body text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted">Dates</dt>
                    <dd className="mt-1 font-bold text-primary">
                      {booking.startDate && booking.endDate
                        ? `${formatDay(booking.startDate)} to ${formatDay(booking.endDate)}`
                        : "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Guests</dt>
                    <dd className="mt-1 font-bold text-primary">
                      {booking.guestCount ?? 1}
                    </dd>
                  </div>
                </dl>
              )}

              <div className="mt-6 flex gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-accent-alt"
                />
                {mode === "move-in" ? (
                  <p className="font-body text-sm leading-6 text-muted">
                    {tenantName} is emailed the new date. Your payout counts
                    from the move-in, so a later date moves it later.
                  </p>
                ) : (
                  <p className="font-body text-sm leading-6 text-muted">
                    Accepting asks {tenantName} to pay{" "}
                    <span className="font-bold text-primary">
                      <PropertyPrice value={booking.totalPrice} />
                    </span>{" "}
                    to secure it. Rello holds the money and pays you a few days
                    after move-in, less the Rello fee. If they do not pay in
                    time, the booking is released.
                    {isRental
                      ? " Any other requests on this home are closed."
                      : ""}
                  </p>
                )}
              </div>

              {error ? (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-red-500/30 px-4 py-3 font-body text-sm font-medium text-red-700"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void save()}
                disabled={isSaving}
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {mode === "move-in"
                  ? "Save move-in date"
                  : "Accept and ask for payment"}
              </button>
            </div>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
