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
  ImageOff,
  MapPin,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { utilityCardVariants } from "@/components/ui/utility-card";
import { useAuthenticatedUser } from "@/lib/account";
import { getHostBookings, type Booking, type BookingStatus } from "@/lib/bookings";
import {
  getPropertyPortfolio,
  type BackendProperty,
  type PropertyPortfolio,
  type RentalMode,
} from "@/lib/hostListings";
import { useHostVerification } from "@/lib/hostVerification";
import { getHostViewings, type Viewing } from "@/lib/viewings";

// === Types

type ListingStatus = "Occupied" | "Pending review" | "Published";

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
  imageUrl: string | null;
  price: number;
  /** What the price is per. A listing can be let nightly, monthly or yearly. */
  rentalMode: RentalMode;
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

interface DashboardData {
  attention: AttentionItem[];
  bookings: AgentBooking[];
  properties: AgentProperty[];
  summary: SummaryItem[];
  upcoming: UpcomingActivity[];
}

// === Constants

const ATTENTION_TONES: Record<AttentionItem["tone"], string> = {
  accent: "bg-accent/10 text-accent-alt",
  danger: "bg-red-700/10 text-red-700",
  primary: "bg-primary/5 text-primary",
};

const LISTING_TONES: Record<ListingStatus, "accent" | "danger" | "primary"> = {
  Occupied: "primary",
  "Pending review": "danger",
  Published: "accent",
};

/** Said next to a price, so a nightly listing never reads as a monthly one. */
const RENTAL_PERIOD_LABELS: Record<RentalMode, string> = {
  ANNUAL: "per year",
  MONTHLY: "per month",
  SHORT_STAY: "per night",
};

