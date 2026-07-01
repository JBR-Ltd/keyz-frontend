"use client";

import type { ReactElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bath,
  Bed,
  Home,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const heroImage = {
  src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=900&fit=crop&auto=format&q=80",
  alt: "Modern property exterior with a bright entryway",
};

const cityCards = [
  {
    city: "Lagos",
    listingCount: "840+ listings",
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=600&fit=crop&auto=format&q=80",
    alt: "Lagos cityscape",
  },
  {
    city: "Abuja",
    listingCount: "620+ listings",
    imageUrl: "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=800&h=600&fit=crop&auto=format&q=80",
    alt: "Modern Abuja city skyline",
  },
  {
    city: "Port Harcourt",
    listingCount: "310+ listings",
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&auto=format&q=80",
    alt: "Urban Port Harcourt cityscape",
  },
];

const properties = [
  {
    name: "Ikoyi Garden Residence",
    location: "Ikoyi, Lagos",
    price: 150000,
    beds: 3,
    baths: 3,
    imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&auto=format&q=80",
    alt: "Luxury apartment interior",
  },
  {
    name: "Maitama City Apartment",
    location: "Maitama, Abuja",
    price: 220000,
    beds: 4,
    baths: 4,
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80",
    alt: "Modern apartment living room",
  },
  {
    name: "Lekki Contemporary Home",
    location: "Lekki Phase 1, Lagos",
    price: 95000,
    beds: 2,
    baths: 2,
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&auto=format&q=80",
    alt: "Contemporary home interior",
  },
  {
    name: "GRA Family Duplex",
    location: "GRA, Port Harcourt",
    price: 180000,
    beds: 4,
    baths: 3,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format&q=80",
    alt: "Luxury property exterior",
  },
];

const stats = [
  { value: "2,400+", label: "Listings" },
  { value: "3", label: "Cities" },
  { value: "100%", label: "Verified" },
  { value: "₦0", label: "Agent Fees" },
];

const trustItems = ["Verified listings", "Zero agent fees", "Secure escrow"];

const bentoCells = [
  {
    title: "Verified Listings",
    description: "Every property on Rello is manually verified before it goes live. No fake listings, no surprises.",
    className: "bg-primary text-white lg:col-span-2",
    Icon: ShieldCheck,
    iconClassName: "text-accent",
    titleClassName: "text-white",
    descriptionClassName: "text-white/70",
  },
  {
    title: "Zero Agent Fees",
    description: "Pay the landlord, not the middleman.",
    className: "bg-accent text-white",
    value: "₦0",
    titleClassName: "text-white",
    descriptionClassName: "text-white/80",
  },
  {
    title: "Secure Escrow",
    description: "Your payment is held safely until you move in.",
    className: "border border-surface bg-[var(--color-bg)] text-primary",
    Icon: Lock,
    iconClassName: "text-primary",
    titleClassName: "text-primary",
    descriptionClassName: "text-muted",
  },
  {
    title: "3 Cities and growing",
    description: "Covering Nigeria's biggest rental markets with more cities coming soon.",
    className: "border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-bg))] text-primary lg:col-span-2",
    value: "Lagos · Abuja · PH",
    titleClassName: "text-primary",
    descriptionClassName: "text-muted",
  },
  {
    title: "Average response time: under 2 hours",
    description: "Landlords on Rello respond fast. No more waiting days to hear back on a viewing.",
    className: "border border-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-bg))] text-primary lg:col-span-2",
    value: "< 2hrs",
    titleClassName: "text-accent",
    descriptionClassName: "text-muted",
  },
  {
    title: "Direct Landlord Contact",
    description: "Send viewing requests without chasing multiple agents or losing track of conversations.",
    className: "border border-surface bg-[var(--color-bg)] text-primary",
    Icon: Home,
    iconClassName: "text-accent",
    titleClassName: "text-primary",
    descriptionClassName: "text-muted",
  },
];

function formatPrice(value: number): string {
  return `₦${value.toLocaleString("en-NG")}/mo`;
}

function reveal(index = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, ease: "easeOut" as const, delay: index * 0.1 },
  };
}

