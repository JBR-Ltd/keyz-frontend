"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  MapPin,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { utilityCardVariants } from "@/components/ui/utility-card";

// === Types

type DashboardState = "empty" | "loading" | "populated";
type ListingStatus = "Occupied" | "Pending review" | "Published";
type BookingStatus = "Confirmed" | "New request";

interface SummaryItem {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: "accent" | "neutral" | "primary";
  value: number | string;
}

interface AttentionItem {
  actionLabel: string;
  description: string;
  href: string;
  icon: LucideIcon;
  id: string;
  title: string;
  tone: "accent" | "danger" | "primary";
}

interface AgentProperty {
  address: string;
  id: number;
  imageUrl: string;
  monthlyRent: number;
  status: ListingStatus;
  tenant: string | null;
  title: string;
}

interface AgentBooking {
  date: string;
  id: number;
  property: string;
  status: BookingStatus;
  tenant: string;
}

interface UpcomingActivity {
  date: string;
  detail: string;
  id: string;
  title: string;
}

// === Constants

const SUMMARY_ITEMS: SummaryItem[] = [
  {
    detail: "Published and visible",
    icon: Building2,
    label: "Active listings",
    tone: "primary",
    value: "08",
  },
  {
    detail: "Waiting for your response",
    icon: FileCheck2,
    label: "Tenancy requests",
    tone: "accent",
    value: "03",
  },
  {
    detail: "Across managed homes",
    icon: UsersRound,
    label: "Occupied homes",
    tone: "neutral",
    value: "05",
  },
  {
    detail: "From active tenancies",
    icon: CircleDollarSign,
    label: "Expected monthly rent",
    tone: "primary",
    value: 4850000,
  },
];

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    actionLabel: "Review requests",
    description: "Three tenants are waiting for a response on two homes.",
    href: "/agent/bookings",
    icon: FileCheck2,
    id: "booking-requests",
    title: "New tenancy requests",
    tone: "accent",
  },
  {
    actionLabel: "Review listing",
    description: "Complete the property verification details before publishing.",
    href: "/agent/saved-listings",
    icon: ShieldCheck,
    id: "property-verification",
    title: "One listing needs verification",
    tone: "danger",
  },
  {
    actionLabel: "View tenancy",
    description: "A tenant is scheduled to move in within the next seven days.",
    href: "/agent/bookings",
    icon: CalendarCheck2,
    id: "move-in",
    title: "Upcoming move-in",
    tone: "primary",
  },
];

const PROPERTIES: AgentProperty[] = [
  {
    address: "Lekki Phase 1, Lagos",
    id: 601,
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 1200000,
    status: "Occupied",
    tenant: "Kelechi Eze",
    title: "Lekki Garden Maisonette",
  },
  {
    address: "Maitama, Abuja",
    id: 602,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 950000,
    status: "Published",
    tenant: null,
    title: "Maitama Park Apartment",
  },
  {
    address: "Victoria Island, Lagos",
    id: 603,
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 1750000,
    status: "Pending review",
    tenant: null,
    title: "Harbour View Residence",
  },
];

const BOOKINGS: AgentBooking[] = [
  {
    date: "8 Sep 2026",
    id: 701,
    property: "Maitama Park Apartment",
    status: "New request",
    tenant: "Ada Nwosu",
  },
  {
    date: "12 Sep 2026",
    id: 702,
    property: "Lekki Garden Maisonette",
    status: "Confirmed",
    tenant: "Kelechi Eze",
  },
  {
    date: "18 Sep 2026",
    id: 703,
    property: "Harbour View Residence",
    status: "New request",
    tenant: "Tolu Martins",
  },
];

const UPCOMING_ACTIVITY: UpcomingActivity[] = [
  {
    date: "12 Sep",
    detail: "Lekki Garden Maisonette",
    id: "move-in-kelechi",
    title: "Kelechi moves in",
  },
  {
    date: "16 Sep",
    detail: "Maitama Park Apartment",
    id: "viewing-ada",
    title: "Virtual viewing with Ada",
  },
  {
    date: "30 Sep",
    detail: "Harbour View Residence",
    id: "listing-review",
    title: "Listing review due",
  },
];

const ATTENTION_TONES: Record<AttentionItem["tone"], string> = {
  accent: "bg-accent/10 text-accent-alt",
  danger: "bg-red-700/10 text-red-700",
  primary: "bg-primary/5 text-primary",
};

const LISTING_TONES: Record<
  ListingStatus,
  "accent" | "danger" | "primary"
