// src/hooks/useProductTour.ts
"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "rello:tour:";

interface UseProductTourOptions {
  /** Start automatically the first time this browser sees the tour. */
  autoStart?: boolean;
  /** Wait a beat so the page can settle before the first step fires. */
  startDelayMs?: number;
}

interface UseProductTourResult {
  isOpen: boolean;
  /** True once the host has finished or skipped it at least once. */
  hasSeen: boolean;
  start: () => void;
  /** Closes the tour and records it as seen. Use for finish, skip and Escape. */
  finish: () => void;
}

/**
 * Remembers, per browser, whether a tour has been run.
 *
 * The "seen" flag lives in localStorage under `rello:tour:<id>`, so a reload
 * never restarts the walkthrough. `start()` ignores the flag, which is what
 * the header's "Replay tutorial" button calls.
 */
export function useProductTour(
  tourId: string,
  { autoStart = true, startDelayMs = 900 }: UseProductTourOptions = {},
): UseProductTourResult {
  const storageKey = `${STORAGE_PREFIX}${tourId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    let seen = false;

    try {
      seen = window.localStorage.getItem(storageKey) === "done";
    } catch {
      // Private mode or storage blocked. Treat it as unseen for this visit
      // rather than throwing; the tour is a nice-to-have, not a requirement.
      seen = false;
    }

    setHasSeen(seen);

    if (!autoStart || seen) return;

    const timer = window.setTimeout(() => setIsOpen(true), startDelayMs);
    return () => window.clearTimeout(timer);
  }, [storageKey, autoStart, startDelayMs]);

  const start = useCallback(() => setIsOpen(true), []);

  const finish = useCallback(() => {
    setIsOpen(false);
    setHasSeen(true);

    try {
      window.localStorage.setItem(storageKey, "done");
    } catch {
      // Nothing to do. The tour will simply offer itself again next visit.
    }
  }, [storageKey]);

  return { isOpen, hasSeen, start, finish };
}