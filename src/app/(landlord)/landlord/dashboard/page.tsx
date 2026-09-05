"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Clock,
  Clock3,
  FileCheck2,
  Landmark,
  MapPin,
  MessageSquareText,
  Percent,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactElement, useEffect, useState } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import {
  countVerifiedHostSteps,
  useHostVerification,
} from "@/lib/hostVerification";
import {
  getPropertyPortfolio,
  type PropertyPortfolio,
} from "@/lib/hostListings";

type LandlordRequest =
  | {
      requestType: "Rental";
      title: string;
      location: string;
      status: "Pending" | "Accepted" | "Declined";
      requestedDates: string;
      amount: string;
      requester: string;
      image: string;
    }
  | {
      requestType: "Sale";
      title: string;
      location: string;
      status: "Pending" | "Accepted" | "Declined";
      offerAmount: string;
      requester: string;
      image: string;
    };

interface DashboardStat {
  icon: typeof Building2;
  label: string;
  tile: string;
  tone: string;
  trend: string;
  value: number | string;
}

const EMPTY_LANDLORD_PORTFOLIO: PropertyPortfolio = {
  totalPropertiesCount: 0,
  activeListingsCount: 0,
  totalValueForSale: 0,
  expectedMonthlyRentalIncome: 0,
  pendingOffersCount: 0,
  properties: [],
};

// No backend field exists for this yet. Using placeholder value until available.
const estimatedOccupancyRate = "87%";

// Mock chart data until backend exposes an analytics or timeseries endpoint.
const BOOKING_OVERVIEW = [
  { month: "Feb", value: 42 },
  { month: "Mar", value: 58 },
  { month: "Apr", value: 51 },
  { month: "May", value: 69 },
  { month: "Jun", value: 76 },
  { month: "Jul", value: 64 },
];

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&auto=format&q=80",
];

const RECENT_REQUESTS: LandlordRequest[] = [
  {
    requestType: "Rental",
    title: "Lekki Garden Maisonette",
    location: "Lekki Phase 1, Lagos",
    status: "Pending",
    requestedDates: "Aug 02 to Aug 16",
    amount: "₦750,000/mo",
    requester: "Ada Nwosu",
    image: PROPERTY_IMAGES[0],
  },
  {
    requestType: "Rental",
    title: "Ikoyi Waterfront Flat",
    location: "Ikoyi, Lagos",
    status: "Accepted",
    requestedDates: "Aug 10 to Sep 10",
    amount: "₦1,200,000/mo",
    requester: "Kelechi Eze",
    image: PROPERTY_IMAGES[1],
  },
  {
    requestType: "Rental",
    title: "Maitama Serviced Duplex",
    location: "Maitama, Abuja",
    status: "Pending",
    requestedDates: "Sep 01 to Sep 30",
    amount: "₦950,000/mo",
    requester: "Tolu Martins",
    image: PROPERTY_IMAGES[2],
  },
];

const ACTIVITY_ITEMS = [
  {
    title: "New booking request",
    description: "Ada Nwosu requested Lekki Garden Maisonette.",
    time: "12 minutes ago",
    icon: MessageSquareText,
    tone: "bg-primary text-white",
  },
  {
    title: "Viewing confirmed",
    description: "Ikoyi Waterfront Flat has a confirmed viewing tomorrow.",
    time: "1 hour ago",
    icon: CalendarCheck,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Portfolio updated",
    description: "Expected monthly rental income was refreshed.",
    time: "Today",
    icon: Landmark,
    tone: "bg-surface-soft text-primary",
  },
];

