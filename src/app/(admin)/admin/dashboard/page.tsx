"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  Building2,
  CalendarCheck,
  Landmark,
  Scale,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { utilityCardVariants } from "@/components/ui/utility-card";
import { getAdminMetrics, type AdminMetrics } from "@/lib/admin";

interface MetricGroup {
  items: { label: string; value: string | number; money?: boolean }[];
  title: string;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export default function AdminDashboardPage(): ReactElement {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    void getAdminMetrics().then((result) => {
      if (!active) {
        return;
      }

      setMetrics(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const headline = metrics
    ? [
        {
          label: "Users",
          value: pad(metrics.totalUsers),
          trend: `${metrics.identityVerifiedUsers} verified`,
          icon: UsersRound,
        },
        {
          label: "Verified listings",
          value: pad(metrics.verifiedListings),
          trend: `${metrics.unverifiedListings} awaiting proof`,
          icon: Building2,
        },
        {
          label: "Bookings",
          value: pad(metrics.totalBookings),
          trend: `${metrics.pendingBookings} pending`,
          icon: CalendarCheck,
        },
        {
          label: "Open disputes",
          value: pad(metrics.openDisputes + metrics.disputesUnderReview),
          trend: `${metrics.disputesUnderReview} with Rello`,
          icon: Scale,
        },
      ]
    : [];

  const groups: MetricGroup[] = metrics
    ? [
        {
          title: "People",
          items: [
            { label: "Tenants", value: metrics.tenants },
            { label: "Landlords", value: metrics.landlords },
            { label: "Agents", value: metrics.agents },
            {
              label: "Identity verified",
              value: metrics.identityVerifiedUsers,
            },
          ],
        },
        {
          title: "Listings",
          items: [
            { label: "Total", value: metrics.totalListings },
            { label: "Verified", value: metrics.verifiedListings },
            { label: "Awaiting proof", value: metrics.unverifiedListings },
            {
              label: "Flagged duplicate",
              value: metrics.duplicateFlaggedListings,
            },
          ],
        },
        {
          title: "Bookings",
          items: [
            { label: "Pending", value: metrics.pendingBookings },
            { label: "Confirmed", value: metrics.confirmedBookings },
            { label: "Completed", value: metrics.completedBookings },
            { label: "Cancelled", value: metrics.cancelledBookings },
          ],
        },
        {
          title: "Money",
          items: [
            { label: "Held in escrow", value: metrics.escrowHeld, money: true },
            {
              label: "Released to hosts",
              value: metrics.escrowReleased,
              money: true,
            },
            {
              label: "Awaiting payment",
              value: metrics.escrowAwaitingPayment,
            },
            { label: "KYB in queue", value: metrics.pendingKybSubmissions },
          ],
        },
      ]
    : [];

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Platform overview
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Dashboard
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Live counts across users, listings, bookings and money.
        </p>
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <div role="status" aria-label="Loading dashboard metrics">
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <article
                key={`loading-metric-${index + 1}`}
                className={utilityCardVariants({ tone: "soft" })}
                aria-hidden="true"
              >
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="mt-7 h-4 w-28" />
                <Skeleton className="mt-3 h-10 w-24" />
                <Skeleton className="mt-4 h-4 w-36" />
              </article>
            ))}
          </section>
          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </section>
          <span className="sr-only">Loading dashboard metrics</span>
        </div>
      ) : !metrics ? (
        <p className="py-16 text-center font-body text-sm text-muted">
          Metrics are unavailable.
        </p>
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {headline.map(({ label, value, trend, icon: Icon }) => (
              <article
                key={label}
                className={utilityCardVariants({
                  tone: "soft",
                  interactive: true,
                })}
              >
                <IconTile tone="primary">
                  <Icon size={22} />
                </IconTile>
                <p className="mt-2 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  {label}
                </p>
                <p className="mt-4 font-display text-3xl font-bold leading-none text-primary">
                  {value}
                </p>
                <p className="mt-4 font-body text-xs font-bold text-primary">
                  {trend}
                </p>
              </article>
            ))}
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.title}
                className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8"
              >
                <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
                  {group.title}
                </p>
                <div className="mt-6 space-y-4">
                  {group.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4 border-b border-primary/10 pb-4 last:border-b-0 last:pb-0"
                    >
                      <span className="font-body text-sm text-muted">
                        {item.label}
                      </span>
                      <span className="font-display text-2xl font-bold text-primary">
                        {item.money ? (
                          <PropertyPrice value={Number(item.value)} />
                        ) : (
                          item.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-lg bg-surface-soft p-6 shadow-sm">
              <Landmark size={22} className="text-accent-alt" />
              <p className="mt-4 font-body text-base font-bold text-primary">
                Money on hold
              </p>
              <p className="mt-2 font-display text-4xl font-bold text-primary">
                <PropertyPrice value={metrics.escrowHeld} />
              </p>
              <p className="mt-3 font-body text-sm leading-6 text-muted">
                Tenant funds Rello is holding against confirmed bookings.
              </p>
            </div>
            <div className="rounded-lg bg-surface-soft p-6 shadow-sm">
              <ShieldCheck size={22} className="text-accent-alt" />
              <p className="mt-4 font-body text-base font-bold text-primary">
                Waiting on review
              </p>
              <p className="mt-2 font-display text-4xl font-bold text-primary">
                {pad(
                  metrics.pendingKybSubmissions + metrics.disputesUnderReview,
                )}
              </p>
              <p className="mt-3 font-body text-sm leading-6 text-muted">
                KYB submissions and disputes automation could not decide.
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
