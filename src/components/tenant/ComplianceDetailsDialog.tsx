"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import { saveComplianceProfile } from "@/lib/compliance";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface ComplianceDetailsDialogProps {
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}

const INPUT_CLASS_NAME =
  "mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30";

/**
 * Asked for once, before a payment large enough that the law expects us to know who
 * is making it. Nigerian money laundering rules put this on any property business,
 * so it is explained rather than sprung on people mid-checkout.
 */
export default function ComplianceDetailsDialog({
  onClose,
  onSaved,
  open,
}: ComplianceDetailsDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const { notify } = useToast();
  const [residentialAddress, setResidentialAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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

  if (!open) {
    return null;
  }

  const save = async (): Promise<void> => {
    if (!residentialAddress.trim() || !occupation.trim() || !sourceOfFunds.trim()) {
      setError("Fill in all three, then you can carry on to payment.");
      return;
    }

    setIsSaving(true);
    setError("");

    const result = await saveComplianceProfile({
      residentialAddress: residentialAddress.trim(),
      occupation: occupation.trim(),
      sourceOfFunds: sourceOfFunds.trim(),
      dateOfBirth: dateOfBirth || undefined,
    });

    setIsSaving(false);

    if (!result.data) {
      setError(result.message ?? "Those details could not be saved.");
      return;
    }

    notify({ title: "Details saved", variant: "success" });
    onSaved();
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
            aria-labelledby="compliance-title"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-bg shadow-2xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
              <p className="font-body text-sm font-bold text-primary">
                A few details before you pay
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
                id="compliance-title"
                className="font-display text-2xl font-bold text-primary"
              >
                Who we are renting to
              </h2>
              <p className="mt-3 flex gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 font-body text-sm leading-6 text-muted">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-accent-alt"
                />
                Nigerian law asks a property business to know who it deals with
                on payments this size. We keep this on file, we do not show it to
                the host, and you only give it once.
              </p>

              <label className="mt-5 block">
                <span className="font-body text-sm font-bold text-primary">
                  Residential address
                </span>
                <input
                  value={residentialAddress}
                  onChange={(event) => setResidentialAddress(event.target.value)}
                  maxLength={255}
                  className={INPUT_CLASS_NAME}
                  placeholder="12 Association Road, Ikeja, Lagos"
                />
              </label>

              <label className="mt-4 block">
                <span className="font-body text-sm font-bold text-primary">
                  What you do
                </span>
                <input
                  value={occupation}
                  onChange={(event) => setOccupation(event.target.value)}
                  maxLength={120}
                  className={INPUT_CLASS_NAME}
                  placeholder="Software engineer"
                />
              </label>

              <label className="mt-4 block">
                <span className="font-body text-sm font-bold text-primary">
                  Where the money is coming from
                </span>
                <input
                  value={sourceOfFunds}
                  onChange={(event) => setSourceOfFunds(event.target.value)}
                  maxLength={120}
                  className={INPUT_CLASS_NAME}
                  placeholder="Salary, business income, savings"
                />
              </label>

              <label className="mt-4 block">
                <span className="font-body text-sm font-bold text-primary">
                  Date of birth (optional)
                </span>
                <input
                  id="compliance-date-of-birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  className={INPUT_CLASS_NAME}
                />
              </label>

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
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                Save and continue
              </button>
            </div>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
