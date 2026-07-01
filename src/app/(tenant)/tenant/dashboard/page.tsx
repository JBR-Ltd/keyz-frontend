"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  CalendarCheck,
  Clock3,
  Landmark,
  MapPin,
  MessageSquareText,
  WalletCards,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Booking {
  title: string;
  location: string;
  status: "Escrow Held" | "Upcoming" | "Confirmed";
  dates: string;
  price: string;
  image: string;
}

const STATS = [
  {
    label: "Active Bookings",
    value: "03",
    trend: "+1 this month",
    direction: "up",
    icon: CalendarCheck,
    tone: "bg-primary/5",
    tile: "bg-primary text-white",
  },
  {
    label: "Incoming Requests",
    value: "05",
    trend: "+12% this week",
    direction: "up",
    icon: MessageSquareText,
    tone: "bg-primary/5",
    tile: "bg-primary/10 text-primary",
  },
  {
    label: "Escrow Held",
    value: "₦1.2m",
    trend: "No change",
    direction: "down",
    icon: Landmark,
    tone: "bg-surface-soft",
    tile: "bg-primary text-white",
  },
  {
    label: "Saved Listings",
    value: "12",
    trend: "+3 this week",
    direction: "up",
    icon: Bookmark,
    tone: "bg-[var(--color-bg)]",
    tile: "bg-primary/10 text-primary",
  },
];

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&auto=format&q=80",
];

const BOOKINGS: Booking[] = [
  {
    title: "The Glass House, Lekki",
    location: "Lekki Phase 1, Lagos",
    status: "Escrow Held",
    dates: "Jul 04 to Jul 18",
    price: "₦480,000",
    image: PROPERTY_IMAGES[0],
  },
  {
    title: "Maitama Courtyard",
    location: "Maitama, Abuja",
    status: "Upcoming",
    dates: "Jul 22 to Aug 05",
    price: "₦620,000",
    image: PROPERTY_IMAGES[1],
  },
  {
    title: "Harbour View Residence",
    location: "Victoria Island, Lagos",
    status: "Confirmed",
    dates: "Aug 14 to Aug 28",
    price: "₦710,000",
    image: PROPERTY_IMAGES[2],
  },
];

const ACTIVITIES = [
  {
    title: "Escrow funded",
    description: "Payment secured for The Glass House.",
    time: "18 minutes ago",
    icon: WalletCards,
    tone: "bg-primary text-white",
  },
  {
    title: "Viewing confirmed",
    description: "Your Maitama Courtyard viewing is booked.",
    time: "2 hours ago",
    icon: CalendarCheck,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Host replied",
    description: "A new message is waiting in your booking.",
    time: "Yesterday",
    icon: MessageSquareText,
    tone: "bg-surface-soft text-primary",
  },
];

const STATUS_STYLES: Record<Booking["status"], string> = {
  "Escrow Held": "bg-primary text-white",
  Upcoming: "bg-primary/10 text-primary",
  Confirmed: "border border-primary/20 bg-surface-soft text-primary",
};

export default function TenantDashboardPage() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.main
      className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Your rental desk
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Tenant Dashboard
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Welcome back, Jemimah! Here&apos;s what&apos;s happening with your
          bookings.
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(({ label, value, trend, direction, icon: Icon, tone, tile }) => {
          const TrendIcon = direction === "up" ? ArrowUpRight : ArrowDownRight;

          return (
            <article
              key={label}
              className={`min-w-0 rounded-lg border border-primary/15 p-5 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md ${tone}`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tile}`}>
                <Icon size={22} />
              </div>
              <p className="mt-2 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {label}
              </p>
              <p className="mt-4 break-words font-display text-3xl font-bold leading-none text-primary">
                {value}
              </p>
              <p className={`mt-4 flex items-center gap-2 font-body text-xs font-bold ${direction === "up" ? "text-accent-alt" : "text-muted"}`}>
                <TrendIcon size={15} />
                {trend}
              </p>
            </article>
          );
        })}
      </section>

      <div className="mt-10 grid gap-7 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-primary/15 bg-[var(--color-bg)] shadow-sm">
          <div className="flex items-end justify-between gap-5 border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
                Next stays
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary">
                Upcoming Bookings
              </h2>
            </div>
            <Link
              href="/tenant/bookings"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-primary/30 px-5 py-2 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              View all
            </Link>
          </div>

          <div>
            {BOOKINGS.map((booking) => (
              <article
                key={booking.title}
                className="grid gap-4 border-b border-primary/15 p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:grid-cols-[8rem_1fr] sm:items-center sm:p-6"
              >
                <div className="relative h-28 overflow-hidden rounded-lg bg-surface-soft sm:w-full">
                  <Image
                    src={booking.image}
                    alt={booking.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover transition-all duration-200 ease-in-out"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-body text-lg font-bold text-primary">
                        {booking.title}
                      </h3>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                        <MapPin size={15} className="shrink-0 text-primary/60" />
                        {booking.location}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 font-body text-xs font-medium ${STATUS_STYLES[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 font-body text-sm text-muted">
                      <Clock3 size={15} className="shrink-0 text-primary/60" />
                      <span>{booking.dates}</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-primary">
                      {booking.price}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="self-start overflow-hidden rounded-lg border border-primary/15 bg-[var(--color-bg)] shadow-sm">
          <div className="border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent">
              Timeline
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary">
              Recent Activity
            </h2>
          </div>
          <div>
            {ACTIVITIES.map(({ title, description, time, icon: Icon, tone }) => (
              <article
                key={title}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-primary/15 p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:p-6"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-body text-sm font-bold text-primary">
                    {title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-6 text-muted">
                    {description}
                  </p>
                  <p className="mt-3 font-body text-xs font-medium uppercase tracking-[0.12em] text-accent-alt">
                    {time}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </motion.main>
  );
}
