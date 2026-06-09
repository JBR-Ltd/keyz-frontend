"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Mail, MapPin, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const perks = [
  {
    icon: Check,
    title: "Priority invites",
    description:
      "Be the first to access newly listed luxury homes before the market opens.",
  },
  {
    icon: Mail,
    title: "Curated alerts",
    description:
      "Receive tailored notifications for properties that match your lifestyle preferences.",
  },
  {
    icon: MapPin,
    title: "Local insights",
    description:
      "Discover new markets, price trends and premium neighborhoods early.",
  },
  {
    icon: ShieldCheck,
    title: "Secure access",
    description:
      "Your details stay private and we only use them to send exclusive updates.",
  },
];

export default function JoinWaitlistPage() {
  return (
    <main className="min-h-screen bg-surface-soft text-slate-900">
      <Navbar />

      <section className="relative overflow-hidden bg-primary text-white py-16 md:py-24">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid gap-12 lg:grid-cols-[1.3fr_0.9fr] items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <div className="max-w-2xl">
              <p className="mb-4 text-sm uppercase tracking-[0.32em] text-accent">
                Join the waitlist
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                Unlock premium homes with early access and tailored property
                alerts.
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/80 max-w-xl">
                Be first in line for curated luxury listings, pre-launch
                invitations, and insider market updates from Keyz Estate.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {perks.slice(0, 2).map((perk) => {
                  const Icon = perk.icon;
                  return (
                    <motion.div
                      key={perk.title}
                      className="rounded-3xl border border-white/10 bg-white/10 p-5"
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-accent">
                          <Icon size={20} />
                        </span>
                        <h2 className="text-base font-semibold">
                          {perk.title}
                        </h2>
                      </div>
                      <p className="mt-3 text-sm text-white/80">
                        {perk.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <motion.div
              className="rounded-[2rem] border border-white/10 bg-white/95 p-8 shadow-2xl shadow-slate-950/10"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Early access form
                </p>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Secure your spot now
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Share a few details and we&apos;ll reserve your place on our
                  next high-end launch list.
                </p>
              </div>

              <form
                className="mt-8 grid gap-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Full name
                  </span>
                  <input
                    type="text"
                    placeholder="Alex Morgan"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Email address
                  </span>
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Preferred city
                  </span>
                  <input
                    type="text"
                    placeholder="Dubai, London, Miami"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Property interest
                  </span>
                  <select className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20">
                    <option>Luxury apartments</option>
                    <option>Beach villas</option>
                    <option>Urban penthouses</option>
                    <option>Investment portfolios</option>
                  </select>
                </label>
                <motion.button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-accent px-5 py-4 text-base font-semibold text-white transition hover:bg-accent-alt"
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    // placeholder action: show a subtle animation; actual submit handled elsewhere
                  }}
                >
                  Join the waitlist
                </motion.button>
              </form>

              <div className="mt-8 grid gap-3 rounded-3xl bg-slate-100 p-5 text-sm text-slate-600">
                <p className="font-medium text-slate-800">What you get</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                      <Check size={14} />
                    </span>
                    Exclusive first-look access to new listings.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                      <Check size={14} />
                    </span>
                    Personalized property recommendations.
                  </li>
                </ul>
              </div>

              <p className="mt-6 text-xs text-slate-500">
                We respect your privacy. No spam, only the best listings and
                launch alerts.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">
              Why join the waitlist?
            </h2>
            <p className="mt-4 text-slate-600 leading-7">
              Keyz Estate helps you secure high-value real estate with expert
              guidance, insider access, and curated property discoveries.
              Joining the waitlist means you don&apos;t miss the next premium
              launch.
            </p>
            <div className="mt-8 grid gap-5">
              {perks.map((perk) => {
                const Icon = perk.icon;
                return (
                  <div key={perk.title} className="flex gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary text-white">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {perk.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {perk.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="rounded-3xl bg-primary-dark p-8 text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-accent">
                Early access
              </p>
              <h2 className="mt-4 text-3xl font-semibold">
                Reserve your place for the next premium release.
              </h2>
              <p className="mt-4 text-slate-100 leading-7">
                Receive curated listing previews and one-on-one support from our
                team, before they appear on the open market.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Trusted clients
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  1,200+
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Premium launches
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <Link
          href="/marketing"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-accent hover:text-accent"
        >
          Back to marketing page
        </Link>
      </div>

      <Footer />
    </main>
  );
}
