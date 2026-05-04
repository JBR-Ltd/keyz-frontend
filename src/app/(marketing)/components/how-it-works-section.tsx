"use client";

import { motion } from "framer-motion";
import { CreditCard, SearchCheck, ShieldCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Verify once",
    description:
      "A quick identity check so everyone on Keyz is who they say they are.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Browse with confidence",
    description:
      "Every listing is verified before it goes live. No fakes, no surprises.",
    icon: SearchCheck,
  },
  {
    number: "03",
    title: "Pay safely",
    description:
      "Your money is held in escrow and only releases when you're happy.",
    icon: CreditCard,
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-[#F9F6F0] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-[#C38A1D] uppercase">
            A kinder rental process
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold text-[#0A1628] sm:text-5xl">
            How Keyz Works
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            We help both sides of the rental journey feel safer from the very
            first click.
          </p>
        </div>

        <motion.div
          className="mt-12 grid gap-6 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <motion.article
                key={step.number}
                className="rounded-[24px] bg-white p-8 shadow-[0_20px_60px_rgba(10,22,40,0.08)] transition duration-300 hover:-translate-y-1"
                variants={cardVariants}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE7BF] text-[#C98200]">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="mt-6 text-sm font-bold tracking-[0.18em] text-[#C38A1D] uppercase">
                  Step {step.number}
                </p>
                <h3 className="font-display mt-3 text-3xl font-bold text-[#0A1628]">
                  {step.title}
                </h3>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  {step.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
