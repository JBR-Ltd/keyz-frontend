"use client";

import { useEffect, type ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogIn, X } from "lucide-react";
import { useRouter } from "next/navigation";
import OverlayPortal from "@/components/ui/OverlayPortal";
import {
  loginPath,
  registerPath,
  storePendingAuthAction,
  type PendingAuthAction,
} from "@/lib/authContinuation";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface GuestAuthPromptProps {
  action: PendingAuthAction | null;
  description: string;
  onClose: () => void;
  returnTo: string;
  title: string;
}

export default function GuestAuthPrompt({
  action,
  description,
  onClose,
  returnTo,
  title,
}: GuestAuthPromptProps): ReactElement {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const dialogRef = useDialogFocus<HTMLDivElement>(Boolean(action));

  useEffect(() => {
    if (!action) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [action, onClose]);

  const continueTo = (destination: "login" | "register"): void => {
    if (!action) return;
    storePendingAuthAction(action);
    router.push(
      destination === "login" ? loginPath(returnTo) : registerPath(returnTo),
    );
  };

  return (
    <OverlayPortal>
      <AnimatePresence>
        {action ? (
          <motion.div
            ref={dialogRef}
            className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-auth-prompt-title"
          >
            <motion.div
              className="w-full max-w-md rounded-2xl bg-bg p-6 shadow-xl sm:p-8"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-primary">
                  <LogIn size={20} aria-hidden="true" />
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close sign-in prompt"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-soft hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </div>
              <h2
                id="guest-auth-prompt-title"
                className="mt-5 font-display text-3xl font-bold text-primary"
              >
                {title}
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-muted">
                {description}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => continueTo("login")}
                  className="min-h-12 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => continueTo("register")}
                  className="min-h-12 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Create tenant account
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
