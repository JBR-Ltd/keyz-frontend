"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative w-full min-h-[680px] md:min-h-[720px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-house.jpg"
          alt="Luxury property with pool"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>
      <div className="hero-mesh absolute inset-0 z-[1] opacity-70 mix-blend-screen" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-28 w-full">
        <div className="max-w-3xl">
          <motion.p
            className="mb-5 text-sm font-semibold uppercase tracking-[0.32em] text-accent"
            initial={
              reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }
            }
            animate={
              reduceMotion
                ? undefined
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            Rello Estate
          </motion.p>

          <motion.h1
            className="font-display text-5xl font-bold leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-8xl"
            initial={
              reduceMotion ? false : { opacity: 0, y: 26, filter: "blur(10px)" }
            }
            animate={
              reduceMotion
                ? undefined
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
          >
            Find, tour, and secure a home that feels rare.
          </motion.h1>

          <motion.p
            className="mt-7 max-w-2xl text-lg font-light leading-8 text-white/[0.78] md:text-xl md:leading-9"
            initial={
              reduceMotion ? false : { opacity: 0, y: 22, filter: "blur(8px)" }
            }
            animate={
              reduceMotion
                ? undefined
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            transition={{ duration: 0.75, ease: "easeOut", delay: 0.18 }}
          >
            Rello curates premium apartments, penthouses, and investment-ready
            homes with verified listings, guided tours, and calm expert support.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-row gap-4 sm:flex-col sm:items-center sm:gap-5"
            initial={
              reduceMotion ? false : { opacity: 0, y: 20, filter: "blur(8px)" }
            }
            animate={
              reduceMotion
                ? undefined
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            transition={{ duration: 0.72, ease: "easeOut", delay: 0.28 }}
          >
            <Link
              href="/marketing/waitlist"
              className="premium-hover inline-flex min-h-14 justify-center rounded-full bg-gradient-to-r from-accent to-accent-alt px-8 py-4 text-base font-semibold text-white"
            >
              Join the waitlist
            </Link>
            <Link
              href="#how-it-works"
              className="premium-hover inline-flex min-h-14 justify-center rounded-full border border-white bg-white text-primary px-8 py-4 text-base font-semibold text-white"
            >
              See how it works
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
