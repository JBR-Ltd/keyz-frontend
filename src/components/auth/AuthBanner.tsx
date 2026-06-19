"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

type AuthBannerType = "error" | "success";

interface AuthBannerProps {
  message: string;
  type: AuthBannerType;
}

export default function AuthBanner({ message, type }: AuthBannerProps) {
  const [visible, setVisible] = useState(true);
  const reduceMotion = useReducedMotion();
  const isError = type === "error";

  return (
    <AnimatePresence>
      {visible && message ? (
        <motion.div
          className={`flex items-start justify-between gap-4 border-l-4 bg-[var(--color-bg)] px-4 py-3 font-body text-sm font-bold ${
            isError
              ? "border-red-500 text-red-500"
              : "border-accent text-primary"
          }`}
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role={isError ? "alert" : "status"}
        >
          <p>{message}</p>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setVisible(false)}
            className="flex h-6 w-6 shrink-0 items-center justify-center transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={16} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
