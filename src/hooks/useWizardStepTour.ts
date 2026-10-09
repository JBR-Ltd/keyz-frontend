// src/hooks/useWizardStepTour.ts
//
// Per-step version of useProductTour. Each wizard step gets its own
// localStorage flag under `rello:tour-wizard:<step>`, so finishing the
// door-linking tutorial does not silence the floor-plan one, and a host who
// has seen everything never gets auto-opened again.
//
// The first time the host lands on an unseen step, its tutorial auto-opens
// after `startDelayMs`. After that, only `start()` opens it — the wizard's
// "View tutorial" button calls that.
//
// Passing `null` (during the loading step) leaves everything idle.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "rello:tour-wizard:";
const DEFAULT_START_DELAY_MS = 800;

interface UseWizardStepTourResult {
  /** True while the spotlight is visible. */
  isOpen: boolean;
  /** True when this browser has already seen the current step's tutorial. */
  hasSeenCurrentStep: boolean;
  /** Opens the tour for the current step. Called by the header button. */
  start: () => void;
  /** Closes the tour and records the current step as seen. */
  finish: () => void;
}

export function useWizardStepTour(
  step: string | null,
  startDelayMs: number = DEFAULT_START_DELAY_MS,
): UseWizardStepTourResult {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenCurrentStep, setHasSeenCurrentStep] = useState(true);
  const currentStepRef = useRef<string | null>(null);

  useEffect(() => {
    currentStepRef.current = step;

    // Deferred, so the effect body itself never sets state
    if (step === null) {
      queueMicrotask(() => {
        setIsOpen(false);
        setHasSeenCurrentStep(true);
      });
      return;
    }

    const storageKey = `${STORAGE_PREFIX}${step}`;
    let seen = false;

    try {
      seen = window.localStorage.getItem(storageKey) === "done";
    } catch {
      // Private mode or storage blocked. Treat as unseen for this visit.
      seen = false;
    }

    queueMicrotask(() => {
      setIsOpen(false);
      setHasSeenCurrentStep(seen);
    });

    if (seen) return;

    const timer = window.setTimeout(() => {
      // Only auto-open if we are still on the step that scheduled it.
      if (currentStepRef.current === step) {
        setIsOpen(true);
      }
    }, startDelayMs);

    return () => window.clearTimeout(timer);
  }, [step, startDelayMs]);

  const start = useCallback(() => {
    if (currentStepRef.current === null) return;
    setIsOpen(true);
  }, []);

  const finish = useCallback(() => {
    setIsOpen(false);
    const stepId = currentStepRef.current;
    if (stepId === null) return;

    setHasSeenCurrentStep(true);

    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${stepId}`, "done");
    } catch {
      // Nothing to do. The tour will simply offer itself again next visit.
    }
  }, []);

  return { isOpen, hasSeenCurrentStep, start, finish };
}
