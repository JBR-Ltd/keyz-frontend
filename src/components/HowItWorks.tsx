"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactElement } from "react";

const JOURNEY_STAGES = [
  {
    title: "Search",
    assurance: "Verified listings",
    description:
      "Explore homes and hosts that have passed Rello's checks, then narrow the options around how you want to live.",
  },
  {
    title: "Review",
    assurance: "Clear rental terms",
    description:
      "Compare the price, rental period, move-in terms, photographs, amenities, and available tours.",
  },
  {
    title: "Request",
    assurance: "Tours before decisions",
    description:
      "Request a viewing or send a rental request from the listing when a home feels right.",
  },
  {
    title: "Move in",
    assurance: "Protected payments",
    description:
      "Keep eligible rent payments, tenancy documents, and their status visible in one place.",
  },
] as const;

export default function HowItWorks(): ReactElement {
  const reduceMotion = useReducedMotion();
  const still = reduceMotion === true;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-16 overflow-hidden bg-primary px-5 py-14 text-white sm:px-8 sm:py-16 lg:px-10 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="grid gap-5 border-b border-white/20 pb-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.55fr)] lg:items-end lg:gap-16 lg:pb-11"
          initial={still ? false : { opacity: 0, y: 16 }}
          whileInView={still ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: still ? 0 : 0.5, ease: "easeOut" }}
        >
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.24em] text-accent">
              How Rello works
            </p>
            <h2
              id="how-it-works-heading"
              className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
            >
              Four clear steps, from search to move-in.
            </h2>
          </div>
          <p className="max-w-xl font-body text-sm leading-6 text-white/65 sm:text-base sm:leading-7 lg:justify-self-end">
            Each stage keeps the home, terms, and next action clear so you can
            move forward with fewer unknowns.
          </p>
        </motion.div>

        <div className="relative mt-10 lg:mt-12">
          <span
            className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-white/20 lg:block"
            aria-hidden="true"
          >
            <motion.span
              className="block h-full origin-left bg-accent"
              initial={still ? false : { scaleX: 0 }}
              whileInView={still ? undefined : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: still ? 0 : 0.85, ease: "easeOut" }}
            />
          </span>

          <ol className="grid gap-y-8 lg:grid-cols-4 lg:gap-x-6">
            {JOURNEY_STAGES.map((stage, index) => (
              <motion.li
                key={stage.title}
                className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-5 lg:block"
                initial={still ? false : { opacity: 0, y: 18 }}
                whileInView={still ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{
                  duration: still ? 0 : 0.45,
                  delay: still ? 0 : 0.12 + index * 0.09,
                  ease: "easeOut",
                }}
              >
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-primary font-accent text-xs font-bold text-accent lg:mx-auto">
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {index < JOURNEY_STAGES.length - 1 ? (
                  <span
                    className="absolute bottom-[-3.25rem] left-5 top-10 w-px bg-white/20 lg:hidden"
                    aria-hidden="true"
                  >
                    <motion.span
                      className="block h-full origin-top bg-accent"
                      initial={still ? false : { scaleY: 0 }}
                      whileInView={still ? undefined : { scaleY: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{
                        duration: still ? 0 : 0.45,
                        delay: still ? 0 : 0.12 + index * 0.09,
                        ease: "easeOut",
                      }}
                    />
                  </span>
                ) : null}

                <div className="pb-7 lg:px-4 lg:pb-0 lg:pt-7 lg:text-center">
                  <p className="font-accent text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent">
                    {stage.assurance}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-white">
                    {stage.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-6 text-white/65">
                    {stage.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
