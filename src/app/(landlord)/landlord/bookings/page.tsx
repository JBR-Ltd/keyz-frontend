import type { ReactElement } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  Clock3,
  FileCheck2,
  KeyRound,
  MapPin,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { utilityCardVariants } from "@/components/ui/utility-card";

const BOOKING_STATS = [
  {
    label: "Active stays",
    value: "06",
    trend: "Two handovers this week",
    icon: KeyRound,
    tone: "default" as const,
    tile: "primary" as const,
  },
  {
    label: "Pending requests",
    value: "05",
    trend: "Three need a response",
    icon: FileCheck2,
    tone: "accentTint" as const,
    tile: "accent" as const,
  },
  {
    label: "Expected income",
    value: 4250000,
    trend: "12% above last month",
    icon: ArrowUpRight,
    tone: "primaryTint" as const,
    tile: "primary" as const,
  },
  {
    label: "Upcoming handovers",
    value: "02",
    trend: "Next handover on Aug 02",
    icon: CalendarCheck,
    tone: "soft" as const,
    tile: "neutral" as const,
  },
];

const BOOKING_REQUESTS = [
  {
    id: "REQ-2048",
    property: "Lekki Garden Maisonette",
    location: "Lekki Phase 1, Lagos",
    tenant: "Ada Nwosu",
    dates: "Aug 02 to Aug 16",
    amount: 750000,
    status: "Pending",
    statusTone: "accent" as const,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&h=360&fit=crop&auto=format&q=80",
  },
  {
    id: "REQ-2039",
    property: "Ikoyi Waterfront Flat",
    location: "Ikoyi, Lagos",
    tenant: "Femi Balogun",
    dates: "Aug 18 to Sep 18",
    amount: 1200000,
    status: "Accepted",
    statusTone: "primary" as const,
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=360&fit=crop&auto=format&q=80",
  },
  {
    id: "REQ-2027",
    property: "Maitama Serviced Duplex",
    location: "Maitama, Abuja",
    tenant: "Zainab Musa",
    dates: "Sep 01 to Dec 01",
    amount: 950000,
    status: "Screening",
    statusTone: "neutral" as const,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=360&fit=crop&auto=format&q=80",
  },
];

const BOOKING_TIMELINE = [
  {
    title: "Request received",
    description: "Ada requested a two-week stay at Lekki Garden Maisonette.",
    time: "12 minutes ago",
    icon: FileCheck2,
  },
  {
    title: "Handover confirmed",
    description: "Keys for Ikoyi Waterfront Flat are ready for collection.",
    time: "2 hours ago",
    icon: KeyRound,
  },
  {
    title: "Tenant screening",
    description: "Identity checks started for the Maitama booking request.",
    time: "Yesterday",
    icon: UsersRound,
  },
];

export default function LandlordBookingsPage(): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Your hosting desk
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Bookings
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Review incoming requests, coordinate handovers, and follow every
          active stay from one workspace.
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {BOOKING_STATS.map(
          ({ label, value, trend, icon: Icon, tone, tile }) => (
            <article
              key={label}
              className={utilityCardVariants({ tone, interactive: true })}
            >
              <IconTile tone={tile}>
                <Icon size={22} />
              </IconTile>
              <p className="mt-2 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {label}
              </p>
              <p className="mt-4 break-words font-display text-3xl font-bold leading-none text-primary">
                {typeof value === "number" ? (
                  <PropertyPrice value={value} />
                ) : (
                  value
                )}
              </p>
              <p className="mt-4 font-body text-xs font-bold text-primary">
                {trend}
              </p>
            </article>
          ),
        )}
      </section>

      <section className="mt-10 min-w-0 overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Booking pipeline
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary">
            Requests and active stays
          </h2>
        </div>

        {BOOKING_REQUESTS.map((request) => (
          <article
            key={request.id}
            className="grid gap-4 border-b border-border p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:grid-cols-[8rem_1fr] sm:items-center sm:p-6"
          >
            <div className="relative h-28 overflow-hidden rounded-lg bg-surface-soft sm:w-full">
              <Image
                src={request.image}
                alt={request.property}
                fill
                sizes="(max-width: 640px) 100vw, 128px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="primary">{request.id}</StatusBadge>
                    <h3 className="font-body text-lg font-bold text-primary">
                      {request.property}
                    </h3>
                  </div>
                  <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                    <MapPin size={15} className="shrink-0 text-primary/60" />
                    {request.location}
                  </p>
                </div>
                <StatusBadge tone={request.statusTone}>
                  {request.status}
                </StatusBadge>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-sm text-muted">
                  <span className="flex items-center gap-2">
                    <UsersRound size={15} className="text-primary/60" />
                    {request.tenant}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 size={15} className="text-primary/60" />
                    {request.dates}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`Message ${request.tenant}`}
                  >
                    <MessageCircle size={18} />
                  </button>
                  <p className="font-display text-2xl font-bold text-primary">
                    <PropertyPrice value={request.amount} />
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Timeline
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary">
            Recent activity
          </h2>
        </div>
        <div className="grid md:grid-cols-3">
          {BOOKING_TIMELINE.map(({ title, description, time, icon: Icon }) => (
            <article
              key={title}
              className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:p-6 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <IconTile tone="accent" size="lg" shape="circle">
                <Icon size={20} />
              </IconTile>
              <div className="min-w-0">
                <h3 className="font-body text-sm font-bold text-primary">
                  {title}
                </h3>
                <p className="mt-2 font-body text-sm leading-6 text-muted">
                  {description}
                </p>
                <p className="mt-3 font-body text-xs font-medium uppercase tracking-[0.12em] text-primary">
                  {time}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
