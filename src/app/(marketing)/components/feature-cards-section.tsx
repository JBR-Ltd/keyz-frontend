"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check } from "lucide-react";

const tenantFeatures = [
  "Verified listings only",
  "Escrow payment protection",
  "Raise a dispute if something's wrong",
  "Honest reviews from real tenants",
];

const landlordFeatures = [
  "List for free",
  "Get paid automatically on move-in",
  "Founding Landlord offer: 6 months free service charge",
  "Build a verified reputation",
];

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function FeatureCardsSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 xl:grid-cols-2">
          <motion.article
            className="rounded-[24px] bg-[#0A1628] p-8 text-white shadow-[0_24px_70px_rgba(10,22,40,0.18)] sm:p-10"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-sm font-bold tracking-[0.18em] text-[#F5C96A] uppercase">
              Tenant-first protection
            </p>
            <h2 className="font-display mt-4 text-4xl font-bold sm:text-5xl">
              For Tenants
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-slate-200">
              Find a home you can actually trust.
            </p>

            <motion.ul
              className="mt-8 space-y-4"
              variants={listVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {tenantFeatures.map((feature) => (
                <motion.li
                  key={feature}
                  variants={listItemVariants}
                  className="flex items-start gap-3 text-lg"
                >
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5A623] text-[#0A1628]">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{feature}</span>
                </motion.li>
              ))}
            </motion.ul>

            <Link
              href="#hero"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-6 py-4 text-base font-bold text-[#0A1628] transition hover:bg-[#e89a1f]"
            >
              Find a Home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.article>

          <motion.article
            id="for-landlords"
            className="rounded-[24px] bg-[#F9F6F0] p-8 text-[#0A1628] shadow-[0_24px_70px_rgba(10,22,40,0.08)] sm:p-10"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex rounded-full bg-[#FDE7BF] px-4 py-2 text-sm font-bold text-[#9A6700]">
              Founding Landlord Offer
            </span>
            <h2 className="font-display mt-4 text-4xl font-bold sm:text-5xl">
              For Landlords
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-slate-700">
              Reach tenants who are serious.
            </p>

            <motion.ul
              className="mt-8 space-y-4"
              variants={listVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {landlordFeatures.map((feature) => (
                <motion.li
                  key={feature}
                  variants={listItemVariants}
                  className="flex items-start gap-3 text-lg"
                >
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5A623] text-[#0A1628]">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  <span>{feature}</span>
                </motion.li>
              ))}
            </motion.ul>

            <Link
              href="#cta"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0A1628] px-6 py-4 text-base font-bold text-white transition hover:bg-[#13233c]"
            >
              List Your Property
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
