"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Landmark,
  MapPin,
  Plus,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { utilityCardVariants } from "@/components/ui/utility-card";
import {
  getHostBookings,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";
import { getMyEscrow, type EscrowEntry, type EscrowStatus } from "@/lib/escrow";
import {
  getPropertyPortfolio,
  type BackendProperty,
  type PropertyPortfolio,
} from "@/lib/hostListings";
import { useAuthenticatedUser } from "@/lib/account";
import { useHostVerification } from "@/lib/hostVerification";

// === Types

type DashboardViewState = "empty" | "error" | "loading" | "populated";
type AttentionTone = "neutral" | "urgent" | "warning";
type PropertyStatus = "Live" | "Needs attention" | "Occupied";
type PropertyVerification = "Pending" | "Verified";
type TenancyStatus = "Available" | "Move-in scheduled" | "Occupied";

interface AttentionItem {
  actionLabel: string;
  description: string;
  href: string;
  icon: LucideIcon;
  id: string;
  title: string;
  tone: AttentionTone;
}

interface DashboardProperty {
  actionHref: string;
  address: string;
  id: number;
  imageUrl: string;
  monthlyRent: number;
  nextAction: string;
  status: PropertyStatus;
  tenancyStatus: TenancyStatus;
  title: string;
  verification: PropertyVerification;
}

interface SummaryItem {
  detail: string;
  icon: LucideIcon;
  label: string;
  source: "bookings" | "escrow" | "portfolio";
  tone: "accent" | "neutral" | "primary";
  value: number | string;
}

interface EmptyDashboardProps {
  identityVerified: boolean;
}

// === Constants

const FALLBACK_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=640&h=480&fit=crop&auto=format&q=80";

const ATTENTION_STYLES: Record<AttentionTone, string> = {
  urgent: "bg-red-700/10 text-red-700",
  warning: "bg-accent/10 text-accent-alt",
  neutral: "bg-primary/5 text-primary",
};

const PROPERTY_STATUS_TONES: Record<
  PropertyStatus,
  "danger" | "neutral" | "primary"
> = {
  Live: "primary",
  Occupied: "neutral",
  "Needs attention": "danger",
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const BOOKING_STATUS_TONES: Record<
  BookingStatus,
  "accent" | "danger" | "neutral" | "primary"
> = {
  PENDING: "accent",
  CONFIRMED: "primary",
  CANCELLED: "danger",
  COMPLETED: "neutral",
};

const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  HELD: "Held",
  RELEASING: "Releasing",
  DISPUTED: "Disputed",
  RELEASED: "Paid out",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

const ESCROW_STATUS_TONES: Record<
  EscrowStatus,
  "accent" | "danger" | "neutral" | "primary"
> = {
  AWAITING_PAYMENT: "accent",
  HELD: "primary",
  RELEASING: "primary",
  DISPUTED: "danger",
  RELEASED: "neutral",
  REFUNDED: "neutral",
  FAILED: "danger",
};

// === Helpers

function isDashboardViewState(
  value: string | null,
): value is DashboardViewState {
  return ["empty", "error", "loading", "populated"].includes(value ?? "");
}

function subscribeToDashboardState(): () => void {
  return () => undefined;
}

function getDashboardViewState(): DashboardViewState {
  const requestedState = new URLSearchParams(window.location.search).get(
    "state",
  );

  return isDashboardViewState(requestedState) ? requestedState : "populated";
}

function getServerDashboardViewState(): DashboardViewState {
  return "populated";
}

function formatStayDates(booking: Booking): string {
  const formatDate = (value: string): string =>
    new Date(value).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
    });

  return `${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}`;
}

function getTenancyStatus(
  propertyId: number,
  bookings: Booking[],
  now: number,
): TenancyStatus {
  const confirmed = bookings.filter(
    (booking) =>
      booking.propertyId === propertyId && booking.status === "CONFIRMED",
  );
  const hasActiveStay = confirmed.some(
    (booking) =>
      new Date(booking.startDate).getTime() <= now &&
      new Date(booking.endDate).getTime() >= now,
  );

  if (hasActiveStay) {
    return "Occupied";
  }

  return confirmed.some(
    (booking) => new Date(booking.startDate).getTime() > now,
  )
    ? "Move-in scheduled"
    : "Available";
}