function getDashboardStats(portfolio: PropertyPortfolio): DashboardStat[] {
  return [
    {
      label: "Active Listings",
      value: portfolio.activeListingsCount.toString().padStart(2, "0"),
      trend: `${portfolio.totalPropertiesCount} total properties`,
      icon: Building2,
      tone: "bg-surface-soft",
      tile: "bg-primary text-white",
    },
    {
      label: "Pending Offers",
      value: portfolio.pendingOffersCount.toString().padStart(2, "0"),
      trend: "Awaiting response",
      icon: FileCheck2,
      tone: "bg-surface-soft",
      tile: "bg-primary/10 text-primary",
    },
    {
      label: "Monthly Rental Income",
      value: portfolio.expectedMonthlyRentalIncome,
      trend: "Expected recurring income",
      icon: Landmark,
      tone: "bg-surface-soft",
      tile: "bg-primary text-white",
    },
    {
      label: "Occupancy Rate",
      value: estimatedOccupancyRate,
      trend: "Estimated placeholder",
      icon: Percent,
      tone: "bg-[var(--color-bg)]",
      tile: "bg-primary/10 text-primary",
    },
  ];
}

const STATUS_STYLES: Record<LandlordRequest["status"], string> = {
  Pending: "border border-primary/20 bg-surface-soft text-primary",
  Accepted: "bg-accent text-primary",
  Declined: "border border-red-700/30 bg-red-700/10 text-red-700",
};

const REQUEST_TYPE_STYLES: Record<LandlordRequest["requestType"], string> = {
  Rental: "bg-primary/10 text-primary",
  Sale: "bg-accent text-primary",
};

