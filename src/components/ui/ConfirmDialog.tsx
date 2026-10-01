// src/components/ui/ConfirmDialog.tsx
//
// Styled confirmation dialog. Replaces window.confirm everywhere.
// Matches the rest of the design system: OverlayPortal for stacking,
// accent for primary CTAs, red for destructive actions.

"use client";

import type { ReactElement, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useDialogFocus } from "@/lib/useDialogFocus";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement | null {
  const dialogRef = useDialogFocus<HTMLDivElement>(open);

  if (!open) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400 disabled:opacity-60"
      : "bg-accent text-primary hover:bg-primary hover:text-white focus-visible:ring-accent disabled:opacity-60";

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center px-4 py-6 modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isConfirming) onCancel();
        }}
      >
        <div
          ref={dialogRef}
          className="w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl"
        >
          <h2
            id="confirm-dialog-title"
            className="font-display text-xl font-bold text-primary"
          >
            {title}
          </h2>
          <div className="mt-3 font-body text-sm leading-6 text-muted">
            {description}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isConfirming}
              className="min-h-11 rounded-full border border-border bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 ${confirmClasses}`}
            >
              {isConfirming ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Working…
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