export default function MarketingLandingPage(): ReactElement {
  const reduceMotion = useReducedMotion();
  const animation = reduceMotion ? false : undefined;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-primary">
      <Navbar />

      <section className="grid min-h-screen overflow-hidden bg-primary lg:grid-cols-[55fr_45fr]">
        <div className="flex min-h-screen items-center px-6 py-28 text-center sm:px-10 lg:px-16 lg:text-left">
          <div className="mx-auto max-w-xl lg:mx-0">
            <motion.p
              className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent"
              initial={animation ?? { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            >
              Nigeria&apos;s #1 Rental Platform
            </motion.p>
            <motion.h1
              className="mt-4 font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl"
              initial={animation ?? { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            >
              Find your perfect home.
            </motion.h1>
            <motion.p
              className="mx-auto mt-4 max-w-md font-body text-lg leading-8 text-white/70 lg:mx-0"
              initial={animation ?? { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            >
              Verified listings across Lagos, Abuja, and Port Harcourt. No hidden fees, no agent stress.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start"
              initial={animation ?? { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
            >
              <Link
                href="#featured-properties"
                className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 font-body text-base font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.03] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Browse Listings
              </Link>
              <Link
                href="/waitlist"
                className="inline-flex items-center justify-center rounded-full border border-white px-8 py-4 font-body text-base font-medium text-white transition-all duration-200 ease-in-out hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                List your property →
              </Link>
            </motion.div>
            <motion.div
              className="mt-8 flex flex-col gap-3 font-body text-sm text-white/80 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 lg:justify-start"
              initial={animation ?? { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
            >
              {trustItems.map((item) => (
                <span key={item} className="inline-flex items-center justify-center gap-2 lg:justify-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ✓ {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        <motion.div
          className="relative hidden h-screen min-h-screen w-full overflow-hidden lg:block"
          initial={animation ?? { opacity: 0, scale: 1.02 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            unoptimized
            sizes="45vw"
            className="object-cover"
            style={{ objectFit: "cover" }}
          />
          <div className="absolute inset-y-0 left-0 w-24 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_40%,transparent),transparent)]" />
          <motion.div
            className="absolute bottom-8 left-8 rounded-2xl bg-white px-4 py-3 font-body text-sm font-bold text-primary shadow-xl"
            initial={animation ?? { opacity: 0, y: 14 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.8 }}
          >
            🏠 2,400+ Verified Listings
          </motion.div>
        </motion.div>
      </section>

      <section className="bg-accent px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className={`text-center ${index > 0 ? "lg:border-l lg:border-white/30" : ""}`}
              {...(reduceMotion ? {} : reveal(index))}
            >
              <p className="font-display text-4xl font-bold text-white">{stat.value}</p>
              <p className="mt-2 font-body text-sm uppercase tracking-wide text-white/80">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="cities" className="bg-[var(--color-bg)] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div {...(reduceMotion ? {} : reveal())}>
            <p className="font-accent text-xs font-bold uppercase tracking-widest text-accent">Explore by city</p>
            <h2 className="mb-12 mt-2 font-display text-4xl font-bold text-primary">Where do you want to live?</h2>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-3">
            {cityCards.map((city, index) => (
              <motion.article
                key={city.city}
                className="group relative h-80 cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-2xl"
                {...(reduceMotion ? {} : reveal(index))}
              >
                <Image
                  src={city.imageUrl}
                  alt={city.alt}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="transition-all duration-300 ease-in-out group-hover:scale-[1.08]"
                  style={{ objectFit: "cover" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="font-display text-3xl font-bold text-white">{city.city}</h3>
                  <p className="mt-1 font-body text-sm text-white/80">{city.listingCount}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="featured-properties" className="bg-primary px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div {...(reduceMotion ? {} : reveal())}>
            <p className="font-accent text-xs font-bold uppercase tracking-widest text-accent">Featured Homes</p>
            <h2 className="mb-12 mt-2 font-display text-4xl font-bold text-white">Handpicked for you.</h2>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-2">
            {properties.map((property, index) => (
              <motion.article
                key={property.name}
                className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-200 ease-in-out hover:-translate-y-1.5 hover:shadow-2xl"
                {...(reduceMotion ? {} : reveal(index))}
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={property.imageUrl}
                    alt={property.alt}
                    fill
                    className="transition-all duration-500 group-hover:scale-[1.05]"
                    style={{ objectFit: "cover" }}
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-body text-xs font-medium text-white">
                    <ShieldCheck size={14} aria-hidden="true" />
                    Verified
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-primary">{property.name}</h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 font-body text-sm text-muted">
                    <MapPin size={15} className="text-accent" aria-hidden="true" />
                    {property.location}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="font-body font-bold text-primary">{formatPrice(property.price)}</p>
                    <p className="flex items-center gap-3 font-body text-sm text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Bed size={15} aria-hidden="true" />
                        {property.beds}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bath size={15} aria-hidden="true" />
                        {property.baths}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-rello" className="bg-[var(--color-bg)] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div {...(reduceMotion ? {} : reveal())}>
            <p className="font-accent text-xs font-bold uppercase tracking-widest text-accent">Why Rello</p>
            <h2 className="mb-12 mt-2 font-display text-4xl font-bold text-primary">Renting, reimagined.</h2>
          </motion.div>
          <div className="grid auto-rows-[minmax(13rem,auto)] gap-4 lg:grid-cols-3">
            {bentoCells.map((cell, index) => {
              const Icon = cell.Icon;

              return (
                <motion.article
                  key={cell.title}
                  className={`rounded-2xl p-8 transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-xl ${cell.className}`}
                  {...(reduceMotion ? {} : reveal(index * 0.8))}
                >
                  {cell.value ? (
                    <p className={`font-display text-5xl font-bold leading-tight ${cell.titleClassName}`}>{cell.value}</p>
                  ) : null}
                  {Icon ? <Icon className={`h-10 w-10 ${cell.iconClassName}`} aria-hidden="true" /> : null}
                  <h3 className={`mt-4 font-display text-2xl font-bold ${cell.titleClassName}`}>{cell.title}</h3>
                  <p className={`mt-2 font-body text-sm leading-6 ${cell.descriptionClassName}`}>{cell.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-accent px-4 py-32 text-center sm:px-6 lg:px-8">
        <motion.div className="mx-auto max-w-3xl" {...(reduceMotion ? {} : reveal())}>
          <h2 className="font-display text-5xl font-bold leading-tight text-primary">Your next home is waiting.</h2>
          <p className="mt-4 font-body text-lg text-[color-mix(in_srgb,var(--color-primary)_80%,transparent)]">
            Join thousands of Nigerians finding verified homes without the stress.
          </p>
          <Link
            href="/waitlist"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-10 py-4 font-display text-lg font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-[color-mix(in_srgb,var(--color-primary)_90%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            Join the waitlist
          </Link>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
