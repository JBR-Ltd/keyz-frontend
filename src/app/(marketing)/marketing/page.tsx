"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const heroImage =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2400&q=85";

const propertyImages = [
  {
    location: "Ikoyi, Lagos",
    price: "₦9.5m yearly",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
    size: "lg:row-span-2",
  },
  {
    location: "Maitama, Abuja",
    price: "₦7.8m yearly",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
    size: "",
  },
  {
    location: "Lekki Phase 1",
    price: "₦5.4m yearly",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    size: "",
  },
];

const features = [
  {
    title: "Verified landlords",
    description: "Listings are checked before renters see them.",
  },
  {
    title: "Clear pricing",
    description: "Rent ranges, fees, and move-in costs stay visible.",
  },
  {
    title: "City-first search",
    description: "Start with Lagos and Abuja neighborhoods that matter.",
  },
];

const steps = [
  {
    title: "Join the waitlist",
    description: "Tell Rello your city, budget, and the kind of home you need.",
  },
  {
    title: "Receive early matches",
    description: "Get verified options before they open to the wider market.",
  },
  {
    title: "Move with clarity",
    description: "Compare homes, contact trusted landlords, and avoid hidden fees.",
  },
];

const marqueeItems = [
  "Premium Listings",
  "Across Nigeria",
  "Verified Landlords",
  "Regulated Agent Fees",
  "Early Access",
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export default function MarketingLandingPage() {
  const reduceMotion = useReducedMotion();
  const ticker = [...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-slate-950">
      <Navbar />

      <section className="relative flex min-h-screen overflow-hidden text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(0,0,0,0.72),rgba(0,0,0,0))]" />

        <div className="relative z-10 flex w-full items-center px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-20">
          <div className="max-w-6xl">
            <motion.h1
              className="font-display text-5xl font-bold leading-[0.9] text-white sm:text-6xl md:text-7xl lg:text-8xl"
              initial={reduceMotion ? false : { opacity: 0, x: -40 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              Your key to finding a home.
            </motion.h1>
            <motion.p
              className="mt-6 max-w-2xl font-body text-lg leading-8 text-white/70 md:text-xl"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
            >
              Verified rentals across Nigerian cities, built for people who want
              fewer surprises before they move.
            </motion.p>
            <motion.div
              className="mt-9 flex flex-row items-center gap-3"
              initial={reduceMotion ? false : "hidden"}
              whileInView={reduceMotion ? undefined : "visible"}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ staggerChildren: 0.2 }}
            >
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <Link
                  href="/waitlist"
                  className="inline-flex min-h-12 items-center justify-center bg-accent px-4 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-14 sm:px-8 sm:py-4 sm:text-base"
                >
                  Join Waitlist
                </Link>
              </motion.div>
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <Link
                  href="#why-rello"
                  className="inline-flex min-h-12 items-center justify-center border border-white px-4 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-14 sm:px-8 sm:py-4 sm:text-base"
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-primary py-4 text-white">
        <div className="rello-marquee flex w-max items-center gap-6 whitespace-nowrap font-accent text-sm font-bold uppercase tracking-[0.28em] sm:text-base">
          {ticker.map((item, index) => (
            <span key={`${item}-${index}`} className="inline-flex items-center gap-6">
              {item}
              <span aria-hidden="true" className="text-accent">
                ◆
              </span>
            </span>
          ))}
        </div>
      </section>

      <section
        id="why-rello"
        className="border-b border-primary bg-[var(--color-bg)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[2fr_1fr] lg:gap-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Why Rello
            </p>
            <h2 className="mt-5 max-w-4xl font-display text-4xl font-bold leading-[0.96] text-primary sm:text-5xl lg:text-7xl">
              Rental search with the structure Nigerian cities need.
            </h2>
            <p className="mt-7 max-w-2xl font-body text-lg leading-8 text-slate-600">
              Rello cuts through scattered listings, uncertain costs, and
              unclear landlord details with a sharper path from search to keys.
            </p>
          </motion.div>

          <div className="border-t border-primary lg:border-t-0">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                className="border-b border-primary py-7"
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut",
                  delay: index * 0.1,
                }}
              >
                <h3 className="font-body text-xl font-bold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-2 font-body text-base leading-7 text-slate-600">
                  {feature.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-primary px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              How It Works
            </p>
            <h2 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Three direct steps from interest to inspection.
            </h2>
          </div>

          <div className="mt-14 grid border-l-2 border-accent lg:grid-cols-3 lg:border-l-0 lg:border-t lg:border-white/20">
            {steps.map((step, index) => (
              <motion.article
                key={step.title}
                className="relative overflow-hidden border-b border-white/20 px-6 py-12 lg:min-h-80 lg:border-b-0 lg:border-r lg:px-8"
                initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: index * 0.12,
                }}
              >
                <p className="absolute -left-1 top-0 font-display text-8xl font-bold leading-none text-white/[0.12] lg:text-9xl">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="relative z-10 pt-12">
                  <h3 className="font-body text-2xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-4 font-body text-base leading-7 text-white/70">
                    {step.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="cities"
        className="bg-[var(--color-surface-soft)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Property Preview
            </p>
            <h2 className="mt-5 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl lg:text-6xl">
              A first look at homes worth comparing.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1.35fr_0.9fr] lg:grid-rows-2">
            {propertyImages.map((property) => (
              <article
                key={property.location}
                className={`group relative min-h-[22rem] overflow-hidden border-2 border-primary ${property.size}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-200 ease-in-out group-hover:scale-[1.04]"
                  style={{ backgroundImage: `url(${property.image})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.78))]" />
                <span className="absolute right-4 top-4 bg-accent px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Verified
                </span>
                <div className="absolute inset-x-0 bottom-0 border-t border-white/30 p-5 text-white">
                  <h3 className="font-display text-3xl font-bold">
                    {property.location}
                  </h3>
                  <p className="mt-2 font-body text-base font-bold text-white/75">
                    {property.price}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <Link
            href="/waitlist"
            className="mt-10 inline-flex font-accent text-sm font-bold uppercase tracking-[0.22em] text-primary transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:text-accent"
          >
            Join the waitlist to get early access →
          </Link>
        </div>
      </section>

      <section className="overflow-hidden bg-accent px-4 py-20 text-primary sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em]">
              Early Access
            </p>
            <h2 className="mt-5 font-display text-5xl font-bold leading-[0.92] sm:text-6xl lg:text-8xl">
              Find better.
              <br />
              Move clearer.
            </h2>
            <Link
              href="/waitlist"
              className="mt-9 inline-flex min-h-14 items-center justify-center bg-white px-8 py-4 font-body text-base font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Join Waitlist
            </Link>
          </div>

          <div className="relative hidden min-h-80 lg:block">
            <div className="absolute right-0 top-0 h-72 w-72 border-2 border-primary" />
            <div className="absolute bottom-0 left-8 grid grid-cols-6 gap-4">
              {Array.from({ length: 36 }).map((_, index) => (
                <span key={index} className="h-2 w-2 bg-primary" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
