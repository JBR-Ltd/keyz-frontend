"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { ReactElement, useEffect } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface AccountActionModalProps {
  isOpen: boolean;
  mode: "account";
  onCancel: () => void;
  onAction: (action: "deactivate" | "delete") => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  mode: "confirm";
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

type ConfirmActionModalProps = AccountActionModalProps | ConfirmModalProps;

export default function ConfirmActionModal({
  ...props
}: ConfirmActionModalProps): ReactElement {
  const reduceMotion = useReducedMotion();
  const isAccountMode = props.mode === "account";
  const dialogRef = useDialogFocus<HTMLDivElement>(props.isOpen);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props]);

  return (
    <OverlayPortal>
      <AnimatePresence>
        {props.isOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-action-title"
          >
            <motion.div
              className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-red-700 bg-[var(--color-bg)] shadow-xl"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between border-b border-red-700 bg-red-700 p-5 text-white">
                <AlertTriangle size={24} />
                <button
                  type="button"
                  onClick={props.onCancel}
                  aria-label="Close confirmation"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 transition-all duration-200 ease-in-out hover:bg-white hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X size={19} />
                </button>
              </div>
              <div className="p-6 sm:p-8">
                <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-red-700">
                  Confirm action
                </p>
                <h2
                  id="confirm-action-title"
                  className={`mt-4 font-display text-4xl font-bold leading-none ${
                    isAccountMode ? "text-red-700" : "text-primary"
                  }`}
                >
                  {isAccountMode ? "Danger Zone" : props.title}
                </h2>
                <p className="mt-5 font-body leading-7 text-muted">
                  {isAccountMode
                    ? "Choose whether to temporarily hide your account or permanently remove its data. Each option requires one more confirmation."
                    : props.description}
                </p>
                {isAccountMode ? (
                  <>
                    <div className="mt-8 grid gap-4">
                      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-5">
                        <h3 className="font-body text-base font-bold text-red-700">
                          Deactivate Account
                        </h3>
                        <p className="mt-2 font-body text-sm leading-6 text-muted">
                          Hide your profile until you sign in again.
                        </p>
                        <button
                          type="button"
                          onClick={() => props.onAction("deactivate")}
                          className="mt-4 min-h-11 rounded-full border border-red-700 px-5 py-2.5 font-body text-sm font-medium text-red-700 transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-red-700 hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          Deactivate account
                        </button>
                      </div>

                      <div className="rounded-lg bg-red-700 p-5 text-white">
                        <h3 className="font-body text-base font-bold">
                          Delete Account
                        </h3>
                        <p className="mt-2 font-body text-sm leading-6 text-white/75">
                          Permanently remove your profile and account data.
                        </p>
                        <button
                          type="button"
                          onClick={() => props.onAction("delete")}
                          className="mt-4 min-h-11 rounded-full bg-white px-5 py-2.5 font-body text-sm font-medium text-red-700 transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          Delete account
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={props.onCancel}
                      className="mt-5 min-h-12 w-full rounded-full border border-primary/30 px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary/10 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={props.onCancel}
                      className="min-h-12 rounded-full border border-primary/30 px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary/10 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={props.onConfirm}
                      className="min-h-12 rounded-full bg-red-700 px-5 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      {props.confirmLabel}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