const BOOKING_LABELS: Record<BookingStatus, string> = {
  PENDING: "New request",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const BOOKING_TONES: Record<BookingStatus, "accent" | "neutral" | "primary"> = {
  PENDING: "accent",
  CONFIRMED: "primary",
  CANCELLED: "neutral",
  COMPLETED: "neutral",
};

/** A move-in inside this window is worth surfacing on the dashboard. */
const MOVE_IN_HORIZON_DAYS = 7;

const MAX_UPCOMING = 4;
const MAX_RECENT_BOOKINGS = 3;

// === Helpers

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function daysUntil(value: string): number {
  const start = toDate(value).getTime();
  const today = new Date().setHours(0, 0, 0, 0);

  return Math.round((start - today) / 86_400_000);
}

/** A tenancy that has started and has not ended yet. */
function isActiveTenancy(booking: Booking): boolean {
  const today = new Date().setHours(0, 0, 0, 0);

  return (
    booking.status === "CONFIRMED" &&
    toDate(booking.startDate).getTime() <= today &&
    toDate(booking.endDate).getTime() >= today
  );
}

function formatDay(value: string): string {
  return toDate(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function formatFullDate(value: Date): string {
  return value.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function greetingFor(hour: number): string {
  if (hour < 12) {
    return "Good morning";
  }

  return hour < 17 ? "Good afternoon" : "Good evening";
}

function toListingStatus(
  property: BackendProperty,
  occupiedIds: Set<number>,
): ListingStatus {
  if (!property.verified) {
    return "Pending review";
  }

  return occupiedIds.has(property.id) ? "Occupied" : "Published";
}

function buildSummary(
  portfolio: PropertyPortfolio,
  bookings: Booking[],
  occupiedIds: Set<number>,
): SummaryItem[] {
  const pendingCount = bookings.filter(
    (booking) => booking.status === "PENDING",
  ).length;

  return [
    {
      detail: "Published and visible",
      icon: Building2,
      label: "Active listings",
      tone: "primary",
      value: portfolio.activeListingsCount,
    },
    {
      detail: "Waiting for your response",
      icon: FileCheck2,
      label: "Tenancy requests",
      tone: "accent",
      value: pendingCount,
    },
    {
      detail: "Across managed homes",
      icon: UsersRound,
      label: "Occupied homes",
      tone: "neutral",
      value: occupiedIds.size,
    },
    {
      // Listings can be let nightly, monthly or yearly, so naming a period here
      // would be wrong for whichever modes the portfolio also holds
      detail: "Across active tenancies",
      icon: CircleDollarSign,
      label: "Expected rental income",
      tone: "primary",
      value: portfolio.expectedMonthlyRentalIncome,
    },
  ];
}

/**
 * Only surfaces items that are actually true right now. An empty list renders
 * nothing, which is the correct state for an agent with nothing outstanding.
 */
function buildAttention(
  portfolio: PropertyPortfolio,
  bookings: Booking[],
  pendingViewings: number,
  identityVerified: boolean,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const pending = bookings.filter((booking) => booking.status === "PENDING");
  const unverified = portfolio.properties.filter(
    (property) => !property.verified,
  );
  const imminentMoveIns = bookings.filter((booking) => {
    const days = daysUntil(booking.startDate);

    return (
      booking.status === "CONFIRMED" && days >= 0 && days <= MOVE_IN_HORIZON_DAYS
    );
  });

  if (!identityVerified) {
    items.push({
      actionLabel: "Finish verification",
      description:
        "Your listings stay unpublished until your identity is verified.",
      href: "/agent/verify",
      icon: ShieldCheck,
      id: "identity",
      title: "Verification incomplete",
      tone: "danger",
    });
  }

  if (pendingViewings > 0) {
    items.push({
      actionLabel: "Respond",
      description:
        pendingViewings === 1
          ? "Someone is waiting to be shown a home."
          : `${pendingViewings} people are waiting to be shown a home.`,
      href: "/agent/bookings",
      icon: CalendarCheck2,
      id: "viewing-requests",
      title: "Viewing requests",
      tone: "accent",
    });
  }

  if (pending.length > 0) {
    items.push({
      actionLabel: "Review requests",
      description:
        pending.length === 1
          ? "One tenant is waiting for a response."
          : `${pending.length} tenants are waiting for a response.`,
      href: "/agent/bookings",
      icon: FileCheck2,
      id: "booking-requests",
      title: "New tenancy requests",
      tone: "accent",
    });
  }

  if (unverified.length > 0) {
    items.push({
      actionLabel: "Review listing",
      description:
        "Take the property photo on site to finish verification and publish.",
      href: "/agent/saved-listings",
      icon: ShieldCheck,
      id: "property-verification",
      title:
        unverified.length === 1
          ? "One listing needs verification"
          : `${unverified.length} listings need verification`,
      tone: "danger",
    });
  }

  if (imminentMoveIns.length > 0) {
    items.push({
      actionLabel: "View tenancy",
      description: `${imminentMoveIns[0].tenant?.name ?? "A tenant"} moves into ${imminentMoveIns[0].propertyTitle} on ${formatDay(imminentMoveIns[0].startDate)}.`,
      href: "/agent/bookings",
      icon: CalendarCheck2,
      id: "move-in",
      title: "Upcoming move-in",
      tone: "primary",
    });
  }

  return items;
}

/**
 * Move-ins and confirmed viewings, interleaved by date.
 *
 * Both are things the agent has to turn up for, so they belong in one list rather
 * than two competing ones.
 */
function buildUpcoming(
  bookings: Booking[],
  viewings: Viewing[],
): UpcomingActivity[] {
  const moveIns = bookings
    .filter(
      (booking) =>
        booking.status === "CONFIRMED" && daysUntil(booking.startDate) >= 0,
    )
    .map((booking) => ({
      date: formatDay(booking.startDate),
      detail: booking.propertyTitle,
      id: `move-in-${booking.id}`,
      sortKey: booking.startDate,
      title: `${booking.tenant?.name ?? "Tenant"} moves in`,
    }));

  const scheduled = viewings
    .filter((viewing) => viewing.scheduledStartAt !== null)
    .map((viewing) => {
      const at = viewing.scheduledStartAt ?? viewing.proposedStartAt;

      return {
        date: formatDay(at.slice(0, 10)),
        detail: viewing.propertyTitle,
        id: `viewing-${viewing.id}`,
        sortKey: at,
        title: `${viewing.type === "VIRTUAL" ? "Video tour" : "Viewing"} with ${
          viewing.tenant?.name ?? "a tenant"
        }`,
      };
    })
    .filter((item) => daysUntil(item.sortKey.slice(0, 10)) >= 0);

  return [...moveIns, ...scheduled]
    .sort((first, second) => first.sortKey.localeCompare(second.sortKey))
    .slice(0, MAX_UPCOMING)
    .map(({ date, detail, id, title }) => ({ date, detail, id, title }));
}

function buildDashboard(
  portfolio: PropertyPortfolio,
  bookings: Booking[],
  viewings: Viewing[],
  identityVerified: boolean,
): DashboardData {
  const occupiedIds = new Set(
    bookings.filter(isActiveTenancy).map((booking) => booking.propertyId),
  );
  const tenantByProperty = new Map(
    bookings
      .filter(isActiveTenancy)
      .map((booking) => [booking.propertyId, booking.tenant?.name ?? "Tenant"]),
  );

  return {
    attention: buildAttention(
      portfolio,
      bookings,
      viewings.filter((viewing) => viewing.status === "PENDING").length,
      identityVerified,
    ),
    bookings: [...bookings]
      .sort((first, second) =>
        (second.createdAt ?? second.startDate).localeCompare(
          first.createdAt ?? first.startDate,
        ),
      )
      .slice(0, MAX_RECENT_BOOKINGS)
      .map((booking) => ({
        date: formatDay(booking.startDate),
        id: booking.id,
        property: booking.propertyTitle,
        status: booking.status,
        tenant: booking.tenant?.name ?? "Tenant",
      })),
    properties: portfolio.properties.map((property) => ({
      address: property.address,
      id: property.id,
      imageUrl: property.imageUrl ?? null,
      price: property.price,
      rentalMode: property.rentalMode ?? "ANNUAL",
      status: toListingStatus(property, occupiedIds),
      tenant: tenantByProperty.get(property.id) ?? null,
      title: property.title,
    })),
    summary: buildSummary(portfolio, bookings, occupiedIds),
    upcoming: buildUpcoming(bookings, viewings),
  };
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
        <h1 className="mt-8 font-display text-3xl font-bold text-primary sm:text-4xl">
          Your portfolio starts here.
        </h1>
        <p className="mt-4 font-body text-base leading-7 text-muted">
          Add your first property to start receiving tenancy requests from
          verified tenants.
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

function SummaryGrid({ items }: { items: SummaryItem[] }): ReactElement {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Portfolio summary"
    >
      {items.map(({ detail, icon: Icon, label, tone, value }) => (
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
                {label === "Expected rental income" ? (
                  <PropertyPrice value={Number(value)} />
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

function AttentionPanel({ items }: { items: AttentionItem[] }): ReactElement {
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
        {items.length > 0 ? (
          <StatusBadge tone="danger">
            {items.length === 1 ? "1 action" : `${items.length} actions`}
          </StatusBadge>
        ) : (
          <StatusBadge tone="primary">All clear</StatusBadge>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 font-body text-sm leading-6 text-muted">
          Nothing needs you right now. New tenancy requests will appear here.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-primary/10">
          {items.map((item) => {
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
      )}
    </section>
  );
}

function UpcomingPanel({
  items,
}: {
  items: UpcomingActivity[];
}): ReactElement {
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

      {items.length === 0 ? (
        <p className="mt-6 font-body text-sm leading-6 text-muted">
          Nothing scheduled. Confirmed viewings and move-ins show up here.
        </p>
      ) : (
        <ol className="mt-6 space-y-5">
          {items.map((activity) => (
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
      )}
    </section>
  );
}

function PropertiesPanel({
  properties,
}: {
  properties: AgentProperty[];
}): ReactElement {
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
        <span>Rent</span>
        <span>Occupancy</span>
        <span>Status</span>
        <span className="sr-only">Actions</span>
      </div>

      <div className="divide-y divide-primary/10">
        {properties.map((property) => (
          <article
            key={property.id}
            className="grid gap-4 p-5 transition-colors hover:bg-surface-soft md:grid-cols-[minmax(16rem,1.6fr)_minmax(8rem,0.7fr)_minmax(8rem,0.7fr)_minmax(9rem,0.7fr)_2rem] md:items-center md:gap-5 md:px-6"
          >
            <div className="flex min-w-0 items-center gap-4">
              {property.imageUrl ? (
                <Image
                  src={property.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-muted">
                  <ImageOff size={20} aria-hidden="true" />
                </span>
              )}
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
                Rent
              </p>
              <p className="mt-1 font-body text-sm font-bold text-primary md:mt-0">
                <PropertyPrice value={property.price} />
              </p>
              <p className="font-body text-xs text-muted">
                {RENTAL_PERIOD_LABELS[property.rentalMode]}
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

function BookingsPanel({
  bookings,
}: {
  bookings: AgentBooking[];
}): ReactElement {
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

      {bookings.length === 0 ? (
        <p className="mt-6 font-body text-sm leading-6 text-muted">
          No tenancy requests yet. They appear here as tenants apply.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-lg bg-surface-soft p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <IconTile tone={BOOKING_TONES[booking.status]}>
                  {booking.status === "PENDING" ? (
                    <Clock3 size={19} />
                  ) : (
                    <CheckCircle2 size={19} />
                  )}
                </IconTile>
                <StatusBadge tone={BOOKING_TONES[booking.status]} size="sm">
                  {BOOKING_LABELS[booking.status]}
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
      )}
    </section>
  );
}

export default function AgentDashboardPage(): ReactElement {
  const reduceMotion = useReducedMotion();
  const { user } = useAuthenticatedUser();
  const { snapshot: verification } = useHostVerification();
  const [portfolio, setPortfolio] = useState<PropertyPortfolio | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getPropertyPortfolio(),
      getHostBookings(),
      getHostViewings(),
    ]).then(([portfolioResult, bookingsResult, viewingsResult]) => {
        if (!active) {
          return;
        }

        setPortfolio(portfolioResult.data);
        setBookings(bookingsResult.data);
        setViewings(viewingsResult.data);
        // The portfolio is the page. Bookings failing alone still leaves it useful.
        setLoadError(portfolioResult.data ? "" : (portfolioResult.message ?? ""));
        setIsLoading(false);
      },
    );

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
        <DashboardSkeleton />
      </main>
    );
  }

  if (!portfolio) {
    return (
      <main className="grid min-h-screen place-items-center px-5 py-12 sm:px-8">
        <div className="max-w-md text-center">
          <p className="font-body text-sm leading-6 text-muted">
            {loadError || "Your dashboard could not be loaded."}
          </p>
        </div>
      </main>
    );
  }

  if (portfolio.properties.length === 0 && bookings.length === 0) {
    return (
      <main className="min-h-screen px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
        <EmptyDashboard />
      </main>
    );
  }

  const dashboard = buildDashboard(
    portfolio,
    bookings,
    viewings,
    verification?.identity.status === "approved",
  );
  const now = new Date();

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
            {formatFullDate(now)}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-[0.95] text-primary sm:text-5xl">
            {greetingFor(now.getHours())}
            {user?.firstName ? `, ${user.firstName}.` : "."}
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

      <SummaryGrid items={dashboard.summary} />

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
        <AttentionPanel items={dashboard.attention} />
        <UpcomingPanel items={dashboard.upcoming} />
      </div>

      <PropertiesPanel properties={dashboard.properties} />
      <BookingsPanel bookings={dashboard.bookings} />
      <ActivityFeed role="agent" />
    </motion.main>
  );
}