function mapDashboardProperty(
  property: BackendProperty,
  bookings: Booking[],
  now: number,
): DashboardProperty {
  const tenancyStatus = getTenancyStatus(property.id, bookings, now);
  const needsAttention = !property.verified || !property.imageUrl;
  const actionHref =
    tenancyStatus === "Available"
      ? `/property/${property.id}`
      : "/landlord/bookings";

  return {
    actionHref,
    address: property.address,
    id: property.id,
    imageUrl: property.imageUrl ?? FALLBACK_PROPERTY_IMAGE,
    monthlyRent: property.price,
    nextAction: needsAttention
      ? "Review property"
      : tenancyStatus === "Available"
        ? "View property"
        : "Manage tenancy",
    status: needsAttention
      ? "Needs attention"
      : tenancyStatus === "Occupied"
        ? "Occupied"
        : "Live",
    tenancyStatus,
    title: property.title,
    verification: property.verified ? "Verified" : "Pending",
  };
}

function getAttentionItems(
  identityVerified: boolean,
  properties: BackendProperty[],
  bookings: Booking[],
  escrow: EscrowEntry[],
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const pendingBookings = bookings.filter(
    (booking) => booking.status === "PENDING",
  ).length;
  const incompleteProperties = properties.filter(
    (property) => !property.verified || !property.imageUrl,
  );
  const disputedPayments = escrow.filter(
    (entry) => entry.status === "DISPUTED",
  ).length;

  if (!identityVerified) {
    items.push({
      id: "identity-verification",
      title: "Complete identity verification",
      description: "Verify your identity before publishing another home.",
      actionLabel: "Continue verification",
      href: "/landlord/verify",
      icon: ShieldCheck,
      tone: "urgent",
    });
  }

  if (pendingBookings > 0) {
    items.push({
      id: "booking-requests",
      title: `Respond to ${pendingBookings} tenancy request${pendingBookings === 1 ? "" : "s"}`,
      description: "Review each tenant request and respond when you are ready.",
      actionLabel: "Review requests",
      href: "/landlord/bookings",
      icon: FileCheck2,
      tone: "warning",
    });
  }

  if (incompleteProperties.length > 0) {
    const firstProperty = incompleteProperties[0];

    items.push({
      id: "property-review",
      title: `${incompleteProperties.length} propert${incompleteProperties.length === 1 ? "y needs" : "ies need"} attention`,
      description: "Complete missing media or property verification details.",
      actionLabel: "Review property",
      href: `/property/${firstProperty.id}`,
      icon: Building2,
      tone: "neutral",
    });
  }

  if (disputedPayments > 0) {
    items.push({
      id: "payment-disputes",
      title: `${disputedPayments} payment dispute${disputedPayments === 1 ? "" : "s"} open`,
      description: "Review the booking information and respond to the dispute.",
      actionLabel: "Review disputes",
      href: "/landlord/disputes",
      icon: AlertCircle,
      tone: "urgent",
    });
  }

  return items;
}

function getSummaryItems(
  portfolio: PropertyPortfolio | null,
  bookings: Booking[],
  escrow: EscrowEntry[],
  now: number,
): SummaryItem[] {
  const pendingRequests = bookings.filter(
    (booking) => booking.status === "PENDING",
  ).length;
  const upcomingStays = bookings.filter(
    (booking) =>
      booking.status === "CONFIRMED" &&
      new Date(booking.startDate).getTime() > now,
  ).length;
  const fundsHeld = escrow
    .filter((entry) => entry.status === "HELD")
    .reduce((total, entry) => total + entry.amount, 0);

  return [
    {
      label: "Live homes",
      source: "portfolio",
      value: String(portfolio?.activeListingsCount ?? 0).padStart(2, "0"),
      detail: "Published and visible",
      icon: Building2,
      tone: "primary",
    },
    {
      label: "Tenancy requests",
      source: "bookings",
      value: String(pendingRequests).padStart(2, "0"),
      detail: pendingRequests ? "Waiting for a response" : "Nothing waiting",
      icon: FileCheck2,
      tone: "accent",
    },
    {
      label: "Upcoming move-ins",
      source: "bookings",
      value: String(upcomingStays).padStart(2, "0"),
      detail: upcomingStays ? "Confirmed handovers" : "None scheduled",
      icon: CalendarCheck2,
      tone: "neutral",
    },
    {
      label: "Funds held",
      source: "escrow",
      value: fundsHeld,
      detail: "Protected in escrow",
      icon: Landmark,
      tone: "primary",
    },
  ];
}

