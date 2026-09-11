"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useDialogFocus } from "@/lib/useDialogFocus";
import {
  getTenancyDocuments,
  uploadTenancyDocument,
  type TenancyDocument,
  type TenancyDocumentType,
} from "@/lib/tenancy";

interface TenancyDocumentsDialogProps {
  bookingId: number;
  onClose: () => void;
  open: boolean;
  propertyTitle: string;
}

const TYPE_LABELS: Record<TenancyDocumentType, string> = {
  LEASE_AGREEMENT: "Tenancy agreement",
  RECEIPT: "Receipt",
  INVENTORY_REPORT: "Inventory",
  MOVE_IN_REPORT: "Move in report",
  MOVE_OUT_REPORT: "Move out report",
  OTHER: "Document",
};

const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as TenancyDocumentType[]).map(
  (value) => ({ label: TYPE_LABELS[value], value }),
);

export default function TenancyDocumentsDialog({
  bookingId,
  onClose,
  open,
  propertyTitle,
}: TenancyDocumentsDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<TenancyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [type, setType] = useState<TenancyDocumentType>("LEASE_AGREEMENT");
  const [formError, setFormError] = useState("");

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

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    void getTenancyDocuments(bookingId).then((result) => {
      if (!active) {
        return;
      }

      setDocuments(result.data);
      setFormError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [bookingId, open]);

  const upload = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return;
    }

    setFormError("");
    setIsUploading(true);
    const result = await uploadTenancyDocument(
      bookingId,
      file,
      file.name,
      type,
    );
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (result.data === null) {
      setFormError(result.message ?? "That document could not be added.");
      return;
    }

    const added = result.data;

    setDocuments((current) => [added, ...current]);
    notify({
      title: "Document added",
      description: "Your tenant can read it now.",
      variant: "success",
    });
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
            aria-label="Close documents"
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
            aria-label="Tenancy documents"
            className="relative w-full max-w-lg rounded-t-2xl bg-bg p-6 shadow-xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                  Paperwork
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

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label>
                <span className="font-body text-sm font-bold text-primary">
                  What is it?
                </span>
                <Select
                  ariaLabel="Document type"
                  value={type}
                  onValueChange={(value) =>
                    setType(value as TenancyDocumentType)
                  }
                  options={TYPE_OPTIONS}
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary"
                />
              </label>

              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus-within:ring-2 focus-within:ring-accent">
                {isUploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Upload size={15} aria-hidden="true" />
                )}
                Add a file
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  disabled={isUploading}
                  onChange={(event) => void upload(event.target.files?.[0])}
                  className="sr-only"
                />
              </label>
            </div>

            {formError ? (
              <p className="mt-4 font-body text-sm text-red-700">{formError}</p>
            ) : null}

            <div className="mt-6 max-h-64 overflow-y-auto">
              {isLoading ? (
                <div
                  className="grid gap-3 py-2"
                  role="status"
                  aria-label="Loading tenancy documents"
                >
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={`loading-document-${index + 1}`}
                      className="flex items-center gap-3 rounded-lg bg-surface-soft px-4 py-3"
                      aria-hidden="true"
                    >
                      <Skeleton className="h-9 w-9 shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="mt-2 h-3 w-2/5" />
                      </div>
                    </div>
                  ))}
                  <span className="sr-only">Loading tenancy documents</span>
                </div>
              ) : documents.length === 0 ? (
                <p className="rounded-lg bg-surface-soft p-6 text-center font-body text-sm text-muted">
                  Nothing here yet. The signed agreement is the one document
                  every tenancy should carry.
                </p>
              ) : (
                <ul className="grid gap-3">
                  {documents.map((document) => (
                    <li
                      key={document.id}
                      className="flex items-center gap-3 rounded-lg bg-surface-soft px-4 py-3"
                    >
                      <FileText
                        size={16}
                        aria-hidden="true"
                        className="shrink-0 text-accent-alt"
                      />
                      <a
                        href={document.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate font-body text-sm font-medium text-primary transition-colors hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {document.name}
                      </a>
                      <span className="shrink-0 font-body text-xs text-muted">
                        {TYPE_LABELS[document.type]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
