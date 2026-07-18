import type { ReactElement, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SocialProofFloatProps {
  icon: ReactNode;
  stat: string;
  label: string;
}

export default function SocialProofFloat({
  icon,
  stat,
  label,
}: SocialProofFloatProps): ReactElement {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="inline-flex items-center gap-3 rounded-lg bg-[var(--color-bg)] px-4 py-3 shadow-sm ring-1 ring-[var(--color-border)]"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.35 }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-accent">
        {icon}
      </span>
      <span className="font-body text-sm leading-tight text-primary">
        <strong className="block font-bold">{stat}</strong>
        <span className="text-muted">{label}</span>
      </span>
    </motion.div>
  );
}
