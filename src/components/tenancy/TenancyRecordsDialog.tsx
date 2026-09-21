"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import AgreementPanel from "@/components/tenancy/AgreementPanel";
import InspectionsPanel from "@/components/tenancy/InspectionsPanel";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface TenancyRecordsDialogProps {
  bookingId: number | null;
  onClose: () => void;
  propertyTitle: string;
  /** Shortlets have condition reports but no tenancy agreement. */
  showAgreement: boolean;
  viewer: "tenant" | "host";
}

type RecordsTab = "agreement" | "reports";

export default function TenancyRecordsDialog({
  bookingId,
  onClose,
  propertyTitle,
  showAgreement,
  viewer,
}: TenancyRecordsDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const open = bookingId !== null;
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const [tab, setTab] = useState<RecordsTab>(showAgreement ? "agreement" : "reports");

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

  if (bookingId === null) {
    return null;
  }

  const activeTab = showAgreement ? tab : "reports";

  return (
    <AnimatePresence>
      <OverlayPortal>
        <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Close agreement and reports"
            onClick={onClose}
            className="modal-backdrop absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Agreement and condition reports"
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl bg-bg shadow-xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-6 pb-4">
              <div className="min-w-0">
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                  Tenancy records
                </p>
                <h2 className="mt-2 truncate font-display text-2xl font-bold text-primary">{propertyTitle}</h2>
                {showAgreement ? (
                  <div className="mt-4 flex gap-2" role="tablist" aria-label="Records">
                    {(
                      [
                        ["agreement", "Tenancy agreement"],
                        ["reports", "Condition reports"],
                      ] as [RecordsTab, string][]
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === id}
                        onClick={() => setTab(id)}
                        className={`min-h-9 rounded-full px-4 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          activeTab === id ? "bg-primary text-white" : "text-primary hover:bg-primary/5"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
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

            <div className="overflow-y-auto p-6" role="tabpanel">
              {activeTab === "agreement" ? (
                <AgreementPanel bookingId={bookingId} viewer={viewer} />
              ) : (
                <InspectionsPanel bookingId={bookingId} viewer={viewer} />
              )}
            </div>
          </motion.div>
        </div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
