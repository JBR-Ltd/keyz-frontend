"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flag, Loader2, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import { submitReport, type ReportReason, type ReportTarget } from "@/lib/marketplace";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface ReportDialogProps {
  onClose: () => void;
  open: boolean;
  target: ReportTarget;
}

const REASONS: { hint: string; label: string; value: ReportReason }[] = [
  { value: "FAKE_LISTING", label: "The home is not real or not theirs", hint: "Photos from elsewhere, or someone letting a place they do not control." },
  { value: "OFF_PLATFORM_PAYMENT", label: "Asked to pay outside Rello", hint: "A bank transfer, cash, or an inspection fee paid directly." },
  { value: "EXTRA_FEES", label: "Hidden or extra fees", hint: "Agency, legal or caution fees that were not on the listing." },
  { value: "WRONG_PRICE", label: "Price or details are wrong", hint: "The rent, size or location is not what was listed." },
  { value: "SCAM", label: "It looks like a scam", hint: "Pressure to pay fast, or a story that does not add up." },
  { value: "HARASSMENT", label: "Harassment or abuse", hint: "" },
  { value: "DISCRIMINATION", label: "Discrimination", hint: "Refused because of tribe, religion, gender or marital status." },
  { value: "UNSAFE", label: "Unsafe home", hint: "A danger to anyone living there." },
  { value: "OTHER", label: "Something else", hint: "" },
];

export default function ReportDialog({ onClose, open, target }: ReportDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const noun = target.type === "LISTING" ? "listing" : "person";

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

  const send = async (): Promise<void> => {
    if (!reason) {
      setError("Choose what is wrong.");
      return;
    }

    setIsSending(true);
    setError("");
    const result = await submitReport(target, reason, detail.trim());
    setIsSending(false);

    if (!result.data) {
      setError(result.message ?? "Your report could not be sent.");
      return;
    }

    notify({
      title: "Report sent",
      description: "Rello looks at every report and never tells anyone who made it.",
      variant: "success",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Close report"
            onClick={onClose}
            className="absolute inset-0 bg-primary/45"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Report this ${noun}`}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-bg p-6 shadow-xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">Safety</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-primary">Report this {noun}</h2>
                <p className="mt-2 font-body text-sm leading-6 text-muted">
                  Your name is never shown to them. If you have been asked to pay outside Rello, do not pay.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={18} />
              </button>
            </div>

            <fieldset className="mt-5 grid gap-2 overflow-y-auto">
              <legend className="sr-only">What is wrong</legend>
              {REASONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${reason === option.value ? "border-accent bg-accent/10" : "border-border hover:bg-primary/5"}`}
                >
                  <input
                    id={`report-reason-${option.value}`}
                    type="radio"
                    name="report-reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={() => setReason(option.value)}
                    className="mt-1 accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block font-body text-sm font-bold text-primary">{option.label}</span>
                    {option.hint ? <span className="block font-body text-xs leading-5 text-muted">{option.hint}</span> : null}
                  </span>
                </label>
              ))}
            </fieldset>

            <label htmlFor="report-detail" className="mt-4 font-body text-sm font-bold text-primary">
              What happened (optional)
            </label>
            <textarea
              id="report-detail"
              rows={3}
              maxLength={1000}
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              className="mt-2 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
            />

            {error ? <p className="mt-3 font-body text-sm text-red-700">{error}</p> : null}

            <button
              type="button"
              onClick={() => void send()}
              disabled={isSending}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              {isSending ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} aria-hidden="true" />}
              Send report
            </button>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
