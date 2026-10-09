// src/components/tour/ProductTour.tsx
//
// A lightweight spotlight walkthrough. Darkens the page, punches a hole
// over the target element, and shows a small card with Next / Back / Skip.
//
// Steps are plain objects: { target, title, body, placement?, onEnter?, onLeave? }.
// onEnter runs when the step becomes active — use it to open a panel or
// select a pin so the target actually exists. onLeave runs when leaving the
// step or closing the tour.

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

export interface ProductTourStep {
  /** CSS selector for the element to spotlight. */
  target: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  /** Runs just before the step becomes visible. */
  onEnter?: () => void;
  /** Runs when leaving the step or closing the tour. */
  onLeave?: () => void;
}

interface ProductTourProps {
  steps: ProductTourStep[];
  isOpen: boolean;
  onFinish: () => void;
  finishLabel?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const TOOLTIP_GAP = 14;
const TOOLTIP_WIDTH = 340;
const TOOLTIP_HEIGHT_ESTIMATE = 220;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function rectFromElement(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function ProductTour({
  steps,
  isOpen,
  onFinish,
  finishLabel = "Got it",
}: ProductTourProps): ReactElement | null {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 1024, h: 768 });
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Reset to the first step whenever the tour opens.
  useEffect(() => {
    if (isOpen) setStepIndex(0);
  }, [isOpen]);

  const step = steps[stepIndex] ?? null;

  // Fire onEnter / onLeave around step changes.
  const prevStepRef = useRef<ProductTourStep | null>(null);
  useEffect(() => {
    if (!isOpen) {
      prevStepRef.current?.onLeave?.();
      prevStepRef.current = null;
      return;
    }
    if (prevStepRef.current && prevStepRef.current !== step) {
      prevStepRef.current.onLeave?.();
    }
    step?.onEnter?.();
    prevStepRef.current = step;
  }, [isOpen, step]);

  // Locate the target. Retries for up to ~1.5s so a step whose onEnter just
  // opened a panel has time to render.
  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !step) return;

    let cancelled = false;
    let raf = 0;
    let attempts = 0;

    const measure = (): void => {
      if (cancelled) return;
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setRect(rectFromElement(el));
      } else if (attempts < 90) {
        attempts += 1;
        raf = requestAnimationFrame(measure);
      } else {
        setRect(null);
      }
    };

    measure();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [isOpen, step]);

  // Track viewport for tooltip clamping.
  useEffect(() => {
    if (!isOpen) return;
    const update = (): void =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isOpen]);

  // Keep the spotlight following the target on scroll / resize.
  useEffect(() => {
    if (!isOpen || !step || !rect) return;

    const refresh = (): void => {
      const el = document.querySelector(step.target);
      if (el) setRect(rectFromElement(el));
    };

    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [isOpen, step, rect]);

  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      onFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, steps.length, onFinish]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard controls.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onFinish();
      } else if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onFinish, goNext, goBack]);

  // Focus the primary button so keyboard users can advance with Enter.
  useEffect(() => {
    if (isOpen) nextButtonRef.current?.focus({ preventScroll: true });
  }, [isOpen, stepIndex]);

  if (!isOpen || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const placement = step.placement ?? "bottom";

  let tooltipTop = viewport.h / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
  let tooltipLeft = viewport.w / 2 - TOOLTIP_WIDTH / 2;

  if (rect) {
    switch (placement) {
      case "top":
        tooltipTop = rect.top - TOOLTIP_GAP - TOOLTIP_HEIGHT_ESTIMATE;
        tooltipLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case "bottom":
        tooltipTop = rect.top + rect.height + TOOLTIP_GAP;
        tooltipLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case "left":
        tooltipTop = rect.top + rect.height / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
        tooltipLeft = rect.left - TOOLTIP_GAP - TOOLTIP_WIDTH;
        break;
      case "right":
        tooltipTop = rect.top + rect.height / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
        tooltipLeft = rect.left + rect.width + TOOLTIP_GAP;
        break;
      case "center":
      default:
        break;
    }
  }

  tooltipTop = clamp(tooltipTop, 16, viewport.h - TOOLTIP_HEIGHT_ESTIMATE - 16);
  tooltipLeft = clamp(tooltipLeft, 16, viewport.w - TOOLTIP_WIDTH - 16);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      className="fixed inset-0 z-[100]"
    >
      {/* Invisible click blocker. Stops the host from interacting with the
          page while the tour is up, so they never fall off-script. */}
      <div aria-hidden="true" className="fixed inset-0" />

      {/* Darkener with a hole punched over the target. */}
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-xl transition-all duration-200"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(4, 52, 76, 0.74)",
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-[rgba(4,52,76,0.74)]"
        />
      )}

      {/* Bright ring around the target. */}
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-xl ring-2 ring-accent transition-all duration-200"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 24px rgba(201, 145, 58, 0.35)",
          }}
        />
      ) : null}

      {/* Tooltip card. */}
      <div
        className="fixed z-[101] w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-bg p-5 shadow-2xl"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-accent text-[11px] font-bold uppercase tracking-[0.2em] text-accent-alt">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <button
            type="button"
            onClick={onFinish}
            aria-label="Skip the tutorial"
            className="-mr-1 -mt-1 rounded-full p-1 text-muted transition-colors hover:bg-surface-soft hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <h3 className="mt-3 font-display text-lg font-bold text-primary">
          {step.title}
        </h3>
        <p className="mt-2 font-body text-sm leading-6 text-muted">
          {step.body}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onFinish}
            className="font-body text-xs font-bold text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Skip tutorial
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-bg px-3 font-body text-xs font-bold text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                Back
              </button>
            ) : null}
            <button
              ref={nextButtonRef}
              type="button"
              onClick={goNext}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-4 font-body text-xs font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {isLast ? finishLabel : "Next"}
              {!isLast ? <ArrowRight size={13} aria-hidden="true" /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
