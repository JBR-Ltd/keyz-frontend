"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, Scale, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import type { Booking } from "@/lib/bookings";
import { claimDeposit } from "@/lib/escrow";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface DepositClaimDialogProps {
  booking: Booking | null;
  onClose: () => void;
  onClaimed: () => void;
}

/**
 * A host asking to keep part of a deposit for damage.
 *
 * It states plainly that Rello decides, because the point of holding the deposit is
 * that neither side can simply take it.
 */
export default function DepositClaimDialog({
  booking,
  onClose,
  onClaimed,
}: DepositClaimDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const open = booking !== null;
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const { notify } = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
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

  const held = booking.depositAmount ?? 0;

  const submit = async (): Promise<void> => {
    const claimed = Number(amount);

    if (!Number.isFinite(claimed) || claimed <= 0 || claimed > held) {
      setError(`Claim between ₦1 and the ₦${held.toLocaleString("en-NG")} held.`);
      return;
    }

    if (note.trim().length < 10) {
      setError("Say what the damage is. The tenant is shown this.");
      return;
    }

    setIsSaving(true);
    setError("");

    const result = await claimDeposit(booking.id, claimed, note);

    setIsSaving(false);

    if (!result.data) {
      setError(result.message ?? "That claim could not be recorded.");
      return;
    }

    notify({
      title: "Claim recorded",
      description: "Rello will decide and both of you will hear the outcome.",
      variant: "success",
    });
    onClaimed();
  };

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-6">
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
            aria-labelledby="deposit-claim-title"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-bg shadow-2xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
              <p className="font-body text-sm font-bold text-primary">
                Claim against the deposit
              </p>
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
              <h2
                id="deposit-claim-title"
                className="font-display text-2xl font-bold text-primary"
              >
                {booking.propertyTitle}
              </h2>
              <p className="mt-2 font-body text-sm text-muted">
                Deposit held:{" "}
                <span className="font-bold text-primary">
                  <PropertyPrice value={held} />
                </span>
              </p>

              <label className="mt-5 block">
                <span className="font-body text-sm font-bold text-primary">
                  How much are you claiming
                </span>
                <span className="mt-2 flex min-h-12 items-center rounded-lg border border-border bg-bg focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
                  <span className="border-r border-border px-4 font-body text-base font-bold text-primary">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={held}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="min-h-12 min-w-0 flex-1 bg-bg px-4 font-body text-base text-primary outline-none"
                    placeholder="0"
                  />
                </span>
              </label>

              <label className="mt-4 block">
                <span className="font-body text-sm font-bold text-primary">
                  What was damaged
                </span>
                <textarea
                  value={note}
                  maxLength={500}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Describe the damage and what it costs to put right. Keep receipts and photos: Rello will ask for them."
                  className="mt-2 min-h-28 w-full resize-none rounded-xl border border-border bg-bg p-4 font-body text-sm text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>

              <p className="mt-4 flex gap-3 rounded-xl bg-surface-soft p-4 font-body text-sm leading-6 text-muted">
                <Scale size={20} className="mt-0.5 shrink-0 text-accent-alt" />
                Rello decides this, not you and not the tenant. The deposit stays
                held until then, and fair wear and tear is not damage.
              </p>

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
                onClick={() => void submit()}
                disabled={isSaving}
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                Send claim to Rello
              </button>
            </div>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
