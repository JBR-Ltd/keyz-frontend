"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ReactNode } from "react";
import relloLogo from "../../../public/FullLogo_Transparent (2).png";

interface AuthSplitLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  showWatermark?: boolean;
}

export default function AuthSplitLayout({
  leftContent,
  rightContent,
  showWatermark = false,
}: AuthSplitLayoutProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="grid min-h-screen bg-[var(--color-bg)] lg:grid-cols-2">
      <motion.div
        className="relative hidden min-h-full overflow-hidden border-r border-primary bg-primary lg:block"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <div className="absolute right-10 top-10 h-40 w-40 border-2 border-accent opacity-70" />
        <div className="absolute bottom-12 left-12 grid grid-cols-6 gap-2 opacity-60">
          {Array.from({ length: 36 }).map((_, index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 bg-accent"
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="relative z-10 flex min-h-screen items-center px-12 py-20">
          {leftContent}
        </div>
      </motion.div>

      <div className="relative flex min-h-screen items-center overflow-hidden bg-[var(--color-bg)] px-4 py-16 sm:px-6 lg:px-12">
        {showWatermark ? (
          <Image
            src={relloLogo}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-[-58%] top-[-22%] z-0 w-[175%] max-w-none opacity-[0.05] [clip-path:inset(0_0_40%_0)] sm:right-[-62%] sm:top-[-26%] sm:w-[185%] lg:right-[-65%] lg:top-[-28%] lg:w-[190%]"
            priority
          />
        ) : null}
        <motion.div
          className="relative z-10 mx-auto w-full max-w-xl"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {rightContent}
        </motion.div>
      </div>
    </section>
  );
}