> = {
  Occupied: "primary",
  "Pending review": "danger",
  Published: "accent",
};

// === Helpers

function subscribeToDashboardState(): () => void {
  return () => undefined;
}

function getDashboardState(): DashboardState {
  const requestedState = new URLSearchParams(window.location.search).get(
    "state",
  );

  return requestedState === "empty" || requestedState === "loading"
    ? requestedState
    : "populated";
}

function getServerDashboardState(): DashboardState {
  return "populated";
}

// === Components

function DashboardSkeleton(): ReactElement {
  return (
    <div
      className="animate-pulse space-y-7 motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Loading agent dashboard"
    >
      <div className="flex items-end justify-between gap-6">
        <div className="h-12 w-72 max-w-full rounded-lg bg-primary/10" />
        <div className="hidden h-12 w-36 rounded-full bg-primary/10 sm:block" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-40 rounded-lg bg-primary/5" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
        <div className="h-80 rounded-lg bg-primary/5" />
        <div className="h-80 rounded-lg bg-primary/5" />
      </div>
      <div className="h-96 rounded-lg bg-primary/5" />
    </div>
  );
}

function EmptyDashboard(): ReactElement {
  return (
    <section className="grid min-h-[65vh] place-items-center rounded-lg bg-surface-soft px-6 py-16 text-center shadow-sm">
      <div className="max-w-xl">
        <IconTile
          size="lg"
          shape="circle"
          tone="accent"
          className="mx-auto h-20 w-20"
        >
          <Building2 size={64} />
        </IconTile>
        <p className="mt-6 font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
          Build your portfolio
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
          Add your first managed home.
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base leading-7 text-muted">
          Create a rental listing, verify the property, and start receiving
          tenant requests from one place.
        </p>
        <Link
          href="/agent/listings/create"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-body text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Plus size={18} />
          Add a property
        </Link>
      </div>
    </section>
  );
}

function SummaryGrid(): ReactElement {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Portfolio summary"
    >
      {SUMMARY_ITEMS.map(({ detail, icon: Icon, label, tone, value }) => (
        <article
          key={label}
          className={utilityCardVariants({
            interactive: true,
            tone:
              tone === "accent"
                ? "accentTint"
                : tone === "primary"
                  ? "primaryTint"
                  : "soft",
          })}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {label}
              </p>
              <p className="mt-4 font-display text-3xl font-bold leading-none text-primary">
                {typeof value === "number" ? (
                  <PropertyPrice value={value} />
                ) : (
                  value
                )}
              </p>
            </div>
            <IconTile tone={tone}>
              <Icon size={21} />
            </IconTile>
          </div>
          <p className="mt-5 font-body text-sm text-muted">{detail}</p>
        </article>
      ))}
    </section>
  );
}

