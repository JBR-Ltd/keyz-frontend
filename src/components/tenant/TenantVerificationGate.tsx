"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactElement, ReactNode, useEffect, useState } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { Button } from "@/components/ui/button";
import {
  isTenantVerified,
  useTenantVerificationSnapshot,
} from "@/lib/tenantVerification";
import { useDialogFocus } from "@/lib/useDialogFocus";

type TenantVerificationIntent = "booking" | "offer";

interface TenantVerificationGateProps {
  children: (requestAction: () => void) => ReactNode;
  intent: TenantVerificationIntent;
  onVerifiedAction: () => void;
}

export default function TenantVerificationGate({
  children,
  intent,
  onVerifiedAction,
}: TenantVerificationGateProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { state } = useTenantVerificationSnapshot();
  const [showGate, setShowGate] = useState(false);
  const dialogRef = useDialogFocus<HTMLDivElement>(showGate);
  const verified = isTenantVerified(state);

  const requestAction = () => {
    if (verified) {
      onVerifiedAction();
      return;
    }

    setShowGate(true);
  };

  useEffect(() => {
    if (!showGate) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setShowGate(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGate]);

  const openVerificationFlow = (): void => {
    const query = new URLSearchParams({
      source: "gate",
      intent,
      returnTo: pathname,
    });

    router.push(`/tenant/verify?${query.toString()}`);
  };

  return (
    <>
      {children(requestAction)}

      <OverlayPortal>
        <AnimatePresence>
          {showGate ? (
            <motion.div
              ref={dialogRef}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              onClick={() => setShowGate(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tenant-verification-gate-title"
            >
              <motion.div
                className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-bg shadow-xl"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border bg-surface-soft p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/5 text-accent-alt shadow-sm">
                    <ShieldCheck size={21} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGate(false)}
                    aria-label="Close identity verification prompt"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-6 sm:p-8">
                  <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
                    Quick safety step
                  </p>
                  <h2
                    id="tenant-verification-gate-title"
                    className="mt-4 font-display text-3xl font-bold leading-none text-primary"
                  >
                    {intent === "offer"
                      ? "Verify your identity to make an offer"
                      : "Verify your identity to book"}
                  </h2>
                  <p className="mt-5 font-body leading-7 text-muted">
                    For everyone&apos;s safety, we require quick identity
                    verification before{" "}
                    {intent === "offer" ? "making an offer" : "booking"}. It
                    only takes a couple of minutes.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="utility-secondary"
                      size="utility"
                      onClick={() => setShowGate(false)}
                    >
                      Maybe later
                    </Button>
                    <button
                      type="button"
                      onClick={openVerificationFlow}
                      className="min-h-12 rounded-full bg-accent px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {intent === "offer"
                        ? "Verify to make offer"
                        : "Verify to book"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </OverlayPortal>
    </>
  );
}
