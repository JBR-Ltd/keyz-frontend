"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Flag, Loader2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import {
  submitReport,
  type ReportReason,
  type ReportTarget,
} from "@/lib/marketplace";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface ReportDialogProps {
  onClose: () => void;
  open: boolean;
  target: ReportTarget;
}

const REASONS: { hint: string; label: string; value: ReportReason }[] = [
  {
    value: "FAKE_LISTING",
    label: "The home is not real or not theirs",
    hint: "Photos from elsewhere, or someone letting a place they do not control.",
  },
  {
    value: "OFF_PLATFORM_PAYMENT",
    label: "Asked to pay outside Rello",
    hint: "A bank transfer, cash, or an inspection fee paid directly.",
  },
  {
    value: "EXTRA_FEES",
    label: "Hidden or extra fees",
    hint: "Agency, legal or caution fees that were not on the listing.",
  },
  {
    value: "WRONG_PRICE",
    label: "Price or details are wrong",
    hint: "The rent, size or location is not what was listed.",
  },
  {
    value: "SCAM",
    label: "It looks like a scam",
    hint: "Pressure to pay fast, or a story that does not add up.",
  },
  { value: "HARASSMENT", label: "Harassment or abuse", hint: "" },
  {
    value: "DISCRIMINATION",
    label: "Discrimination",
    hint: "Refused because of tribe, religion, gender or marital status.",
  },
  {
    value: "UNSAFE",
    label: "Unsafe home",
    hint: "A danger to anyone living there.",
  },
  { value: "OTHER", label: "Something else", hint: "" },
];

type ReportStep = "reason" | "details";

export default function ReportDialog({
  onClose,
  open,
  target,
}: ReportDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const detailRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<ReportStep>("reason");
  const noun = target.type === "LISTING" ? "listing" : "person";
  const selectedReason = REASONS.find((option) => option.value === reason);

  const close = useCallback((): void => {
    if (isSending) {
      return;
    }

    setReason(null);
    setDetail("");
    setError("");
    setStep("reason");
    onClose();
  }, [isSending, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [close, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (step === "details") {
        detailRef.current?.focus();
        return;
      }

      const selectedInput = dialogRef.current?.querySelector<HTMLInputElement>(
        'input[name="report-reason"]:checked',
      );
      const firstInput = dialogRef.current?.querySelector<HTMLInputElement>(
        'input[name="report-reason"]',
      );
      (selectedInput ?? firstInput)?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [dialogRef, open, step]);

  if (!open) {
    return null;
  }

  const send = async (): Promise<void> => {
    if (!reason) {
      setStep("reason");
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
      description:
        "Rello looks at every report and never tells anyone who made it.",
      variant: "success",
    });
    close();
  };

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close report"
            onClick={close}
            disabled={isSending}
            className="modal-backdrop absolute inset-0 disabled:cursor-wait"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Report this ${noun}`}
            className="relative flex max-h-[calc(100dvh-0.75rem)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-bg shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6 sm:py-6">
              <div>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                  Safety
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-primary">
                  {step === "reason"
                    ? `Report this ${noun}`
                    : "Tell us what happened"}
                </h2>
                <p className="mt-2 font-body text-sm leading-6 text-muted">
                  {step === "reason"
                    ? "Your name is never shown to them. If you have been asked to pay outside Rello, do not pay."
                    : "Details help our safety team review the report. They are never shown to the person you report."}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={isSending}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <AnimatePresence mode="wait" initial={false}>
                {step === "reason" ? (
                  <motion.fieldset
                    key="reason"
                    className="grid gap-2"
                    initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                    animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <legend className="sr-only">What is wrong</legend>
                    {REASONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors ${reason === option.value ? "border-accent bg-accent/10" : "border-border hover:bg-primary/5"}`}
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
                          <span className="block font-body text-sm font-bold text-primary">
                            {option.label}
                          </span>
                          {option.hint ? (
                            <span className="mt-0.5 block font-body text-xs leading-5 text-muted">
                              {option.hint}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </motion.fieldset>
                ) : (
                  <motion.div
                    key="details"
                    initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                    animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: 12 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
                      <p className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                        Selected reason
                      </p>
                      <p className="mt-1.5 font-body text-sm font-bold text-primary">
                        {selectedReason?.label}
                      </p>
                    </div>

                    <label
                      htmlFor="report-detail"
                      className="mt-6 block font-body text-sm font-bold text-primary"
                    >
                      What happened?{" "}
                      <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <textarea
                      ref={detailRef}
                      id="report-detail"
                      rows={6}
                      maxLength={1000}
                      value={detail}
                      onChange={(event) => setDetail(event.target.value)}
                      placeholder="Share any details that could help our safety team review this report."
                      className="mt-2 min-h-36 w-full resize-y rounded-xl border border-border bg-bg px-4 py-3 font-body text-sm leading-6 text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                    <p className="mt-2 text-right font-body text-xs text-muted">
                      {detail.length.toLocaleString("en-NG")} / 1,000
                    </p>

                    {error ? (
                      <p
                        role="alert"
                        className="mt-4 rounded-lg border border-red-500/30 px-4 py-3 font-body text-sm font-medium text-red-700"
                      >
                        {error}
                      </p>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="shrink-0 border-t border-border bg-bg px-5 py-4 sm:px-6">
              {step === "reason" ? (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep("details");
                  }}
                  disabled={!reason}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Continue
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep("reason");
                    }}
                    disabled={isSending}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={isSending}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Flag size={15} aria-hidden="true" />
                    )}
                    Send report
                  </button>
                </div>
              )}
            </footer>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