function AttentionPanel(): ReactElement {
  return (
    <section className="rounded-lg bg-bg p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
            Priority queue
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary">
            Needs attention
          </h2>
        </div>
        <StatusBadge tone="danger">3 actions</StatusBadge>
      </div>

      <div className="mt-5 divide-y divide-primary/10">
        {ATTENTION_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.id}
              className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${ATTENTION_TONES[item.tone]}`}
              >
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-body text-sm font-bold text-primary">
                  {item.title}
                </h3>
                <p className="mt-1 font-body text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </div>
              <Link
                href={item.href}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start rounded-full px-1 font-body text-sm font-bold text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:self-auto"
              >
                {item.actionLabel}
                <ArrowRight size={16} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function UpcomingPanel(): ReactElement {
  return (
    <section className="rounded-lg bg-surface-soft p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
            Schedule
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary">
            Coming up
          </h2>
        </div>
        <IconTile tone="primary">
          <CalendarCheck2 size={20} />
        </IconTile>
      </div>

      <ol className="mt-6 space-y-5">
        {UPCOMING_ACTIVITY.map((activity) => (
          <li key={activity.id} className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-bg text-center shadow-sm">
              <span className="font-body text-[10px] font-bold uppercase tracking-wide text-muted">
                {activity.date.split(" ")[1]}
              </span>
              <span className="font-display text-lg font-bold leading-none text-primary">
                {activity.date.split(" ")[0]}
              </span>
            </div>
            <div className="min-w-0 pt-1">
              <p className="font-body text-sm font-bold text-primary">
                {activity.title}
              </p>
              <p className="mt-1 truncate font-body text-xs text-muted">
                {activity.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PropertiesPanel(): ReactElement {
  return (
    <section className="mt-7 overflow-hidden rounded-lg bg-bg shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
            Managed portfolio
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary">
            Properties
          </h2>
        </div>
        <Link
          href="/agent/saved-listings"
          className="inline-flex min-h-10 items-center gap-2 self-start font-body text-sm font-bold text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:self-auto"
        >
          View all listings
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="hidden border-y border-primary/10 bg-surface-soft px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[0.14em] text-muted md:grid md:grid-cols-[minmax(16rem,1.6fr)_minmax(8rem,0.7fr)_minmax(8rem,0.7fr)_minmax(9rem,0.7fr)_2rem] md:gap-5">
        <span>Property</span>
        <span>Monthly rent</span>
        <span>Occupancy</span>
        <span>Status</span>
        <span className="sr-only">Actions</span>
      </div>

      <div className="divide-y divide-primary/10">
        {PROPERTIES.map((property) => (
          <article
            key={property.id}
            className="grid gap-4 p-5 transition-colors hover:bg-surface-soft md:grid-cols-[minmax(16rem,1.6fr)_minmax(8rem,0.7fr)_minmax(8rem,0.7fr)_minmax(9rem,0.7fr)_2rem] md:items-center md:gap-5 md:px-6"
          >
            <div className="flex min-w-0 items-center gap-4">
              <Image
                src={property.imageUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <h3 className="truncate font-body text-sm font-bold text-primary">
                  {property.title}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 truncate font-body text-xs text-muted">
                  <MapPin size={13} className="shrink-0" />
                  {property.address}
                </p>
              </div>
            </div>
            <div>
              <p className="font-body text-[11px] font-bold uppercase tracking-wide text-muted md:hidden">
                Monthly rent
              </p>
              <p className="mt-1 font-body text-sm font-bold text-primary md:mt-0">
                <PropertyPrice value={property.monthlyRent} />
              </p>
            </div>
            <div>
              <p className="font-body text-[11px] font-bold uppercase tracking-wide text-muted md:hidden">
                Occupancy
              </p>
              <p className="mt-1 font-body text-sm text-primary md:mt-0">
                {property.tenant ?? "Available"}
              </p>
            </div>
            <div>
              <StatusBadge tone={LISTING_TONES[property.status]}>
                {property.status}
              </StatusBadge>
            </div>
            <Link
              href="/agent/saved-listings"
              aria-label={`Manage ${property.title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <MoreHorizontal size={19} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function BookingsPanel(): ReactElement {
  return (
    <section className="mt-7 rounded-lg bg-bg p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
            Tenant activity
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary">
            Recent tenancy activity
          </h2>
        </div>
        <Link
          href="/agent/bookings"
          className="inline-flex min-h-10 items-center gap-2 font-body text-sm font-bold text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View all
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {BOOKINGS.map((booking) => (
          <article
            key={booking.id}
            className="rounded-lg bg-surface-soft p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <IconTile
                tone={booking.status === "New request" ? "accent" : "primary"}
              >
                {booking.status === "New request" ? (
                  <Clock3 size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                )}
              </IconTile>
              <StatusBadge
                tone={booking.status === "New request" ? "accent" : "primary"}
                size="sm"
              >
                {booking.status}
              </StatusBadge>
            </div>
            <h3 className="mt-4 font-body text-sm font-bold text-primary">
              {booking.tenant}
            </h3>
            <p className="mt-1 truncate font-body text-sm text-muted">
              {booking.property}
            </p>
            <p className="mt-4 font-body text-xs font-medium text-muted">
              {booking.date}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AgentDashboardPage(): ReactElement {
  const reduceMotion = useReducedMotion();
  const dashboardState = useSyncExternalStore(
    subscribeToDashboardState,
    getDashboardState,
    getServerDashboardState,
  );

  if (dashboardState === "loading") {
    return (
      <main className="min-h-screen px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
        <DashboardSkeleton />
      </main>
    );
  }

  if (dashboardState === "empty") {
    return (
      <main className="min-h-screen px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
        <EmptyDashboard />
      </main>
    );
  }

  return (
    <motion.main
      className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <header className="flex flex-col gap-6 pb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-body text-sm font-medium text-muted">
            Tuesday, 8 September
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-[0.95] text-primary sm:text-5xl">
            Good morning, Tomi.
          </h1>
        </div>
        <Link
          href="/agent/listings/create"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-primary px-6 font-body text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:self-auto"
        >
          <Plus size={18} />
          Add a property
        </Link>
      </header>

      <SummaryGrid />

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
        <AttentionPanel />
        <UpcomingPanel />
      </div>

      <PropertiesPanel />
      <BookingsPanel />
    </motion.main>
  );
}
