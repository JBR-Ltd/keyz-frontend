"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import { updateBookingStatus, type Booking } from "@/lib/bookings";
import { hasBegun, type PaymentAudience } from "@/lib/bookingPayments";
import { useDialogFocus } from "@/lib/useDialogFocus";

// === Types

interface CancelBookingDialogProps {
  actor: PaymentAudience;
  booking: Booking | null;
  now: number;
  onClose: () => void;
  onDone: (booking: Booking) => void;
}

type CancelKind = "decline" | "cancel" | "withdraw";

// === Constants

const OTHER_REASON = "Something else";

const REASONS: Record<PaymentAudience, Record<CancelKind, string[]>> = {
  host: {
    decline: [
      "The home is no longer available",
      "The move-in or dates do not work for me",
      "I am looking for a different kind of tenancy",
      OTHER_REASON,
    ],
    cancel: [
      "The home is no longer available",
      "The tenant and I agreed to cancel",
      OTHER_REASON,
    ],
    withdraw: [],
  },
  tenant: {
    decline: [],
    cancel: ["My plans changed", "I found another home", OTHER_REASON],
    withdraw: ["My plans changed", "I found another home", OTHER_REASON],
  },
};

const TITLES: Record<CancelKind, string> = {
  decline: "Decline request",
  cancel: "Cancel booking",
  withdraw: "Withdraw request",
};

// === Component

/**
 * Declining, cancelling or withdrawing, with a reason the other side is shown.
 *
 * The consequences are said before the button, not after: who is refunded, and
 * that a host cancelling an accepted booking counts against them. A paid booking
 * that has already begun cannot be cancelled here at all, because that would take
 * the money from a host whose home is occupied.
 */
export default function CancelBookingDialog({
  actor,
  booking,
  now,
  onClose,
  onDone,
}: CancelBookingDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const open = booking !== null;
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const { notify } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
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

  const kind: CancelKind =
    booking.status === "PENDING"
      ? actor === "host"
        ? "decline"
        : "withdraw"
      : "cancel";
  const paid = booking.paymentStatus === "HELD";
  const blocked = paid && hasBegun(booking, now);
  const reasons = REASONS[actor][kind];
  const otherParty =
    actor === "host"
      ? (booking.tenant?.name ?? "The tenant")
      : (booking.host?.name ?? "The host");

  const submit = async (): Promise<void> => {
    if (!reason) {
      setError("Choose a reason.");
      return;
    }

    if (reason === OTHER_REASON && !details.trim()) {
      setError("Tell them a little about why.");
      return;
    }

    const message =
      reason === OTHER_REASON
        ? details.trim()
        : details.trim()
          ? `${reason}. ${details.trim()}`
          : reason;

    setIsSaving(true);
    setError("");

    const result = await updateBookingStatus(booking.id, "CANCELLED", {
      reason: message.slice(0, 500),
    });

    setIsSaving(false);

    if (!result.data) {
      setError(result.message ?? "That did not go through. Try again.");
      return;
    }

    notify({
      title:
        kind === "decline"
          ? "Request declined"
          : kind === "withdraw"
            ? "Request withdrawn"
            : "Booking cancelled",
      description: paid
        ? actor === "tenant"
          ? "Your refund is on its way."
          : `${otherParty} is being refunded.`
        : `${otherParty} has been told.`,
      variant: "success",
    });
    onDone(result.data);
  };

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[140] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close"
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
            aria-labelledby="cancel-booking-title"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-bg shadow-2xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
              <h2
                id="cancel-booking-title"
                className="font-body text-sm font-bold text-primary"
              >
                {TITLES[kind]}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={19} />
              </button>
            </header>

            <div className="p-5 sm:p-7">
              <p className="font-display text-2xl font-bold text-primary">
                {booking.propertyTitle}
              </p>

              {blocked ? (
                <div className="mt-5 flex gap-3 rounded-xl border border-red-700/20 bg-red-700/5 p-4">
                  <AlertTriangle
                    size={20}
                    className="mt-0.5 shrink-0 text-red-700"
                  />
                  <p className="font-body text-sm leading-6 text-primary">
                    This has already begun and the payment is held, so it cannot
                    be cancelled here. If something is wrong, report a problem
                    from the payments page and Rello will look into it before
                    any money moves.
                  </p>
                </div>
              ) : (
                <>
                  <fieldset className="mt-5">
                    <legend className="font-body text-sm font-bold text-primary">
                      {actor === "host"
                        ? `Why? ${otherParty} will see this.`
                        : `Why? ${otherParty} will see this.`}
                    </legend>
                    <div className="mt-3 grid gap-2">
                      {reasons.map((item) => {
                        const active = reason === item;

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setReason(item);
                              setError("");
                            }}
                            aria-pressed={active}
                            className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 text-left font-body text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "border-primary bg-primary text-white" : "border-border text-primary hover:bg-surface-soft"}`}
                          >
                            {item}
                            {active ? <Check size={16} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <label className="mt-4 block">
                    <span className="flex justify-between gap-4 font-body text-sm font-bold text-primary">
                      <span>Anything to add</span>
                      <span className="font-normal text-muted">
                        {reason === OTHER_REASON ? "Required" : "Optional"}
                      </span>
                    </span>
                    <textarea
                      value={details}
                      maxLength={400}
                      onChange={(event) => setDetails(event.target.value)}
                      className="mt-2 min-h-24 w-full resize-none rounded-xl border border-border bg-bg p-4 font-body text-sm text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </label>

                  {paid ? (
                    <p className="mt-4 rounded-xl bg-surface-soft p-4 font-body text-sm leading-6 text-primary">
                      {actor === "tenant" ? "Your payment of " : `${otherParty}'s payment of `}
                      <span className="font-bold">
                        <PropertyPrice value={booking.totalPrice} />
                      </span>{" "}
                      is refunded in full to the card or account it came from.
                      {actor === "host"
                        ? " Nothing is paid out to you for this booking."
                        : ""}
                    </p>
                  ) : null}

                  {actor === "host" && kind === "cancel" ? (
                    <p className="mt-3 font-body text-xs leading-5 text-muted">
                      Cancelling a booking you accepted counts against your host
                      rating.
                    </p>
                  ) : null}

                  {error ? (
                    <p
                      role="alert"
                      className="mt-4 rounded-lg border border-red-500/30 px-4 py-3 font-body text-sm font-medium text-red-700"
                    >
                      {error}
                    </p>
                  ) : null}
                </>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {blocked ? "Close" : "Keep it"}
                </button>
                {blocked ? null : (
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={isSaving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-700 px-5 font-body text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    {TITLES[kind]}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