function getUpcomingBookings(bookings: Booking[], now: number): Booking[] {
  return bookings
    .filter(
      (booking) =>
        (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
        new Date(booking.endDate).getTime() >= now,
    )
    .sort(
      (left, right) =>
        new Date(left.startDate).getTime() -
        new Date(right.startDate).getTime(),
    )
    .slice(0, 3);
}

// === Components

function EmptyDashboard({
  identityVerified,
}: EmptyDashboardProps): ReactElement {
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
          Start your portfolio
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
          Your first home starts here.
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base leading-7 text-muted">
          Add a property and submit it for verification before accepting
          tenants.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {!identityVerified ? (
            <Link
              href="/landlord/verify"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-6 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Verify your identity
              <ArrowRight size={17} />
            </Link>
          ) : null}
          <Link
            href="/landlord/listings/create"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-body text-sm font-bold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus size={17} />
            Add a property
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LandlordDashboardPage(): ReactElement {
  const reduceMotion = useReducedMotion();
  const requestedViewState = useSyncExternalStore(
    subscribeToDashboardState,
    getDashboardViewState,
    getServerDashboardViewState,
  );
  const { user } = useAuthenticatedUser();
  const { snapshot: verification } = useHostVerification();
  // Skeletons appear only if loading outlasts a moment, so a fast response does
  // not flash placeholder blocks at the user
  const [showSkeletons, setShowSkeletons] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSkeletons(true), 150);

    return () => window.clearTimeout(timer);
  }, []);

  const [portfolio, setPortfolio] = useState<PropertyPortfolio | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [escrow, setEscrow] = useState<EscrowEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  // Captured when the data lands rather than read during render: Date.now() in a
  // render body is impure and makes every memo below unstable
  const [loadedAt, setLoadedAt] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    void Promise.all([
      getPropertyPortfolio(),
      getHostBookings(),
      getMyEscrow(),
    ]).then(([portfolioResult, bookingsResult, escrowResult]) => {
      if (!active) {
        return;
      }

      setPortfolio(portfolioResult.data);
      setBookings(bookingsResult.data);
      setEscrow(escrowResult.data);
      // The portfolio is the page; the other two failing alone still leaves it useful
      setLoadError(portfolioResult.data ? "" : (portfolioResult.message ?? ""));
      setLoadedAt(Date.now());
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const verified = verification?.identity.status === "approved";
  const portfolioProperties = useMemo(
    () => portfolio?.properties ?? [],
    [portfolio],
  );
  const now = loadedAt;
  const summaryItems = useMemo(
    () =>
      portfolio
        ? getSummaryItems(portfolio, bookings, escrow, now)
        : [],
    [portfolio, bookings, escrow, now],
  );
  const attentionItems = useMemo(
    () => getAttentionItems(verified, portfolioProperties, bookings, escrow),
    [verified, portfolioProperties, bookings, escrow],
  );
  const dashboardProperties = useMemo(
    () =>
      portfolioProperties
        .slice(0, 4)
        .map((property) => mapDashboardProperty(property, bookings, now)),
    [portfolioProperties, bookings, now],
  );
  const upcomingBookings = useMemo(
    () => getUpcomingBookings(bookings, now),
    [bookings, now],
  );
  const recentEscrow = useMemo(() => escrow.slice(0, 3), [escrow]);
  const fundsHeld = useMemo(
    () =>
      escrow
        .filter((entry) => entry.status === "HELD")
        .reduce((total, entry) => total + entry.amount, 0),
    [escrow],
  );
  const forceLoading = requestedViewState === "loading" || isLoading;
  const forceError = requestedViewState === "error" || loadError !== "";
  const accountBusy = forceLoading;
  const portfolioBusy = forceLoading;
  const bookingsBusy = forceLoading;
  const escrowBusy = forceLoading;
  const attentionBusy = forceLoading;
  const resolvedPortfolioError = forceError
    ? "Properties could not be loaded."
    : "";
  const resolvedBookingsError = forceError
    ? "Tenancies could not be loaded."
    : "";
  const resolvedEscrowError = forceError ? "Payments could not be loaded." : "";
  const attentionError = forceError ? "Action items could not be loaded." : "";
  const showEmpty = requestedViewState === "empty";
  if (showEmpty) {
    return (
      <main className="min-h-screen px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
        <EmptyDashboard identityVerified={verified} />
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
        <div className="min-h-12" aria-busy={accountBusy}>
          {accountBusy ? (
            showSkeletons ? (
              <div className="h-12 w-72 max-w-full animate-pulse rounded-lg bg-primary/10 motion-reduce:animate-none" />
            ) : null
          ) : (
            <h1 className="font-display text-4xl font-bold leading-[0.95] text-primary sm:text-5xl">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
            </h1>
          )}
        </div>
        <Link
          href="/landlord/listings/create"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-primary px-6 font-body text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:self-auto"
        >
          <Plus size={18} />
          Add a listing
        </Link>
      </header>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Portfolio summary"
      >
        {summaryItems.map(
          ({ detail, icon: Icon, label, source, tone, value }) => {
            const sourceLoading =
              source === "portfolio"
                ? portfolioBusy
                : source === "bookings"
                  ? bookingsBusy
                  : escrowBusy;
            const sourceError =
              source === "portfolio"
                ? resolvedPortfolioError
                : source === "bookings"
                  ? resolvedBookingsError
                  : resolvedEscrowError;

            if (sourceLoading) {
              return (
                <article
                  key={label}
                  className="min-h-40 rounded-lg bg-primary/5 p-5 shadow-sm"
                  aria-busy="true"
                >
                  {showSkeletons ? (
                    <div className="animate-pulse motion-reduce:animate-none">
                      <div className="flex items-start justify-between">
                        <div className="h-3 w-24 rounded-full bg-primary/10" />
                        <div className="h-11 w-11 rounded-lg bg-primary/10" />
                      </div>
                      <div className="mt-5 h-8 w-20 rounded-lg bg-primary/10" />
                      <div className="mt-5 h-3 w-28 rounded-full bg-primary/10" />
                    </div>
                  ) : null}
                </article>
              );
            }

            return (
              <article
                key={label}
                className={utilityCardVariants({
                  tone:
                    tone === "accent"
                      ? "accentTint"
                      : tone === "primary"
                        ? "primaryTint"
                        : "soft",
                  interactive: !sourceError,
                })}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                      {label}
                    </p>
                    <p className="mt-4 font-display text-3xl font-bold leading-none text-primary">
                      {sourceError ? (
                        "Unavailable"
                      ) : typeof value === "number" ? (
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
                <p className="mt-5 font-body text-xs font-bold text-primary/70">
                  {sourceError ? "Try again shortly" : detail}
                </p>
              </article>
            );
          },
        )}
      </section>

      {attentionBusy || attentionItems.length || attentionError ? (
        <section
          className="mt-8 overflow-hidden rounded-lg bg-bg shadow-sm"
          aria-busy={attentionBusy}
        >
          <div className="flex min-h-24 flex-wrap items-end justify-between gap-4 border-b border-primary/10 px-5 py-5 sm:px-6">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                Action centre
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary">
                Needs attention
              </h2>
            </div>
            {!attentionBusy && attentionItems.length ? (
              <StatusBadge tone="accent">
                {attentionItems.length} open task
                {attentionItems.length === 1 ? "" : "s"}
              </StatusBadge>
            ) : null}
          </div>
          {attentionBusy ? (
            showSkeletons ? (
              <div className="divide-y divide-primary/10 animate-pulse motion-reduce:animate-none">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="flex h-24 items-center gap-4 px-5 sm:px-6"
                  >
                    <div className="h-11 w-11 shrink-0 rounded-full bg-primary/10" />
                    <div className="flex-1">
                      <div className="h-4 w-48 max-w-[70%] rounded-full bg-primary/10" />
                      <div className="mt-3 h-3 w-72 max-w-[90%] rounded-full bg-primary/5" />
                    </div>
                    <div className="h-4 w-24 rounded-full bg-primary/10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-72" />
            )
          ) : attentionItems.length ? (
            <div className="divide-y divide-primary/10">
              {attentionItems.map(
                ({
                  actionLabel,
                  description,
                  href,
                  icon: Icon,
                  id,
                  title,
                  tone,
                }) => (
                  <article
                    key={id}
                    className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-surface-soft sm:flex-row sm:items-center sm:px-6"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${ATTENTION_STYLES[tone]}`}
                    >
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-body text-sm font-bold text-primary">
                        {title}
                      </h3>
                      <p className="mt-1 font-body text-sm leading-6 text-muted">
                        {description}
                      </p>
                    </div>
                    <Link
                      href={href}
                      className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start font-body text-sm font-bold text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:self-auto"
                    >
                      {actionLabel}
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                ),
              )}
              {attentionError ? (
                <p className="px-5 py-4 font-body text-xs text-muted sm:px-6">
                  Some action items could not be checked. Refresh to try again.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="px-5 py-10 text-center sm:px-6">
              <AlertCircle size={24} className="mx-auto text-red-700" />
              <p className="mt-3 font-body text-sm font-bold text-primary">
                {attentionError}
              </p>
            </div>
          )}
        </section>
      ) : null}

      <section
        className="mt-8 overflow-hidden rounded-lg bg-bg shadow-sm"
        aria-busy={portfolioBusy}
      >
        <div className="border-b border-primary/10 px-5 py-5 sm:px-6">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-primary">
            Portfolio
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary">
            Your properties
          </h2>
        </div>
        {portfolioBusy ? (
          showSkeletons ? (
            <div
              className="divide-y divide-primary/10 animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            >
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="grid min-h-32 gap-5 p-5 sm:grid-cols-[8rem_1fr] sm:items-center sm:px-6 lg:grid-cols-[9rem_minmax(12rem,1.2fr)_minmax(9rem,0.75fr)_minmax(9rem,0.75fr)_auto]"
                >
                  <div className="h-24 rounded-lg bg-primary/10" />
                  <div>
                    <div className="h-4 w-44 rounded-full bg-primary/10" />
                    <div className="mt-3 h-3 w-32 rounded-full bg-primary/5" />
                  </div>
                  <div className="h-5 w-24 rounded-full bg-primary/10" />
                  <div className="h-6 w-20 rounded-full bg-primary/10" />
                  <div className="h-4 w-24 rounded-full bg-primary/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-96" />
          )
        ) : resolvedPortfolioError ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <AlertCircle size={28} className="mx-auto text-red-700" />
            <p className="mt-4 font-body text-sm font-bold text-primary">
              Properties could not be loaded
            </p>
            <p className="mt-2 font-body text-sm text-muted">
              {resolvedPortfolioError}
            </p>
          </div>
        ) : dashboardProperties.length ? (
          <div className="divide-y divide-primary/10">
            {dashboardProperties.map((property) => (
              <article
                key={property.id}
                className="grid gap-5 p-5 transition-colors hover:bg-surface-soft sm:grid-cols-[8rem_1fr] sm:items-center sm:px-6 lg:grid-cols-[9rem_minmax(12rem,1.2fr)_minmax(9rem,0.75fr)_minmax(9rem,0.75fr)_auto]"
              >
                <div className="relative h-28 overflow-hidden rounded-lg bg-surface-soft sm:h-24">
                  <Image
                    src={property.imageUrl}
                    alt={property.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 144px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-body text-base font-bold text-primary">
                      {property.title}
                    </h3>
                    <StatusBadge
                      size="sm"
                      tone={PROPERTY_STATUS_TONES[property.status]}
                    >
                      {property.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                    <MapPin size={15} className="shrink-0" />
                    {property.address}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs font-medium uppercase tracking-[0.12em] text-muted">
                    Monthly rent
                  </p>
                  <p className="mt-2 font-display text-xl font-bold text-primary">
                    <PropertyPrice value={property.monthlyRent} />
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <StatusBadge
                    size="sm"
                    tone={
                      property.verification === "Verified"
                        ? "primary"
                        : "accent"
                    }
                    icon={
                      property.verification === "Verified" ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Clock3 size={13} />
                      )
                    }
                  >
                    {property.verification}
                  </StatusBadge>
                  <span className="font-body text-xs font-bold text-muted">
                    {property.tenancyStatus}
                  </span>
                </div>
                <Link
                  href={property.actionHref}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 font-body text-sm font-bold text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {property.nextAction}
                  <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center sm:px-6">
            <Building2 size={28} className="mx-auto text-primary/35" />
            <p className="mt-4 font-body text-sm font-bold text-primary">
              No properties yet
            </p>
            <p className="mt-2 font-body text-sm text-muted">
              Add a property to begin building your portfolio.
            </p>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section
          className="overflow-hidden rounded-lg bg-bg shadow-sm"
          aria-busy={bookingsBusy}
        >
          <div className="flex items-end justify-between gap-4 border-b border-primary/10 px-5 py-5 sm:px-6">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-primary">
                Tenancies
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary">
                Upcoming tenancies
              </h2>
            </div>
            <Link
              href="/landlord/bookings"
              className="font-body text-sm font-bold text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              View all
            </Link>
          </div>
          {bookingsBusy ? (
            showSkeletons ? (
              <div
                className="divide-y divide-primary/10 animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              >
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="flex h-24 items-center justify-between gap-4 px-5 sm:px-6"
                  >
                    <div className="flex-1">
                      <div className="h-4 w-44 rounded-full bg-primary/10" />
                      <div className="mt-3 h-3 w-36 rounded-full bg-primary/5" />
                    </div>
                    <div className="h-5 w-24 rounded-full bg-primary/10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-72" />
            )
          ) : resolvedBookingsError ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <AlertCircle size={28} className="mx-auto text-red-700" />
              <p className="mt-4 font-body text-sm font-bold text-primary">
                Tenancies could not be loaded
              </p>
              <p className="mt-2 font-body text-sm text-muted">
                {resolvedBookingsError}
              </p>
            </div>
          ) : upcomingBookings.length ? (
            <div className="divide-y divide-primary/10">
              {upcomingBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="grid gap-4 px-5 py-5 transition-colors hover:bg-surface-soft sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-body text-sm font-bold text-primary">
                        {booking.propertyTitle}
                      </h3>
                      <StatusBadge
                        size="sm"
                        tone={BOOKING_STATUS_TONES[booking.status]}
                      >
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 font-body text-sm text-muted">
                      {booking.tenant?.name ?? "Tenant"} ·{" "}
                      {formatStayDates(booking)}
                    </p>
                  </div>
                  <p className="font-display text-xl font-bold text-primary">
                    <PropertyPrice value={booking.totalPrice} />
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center sm:px-6">
              <CalendarCheck2 size={28} className="mx-auto text-primary/35" />
              <p className="mt-4 font-body text-sm font-bold text-primary">
                No upcoming tenancies
              </p>
              <p className="mt-2 font-body text-sm text-muted">
                Confirmed tenancies and new requests will appear here.
              </p>
            </div>
          )}
        </section>

        <section
          className="overflow-hidden rounded-lg bg-primary text-white shadow-sm"
          aria-busy={escrowBusy}
        >
          <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent">
                Payments
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold">
                Escrow overview
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-white/70">
                Track money waiting, protected, and paid out.
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-accent">
              <WalletCards size={21} />
            </span>
          </div>
          <div className="border-y border-white/10 px-5 py-5 sm:px-6">
            <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-white/60">
              Currently held
            </p>
            <p className="mt-2 font-display text-4xl font-bold">
              {escrowBusy ? (
                showSkeletons ? (
                  <span className="inline-block h-10 w-40 animate-pulse rounded-lg bg-white/10 align-middle motion-reduce:animate-none" />
                ) : null
              ) : resolvedEscrowError ? (
                "Unavailable"
              ) : (
                <PropertyPrice value={fundsHeld} />
              )}
            </p>
          </div>
          {escrowBusy ? (
            showSkeletons ? (
              <div
                className="divide-y divide-white/10 animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              >
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="flex h-20 items-center justify-between gap-4 px-5 sm:px-6"
                  >
                    <div className="flex-1">
                      <div className="h-4 w-40 rounded-full bg-white/10" />
                      <div className="mt-3 h-3 w-24 rounded-full bg-white/10" />
                    </div>
                    <div className="h-5 w-24 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-60" />
            )
          ) : resolvedEscrowError ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <AlertCircle size={28} className="mx-auto text-accent" />
              <p className="mt-4 font-body text-sm font-bold">
                Payments could not be loaded
              </p>
              <p className="mt-2 font-body text-sm text-white/60">
                {resolvedEscrowError}
              </p>
            </div>
          ) : recentEscrow.length ? (
            <div className="divide-y divide-white/10">
              {recentEscrow.map((entry) => (
                <article
                  key={entry.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-bold">
                      {entry.propertyTitle}
                    </p>
                    <p className="mt-1 font-body text-xs text-white/60">
                      {entry.tenant?.name ?? "Tenant"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-bold">
                      <PropertyPrice value={entry.amount} />
                    </p>
                    <StatusBadge
                      size="sm"
                      tone={ESCROW_STATUS_TONES[entry.status]}
                      className="mt-1"
                    >
                      {ESCROW_STATUS_LABELS[entry.status]}
                    </StatusBadge>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center sm:px-6">
              <WalletCards size={28} className="mx-auto text-white/35" />
              <p className="mt-4 font-body text-sm font-bold">
                No payment activity
              </p>
              <p className="mt-2 font-body text-sm text-white/60">
                Escrow records will appear after a tenant starts payment.
              </p>
            </div>
          )}
          <Link
            href="/landlord/escrow"
            className="flex min-h-12 items-center justify-center gap-2 border-t border-white/10 px-5 font-body text-sm font-bold text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View payments
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </motion.main>
  );
}
