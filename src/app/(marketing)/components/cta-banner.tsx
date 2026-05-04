"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export function CtaBanner() {
  return (
    <section id="cta" className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[32px] bg-[#0A1628] px-6 py-16 text-center text-white shadow-[0_30px_90px_rgba(10,22,40,0.22)] sm:px-10 lg:px-16">
          <div className="absolute -right-12 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#F5A623]/20 blur-3xl" />
          <div className="absolute left-10 top-10 h-28 w-28 rounded-full bg-[#F5A623]/10 blur-2xl" />

          <motion.div
            className="relative mx-auto max-w-3xl"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.p
              className="text-sm font-bold tracking-[0.22em] text-[#F5C96A] uppercase"
              variants={textVariants}
            >
              Built on trust
            </motion.p>
            <motion.h2
              className="font-display mt-4 text-4xl font-bold leading-tight text-[#FFF1D0] sm:text-5xl"
              variants={textVariants}
            >
              Nigeria&apos;s most trusted way to find and rent a home.
            </motion.h2>
            <motion.p
              className="mt-4 text-lg leading-8 text-slate-200"
              variants={textVariants}
            >
              Join the landlords and tenants already building trust on Keyz.
            </motion.p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <motion.a
                href="#hero"
                className="inline-flex min-w-44 items-center justify-center rounded-full bg-[#F5A623] px-6 py-4 text-base font-bold text-[#0A1628] transition hover:bg-[#e89a1f]"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                Get Started
              </motion.a>
              <motion.a
                href="#how-it-works"
                className="inline-flex min-w-44 items-center justify-center rounded-full border border-white px-6 py-4 text-base font-bold text-white transition hover:bg-white hover:text-[#0A1628]"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                Learn More
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
