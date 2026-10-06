"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  createContext,
  type FocusEvent,
  type ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { usePathname } from "next/navigation";

type ToastVariant = "success" | "error";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
  notify: (toast: ToastInput) => void;
};

interface ToastItemProps {
  dismiss: (id: string) => void;
  toast: Toast;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const standaloneToastRoutes = new Set([
  "/forgot-password",
  "/login",
  "/register",
  "/reset-password",
  "/verify-email",
]);

function getToastDuration(toast: Toast): number {
  if (toast.variant === "error") {
    return toast.description ? 8000 : 6500;
  }

  return 5000;
}

function createToastId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ToastItem({ dismiss, toast }: ToastItemProps): ReactElement {
  const reduceMotion = useReducedMotion();
  const remainingMsRef = useRef(getToastDuration(toast));
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const pointerInsideRef = useRef(false);
  const focusInsideRef = useRef(false);
  const isSuccess = toast.variant === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pauseTimer = useCallback((): void => {
    if (timerRef.current === null) {
      return;
    }

    remainingMsRef.current = Math.max(
      0,
      remainingMsRef.current - (Date.now() - startedAtRef.current),
    );
    clearTimer();
  }, [clearTimer]);

  const resumeTimer = useCallback((): void => {
    if (
      pointerInsideRef.current ||
      focusInsideRef.current ||
      timerRef.current !== null
    ) {
      return;
    }

    if (remainingMsRef.current <= 0) {
      dismiss(toast.id);
      return;
    }

    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(
      () => dismiss(toast.id),
      remainingMsRef.current,
    );
  }, [dismiss, toast.id]);

  useEffect(() => {
    resumeTimer();
    return clearTimer;
  }, [clearTimer, resumeTimer]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    focusInsideRef.current = false;
    resumeTimer();
  };

  return (
    <motion.div
      layout={!reduceMotion}
      initial={
        reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -6 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: "easeOut" }}
      className={`pointer-events-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-border/70 border-l-[3px] bg-bg p-4 shadow-[0_18px_50px_rgba(0,47,73,0.16)] ${
        isSuccess ? "border-l-accent-alt" : "border-l-red-700"
      }`}
      role="status"
      onPointerEnter={() => {
        pointerInsideRef.current = true;
        pauseTimer();
      }}
      onPointerLeave={() => {
        pointerInsideRef.current = false;
        resumeTimer();
      }}
      onFocusCapture={() => {
        focusInsideRef.current = true;
        pauseTimer();
      }}
      onBlurCapture={handleBlur}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isSuccess ? "bg-accent/20 text-primary" : "bg-red-700/10 text-red-700"
        }`}
      >
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0 py-0.5">
        <p className="font-body text-sm font-bold leading-5 text-primary">
          {toast.title}
        </p>
        {toast.description ? (
          <p className="mt-1 font-body text-sm leading-5 text-muted">
            {toast.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-200 ease-in-out hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={17} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pathname = usePathname();
  const usesStandaloneLayout = standaloneToastRoutes.has(pathname);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const id = createToastId();

    setToasts((current) => {
      const withoutDuplicate = current.filter(
        (existing) =>
          existing.title !== toast.title ||
          existing.description !== toast.description ||
          existing.variant !== toast.variant,
      );

      return [...withoutDuplicate, { ...toast, id }].slice(-3);
    });
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`pointer-events-none fixed left-4 right-4 z-[140] grid gap-3 sm:left-auto sm:right-6 sm:w-[22rem] sm:max-w-[calc(100vw-3rem)] ${
          usesStandaloneLayout ? "top-4 sm:top-5" : "top-24 sm:top-24"
        }`}
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="additions"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} dismiss={dismiss} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
