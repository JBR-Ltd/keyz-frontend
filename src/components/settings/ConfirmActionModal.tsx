"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

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
}: ConfirmActionModalProps) {
  const reduceMotion = useReducedMotion();
  const isAccountMode = props.mode === "account";

  return (
    <AnimatePresence>
      {props.isOpen ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/70 p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-action-title"
        >
          <motion.div
            className="w-full max-w-lg border border-red-700 bg-[var(--color-bg)] shadow-[8px_8px_0_var(--color-primary)]"
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
                className="flex h-10 w-10 items-center justify-center border border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
                className="mt-4 font-display text-4xl font-bold leading-none text-primary"
              >
                {isAccountMode ? "Manage your account" : props.title}
              </h2>
              <p className="mt-5 font-body leading-7 text-muted">
                {isAccountMode
                  ? "Choose whether to temporarily hide your account or permanently remove its data."
                  : props.description}
              </p>
              {isAccountMode ? (
                <>
                  <div className="mt-8 grid gap-px border border-red-700 bg-red-700">
                    <button
                      type="button"
                      onClick={() => props.onAction("deactivate")}
                      className="bg-[var(--color-bg)] p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500"
                    >
                      <span className="block font-body text-base font-bold text-red-700">
                        Deactivate account
                      </span>
                      <span className="mt-2 block font-body text-sm leading-6 text-muted">
                        Hide your profile until you sign in again.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => props.onAction("delete")}
                      className="bg-red-700 p-5 text-left text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500"
                    >
                      <span className="block font-body text-base font-bold">
                        Delete account
                      </span>
                      <span className="mt-2 block font-body text-sm leading-6 text-white/70">
                        Permanently remove your profile and account data.
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={props.onCancel}
                    className="mt-5 min-h-12 w-full border border-primary px-5 py-3 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={props.onCancel}
                    className="min-h-12 border border-primary px-5 py-3 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={props.onConfirm}
                    className="min-h-12 bg-red-700 px-5 py-3 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
  );
}
