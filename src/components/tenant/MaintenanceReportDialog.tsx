"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useDialogFocus } from "@/lib/useDialogFocus";
import {
  raiseMaintenanceRequest,
  type MaintenanceCategory,
  type MaintenancePriority,
} from "@/lib/tenancy";

interface MaintenanceReportDialogProps {
  bookingId: number;
  onClose: () => void;
  onReported: () => void;
  open: boolean;
  propertyTitle: string;
}

const CATEGORY_OPTIONS: { label: string; value: MaintenanceCategory }[] = [
  { label: "Plumbing", value: "PLUMBING" },
  { label: "Electrical", value: "ELECTRICAL" },
  { label: "Appliance", value: "APPLIANCE" },
  { label: "Security", value: "SECURITY" },
  { label: "Structural", value: "STRUCTURAL" },
  { label: "Something else", value: "OTHER" },
];

const PRIORITY_OPTIONS: { label: string; value: MaintenancePriority }[] = [
  { label: "Low, whenever convenient", value: "LOW" },
  { label: "Normal", value: "NORMAL" },
  { label: "Urgent, affecting daily use", value: "URGENT" },
  { label: "Emergency, unsafe right now", value: "EMERGENCY" },
];

const TITLE_LIMIT = 120;

export default function MaintenanceReportDialog({
  bookingId,
  onClose,
  onReported,
  open,
  propertyTitle,
}: MaintenanceReportDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory>("PLUMBING");
  const [priority, setPriority] = useState<MaintenancePriority>("NORMAL");
  const [description, setDescription] = useState("");
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

    if (!title.trim()) {
      setFormError("Say briefly what is wrong.");
      return;
    }

    setIsSubmitting(true);

    const result = await raiseMaintenanceRequest(
      bookingId,
      title.trim(),
      category,
      priority,
      description.trim() || undefined,
    );

    setIsSubmitting(false);

    if (!result.data) {
      setFormError(result.message ?? "That report could not be sent.");
      return;
    }

    notify({
      title: "Report sent",
      description: `Your host has been told about ${propertyTitle}.`,
      variant: "success",
    });
    setTitle("");
    setDescription("");
    onReported();
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
            aria-label="Close report form"
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
            aria-label="Report a maintenance issue"
            className="relative w-full max-w-lg rounded-t-2xl bg-bg p-6 shadow-xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                  Report an issue
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

            <label className="mt-6 block">
              <span className="font-body text-sm font-bold text-primary">
                What is wrong?
              </span>
              <input
                value={title}
                maxLength={TITLE_LIMIT}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Kitchen tap is leaking"
                className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="font-body text-sm font-bold text-primary">
                  Category
                </span>
                <Select
                  ariaLabel="Category"
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as MaintenanceCategory)
                  }
                  options={CATEGORY_OPTIONS}
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary"
                />
              </label>
              <label>
                <span className="font-body text-sm font-bold text-primary">
                  How urgent?
                </span>
                <Select
                  ariaLabel="Priority"
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as MaintenancePriority)
                  }
                  options={PRIORITY_OPTIONS}
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="font-body text-sm font-bold text-primary">
                Any detail that helps
              </span>
              <textarea
                value={description}
                rows={3}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="It started this morning and drips constantly."
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
              Send report
            </button>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
