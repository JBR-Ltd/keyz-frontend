"use client";

import { useEffect, useState, type ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import {
  acceptCall,
  getIncomingCall,
  rejectCall,
  type CallSession,
} from "@/lib/calls";

/** How often to ask whether anything is ringing. */
const POLL_MS = 8000;

/**
 * Watches for a call and offers to answer it.
 *
 * Polled rather than pushed: there is no socket, and a call that takes eight
 * seconds to appear is still a call. It lives in the dashboard shell so it is
 * present on every signed-in screen rather than only where chat is open.
 */
export default function IncomingCallWatcher(): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const [call, setCall] = useState<CallSession | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  /** Ids already answered or declined, so a stale poll cannot re-ring them. */
  const [handled, setHandled] = useState<number[]>([]);

  useEffect(() => {
    let active = true;

    const check = async (): Promise<void> => {
      const result = await getIncomingCall();

      if (!active) {
        return;
      }

      setCall((current) => {
        const incoming = result.data;

        if (incoming === null || handled.includes(incoming.id)) {
          return current !== null && incoming === null ? null : current;
        }

        return incoming.status === "INITIATED" ? incoming : null;
      });
    };

    void check();
    const timer = window.setInterval(() => void check(), POLL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [handled]);

  const answer = async (): Promise<void> => {
    if (!call) {
      return;
    }

    setIsBusy(true);
    const result = await acceptCall(call.id);
    setIsBusy(false);
    setHandled((current) => [...current, call.id]);
    setCall(null);

    if (result.data?.joinUrl) {
      window.open(result.data.joinUrl, "_blank", "noopener,noreferrer");
    }
  };

  const decline = async (): Promise<void> => {
    if (!call) {
      return;
    }

    setIsBusy(true);
    await rejectCall(call.id);
    setIsBusy(false);
    setHandled((current) => [...current, call.id]);
    setCall(null);
  };

  if (!call) {
    return null;
  }

  return (
    <AnimatePresence>
      <OverlayPortal>
        <motion.div
          role="alertdialog"
          aria-label="Incoming call"
          className="fixed bottom-6 left-1/2 z-[140] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-primary p-5 text-white shadow-xl"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 24 }}
        >
          <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Incoming call
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">
            {call.caller?.name ?? "Someone"}
          </h2>
          <p className="mt-1 font-body text-sm text-white/70">
            {call.caller?.role
              ? call.caller.role.charAt(0) +
                call.caller.role.slice(1).toLowerCase()
              : "Rello"}{" "}
            is calling about a listing
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => void answer()}
              disabled={isBusy}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
            >
              <Phone size={17} aria-hidden="true" />
              Answer
            </button>
            <button
              type="button"
              onClick={() => void decline()}
              disabled={isBusy}
              className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-5 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
            >
              <PhoneOff size={17} aria-hidden="true" />
              Decline
            </button>
          </div>
        </motion.div>
      </OverlayPortal>
    </AnimatePresence>
  );
}