export default function LandlordDashboardPage() {
  const reduceMotion = useReducedMotion();
  const { snapshot: verification } = useHostVerification();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [portfolio, setPortfolio] = useState(EMPTY_LANDLORD_PORTFOLIO);
  const [portfolioError, setPortfolioError] = useState("");
  const stats = getDashboardStats(portfolio);
  const maxChartValue = Math.max(...BOOKING_OVERVIEW.map(({ value }) => value));
  const kybPending = verification?.kyb.status === "pending";
  const kybRejected = verification?.kyb.status === "rejected";
  const stepsDone = countVerifiedHostSteps(verification);
  const showVerificationBanner =
    !bannerDismissed && verification !== null && stepsDone < 3;

  useEffect(() => {
    let active = true;

    const loadPortfolio = async (): Promise<void> => {
      const result = await getPropertyPortfolio();

      if (!active) {
        return;
      }

      if (result.data) {
        setPortfolio(result.data);
      }

      setPortfolioError(result.message ?? "");
    };

    void loadPortfolio();

    return () => {
      active = false;
    };
  }, []);

  const renderVerificationBanner = (): ReactElement | null => {
    if (!showVerificationBanner) {
      return null;
    }

    // Rejection is the only state the host has to act on right now, so it leads
    const message = kybRejected
      ? "Your business documents were not accepted. Upload new ones to keep listing."
      : kybPending
        ? "Your business documents are under review. This usually takes 1 to 2 business days."
        : `Your account is ${stepsDone} of 3 verified. Finish the remaining checks to publish listings.`;

    return (
      <section
        className="mb-6 flex items-start gap-3 rounded-lg border-l-2 border-accent bg-accent/10 px-4 py-3"
        aria-label="Host verification status"
      >
        <Clock
          className="mt-0.5 h-5 w-5 shrink-0 text-accent-alt"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 font-body text-sm leading-6 text-primary">
          {message}{" "}
          {kybPending ? null : (
            <Link
              href="/landlord/verify"
              className="whitespace-nowrap font-bold text-primary underline decoration-accent underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {kybRejected ? "Upload documents" : "Continue"}
            </Link>
          )}
        </p>
        <button
          type="button"
          onClick={() => setBannerDismissed(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Dismiss verification status"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </section>
    );
  };

  return (
    <motion.main
      className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Host portfolio
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Landlord Dashboard
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Welcome back, Chinedu! Track your listed properties, pending offers,
          and expected rental income.
        </p>
      </header>

      {renderVerificationBanner()}

      {portfolioError ? (
        <p className="mb-6 rounded-lg border border-red-500/30 bg-bg px-4 py-3 font-body text-sm font-bold text-red-700">
          {portfolioError}
        </p>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, trend, icon: Icon, tone, tile }) => (
          <article
            key={label}
            className={`min-w-0 rounded-lg border border-primary/15 p-5 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md ${tone}`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${tile}`}
            >
              <Icon size={22} />
            </div>
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
            <p className="mt-4 flex items-center gap-2 font-body text-xs font-bold text-primary">
              <ArrowUpRight size={15} />
              {trend}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-10 grid gap-7 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-primary/15 bg-[var(--color-bg)] shadow-sm">
          <div className="flex items-end justify-between gap-5 border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
                Bookings overview
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary">
                Request Momentum
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-primary/30 px-5 py-2 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              6 months
            </button>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex min-h-72 items-end gap-3 rounded-lg border border-primary/10 bg-surface-soft/70 p-4 sm:gap-5 sm:p-6">
              {BOOKING_OVERVIEW.map(({ month, value }) => (
                <div
                  key={month}
                  className="flex min-w-0 flex-1 flex-col items-center gap-3"
                >
                  <div className="flex h-52 w-full items-end rounded-full bg-primary/5 p-1">
                    <div
                      className="w-full rounded-full bg-primary transition-all duration-300 ease-in-out hover:bg-accent"
                      style={{ height: `${(value / maxChartValue) * 100}%` }}
                    />
                  </div>
                  <span className="font-body text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    {month}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-primary/10 bg-[var(--color-bg)] p-4">
                <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Peak month
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-primary">
                  June
                </p>
              </div>
              <div className="rounded-lg border border-primary/10 bg-[var(--color-bg)] p-4">
                <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Avg requests
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-primary">
                  60/mo
                </p>
              </div>
              <div className="rounded-lg border border-primary/10 bg-[var(--color-bg)] p-4">
                <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Trend
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-primary">
                  Rising
                </p>
              </div>
            </div>
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
            {ACTIVITY_ITEMS.map(
              ({ title, description, time, icon: Icon, tone }) => (
                <article
                  key={title}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-b border-primary/15 p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:p-6"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}
                  >
                    <Icon size={20} />
                  </span>
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
              ),
            )}
          </div>
        </aside>
      </div>

      <section className="mt-10 min-w-0 overflow-hidden rounded-lg border border-primary/15 bg-[var(--color-bg)] shadow-sm">
        <div className="flex items-end justify-between gap-5 border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Pending offers
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary">
              Recent Requests
            </h2>
          </div>
          <Link
            href="/landlord/bookings"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-primary/30 px-5 py-2 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View all
          </Link>
        </div>

        <div>
          {RECENT_REQUESTS.map((request) => (
            <article
              key={`${request.requester}-${request.title}`}
              className="grid gap-4 border-b border-primary/15 p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:grid-cols-[8rem_1fr] sm:items-center sm:p-6"
            >
              <div className="relative h-28 overflow-hidden rounded-lg bg-surface-soft sm:w-full">
                <Image
                  src={request.image}
                  alt={request.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 128px"
                  className="object-cover transition-all duration-200 ease-in-out"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1.5 font-body text-xs font-medium ${REQUEST_TYPE_STYLES[request.requestType]}`}
                      >
                        {request.requestType === "Rental"
                          ? "Rental"
                          : "Request"}
                      </span>
                      <h3 className="font-body text-lg font-bold text-primary">
                        {request.title}
                      </h3>
                    </div>
                    <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                      <MapPin size={15} className="shrink-0 text-primary/60" />
                      {request.location}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 font-body text-xs font-medium ${STATUS_STYLES[request.status]}`}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 font-body text-sm text-muted">
                    <Clock3 size={15} className="shrink-0 text-primary/60" />
                    <span>
                      {request.requestType === "Rental"
                        ? request.requestedDates
                        : "Request submitted"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      {request.requester}
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold text-primary">
                      <PropertyPrice
                        value={
                          request.requestType === "Rental"
                            ? request.amount
                            : request.offerAmount
                        }
                      />
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </motion.main>
  );
}
