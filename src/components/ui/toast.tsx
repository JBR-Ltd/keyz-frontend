"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

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

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: ToastInput) => {
      const id = createToastId();

      setToasts((current) => [...current, { ...toast, id }].slice(-3));
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-50 grid w-[calc(100vw-2rem)] max-w-sm gap-3 sm:right-6 sm:top-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.variant === "success";
          const Icon = isSuccess ? CheckCircle2 : XCircle;

          return (
            <div
              key={toast.id}
              className="flex items-start gap-3 border border-primary bg-[var(--color-bg)] p-4 shadow-[4px_4px_0_var(--color-primary)]"
              role="status"
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border ${
                  isSuccess
                    ? "border-accent text-accent"
                    : "border-red-500 text-red-500"
                }`}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-2 font-body text-sm leading-5 text-muted">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-surface text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
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
