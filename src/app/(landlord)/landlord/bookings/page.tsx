"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  Check,
  Clock3,
  FileCheck2,
  KeyRound,
  Loader2,
  MapPin,
  MessageCircle,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import {
  StatusBadge,
  type StatusBadgeProps,
} from "@/components/ui/status-badge";
import { utilityCardVariants } from "@/components/ui/utility-card";
import { useToast } from "@/components/ui/toast";
import {
  getHostBookings,
  updateBookingStatus,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";
import { TENANT_ACTIVITY_IMAGES } from "@/lib/tenantActivity";

const STATUS_TONES: Record<
  BookingStatus,
  NonNullable<StatusBadgeProps["tone"]>
> = {
  PENDING: "accent",
  CONFIRMED: "primary",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatStayDates(booking: Booking): string {
  const format = (value: string): string =>
    new Date(value).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
    });

  return `${format(booking.startDate)} to ${format(booking.endDate)}`;
}

function formatRelativeTime(value: string | null): string {
  if (!value) {
    return "Recently";
  }

  const days = Math.floor(
    (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";

  return `${days} days ago`;
}

function coverImage(booking: Booking, index: number): string {
  return (
    booking.propertyImageUrl ??
    TENANT_ACTIVITY_IMAGES[index % TENANT_ACTIVITY_IMAGES.length]
  );
}

export default function LandlordBookingsPage(): ReactElement {
  const { notify } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  // Captured once so the "upcoming" count stays stable across re-renders
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;

    void getHostBookings().then((result) => {
      if (!active) {
        return;
      }

      setNow(Date.now());
      setBookings(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const confirmed = bookings.filter(
      (booking) => booking.status === "CONFIRMED",
    );
    const pending = bookings.filter((booking) => booking.status === "PENDING");
    const expectedIncome = confirmed.reduce(
      (total, booking) => total + booking.totalPrice,
      0,
    );
    const upcoming = confirmed.filter(
      (booking) => new Date(booking.startDate).getTime() > now,
    );

    return [
      {
        label: "Active stays",
        value: String(confirmed.length).padStart(2, "0"),
        trend: `${bookings.length} bookings in total`,
        icon: KeyRound,
        tone: "default" as const,
        tile: "primary" as const,
      },
      {
        label: "Pending requests",
        value: String(pending.length).padStart(2, "0"),
        trend: pending.length ? "Need a response" : "Nothing waiting",
        icon: FileCheck2,
        tone: "accentTint" as const,
        tile: "accent" as const,
      },
      {
        label: "Expected income",
        value: expectedIncome,
        trend: "From confirmed stays",
        icon: ArrowUpRight,
        tone: "primaryTint" as const,
        tile: "primary" as const,
      },
      {
        label: "Upcoming handovers",
        value: String(upcoming.length).padStart(2, "0"),
        trend: upcoming.length ? "Starting soon" : "None scheduled",
        icon: CalendarCheck,
        tone: "soft" as const,
        tile: "neutral" as const,
      },
    ];
  }, [bookings, now]);

  const timeline = useMemo(() => bookings.slice(0, 3), [bookings]);

  const changeStatus = async (
    booking: Booking,
    status: BookingStatus,
  ): Promise<void> => {
    setPendingId(booking.id);
    const result = await updateBookingStatus(booking.id, status);
    setPendingId(null);

    if (!result.data) {
      notify({
        title: "Booking not updated",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    const updated = result.data;
    setBookings((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );

    notify({
      title: `Booking ${STATUS_LABELS[status].toLowerCase()}`,
      variant: "success",
    });
  };

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
        {stats.map(({ label, value, trend, icon: Icon, tone, tile }) => (
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
        ))}
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

        {loadError ? (
          <p className="border-b border-border px-5 py-3 font-body text-xs text-red-700 sm:px-6">
            {loadError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted sm:px-6">
            Loading bookings...
          </p>
        ) : bookings.length === 0 ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted sm:px-6">
            No booking requests yet. They appear here once your listings are
            live.
          </p>
        ) : (
          bookings.map((booking, index) => {
            const tenantName = booking.tenant?.name ?? "Tenant";
            const isBusy = pendingId === booking.id;

            return (
              <article
                key={booking.id}
                className="grid gap-4 border-b border-border p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:grid-cols-[8rem_1fr] sm:items-center sm:p-6"
              >
                <div className="relative h-28 overflow-hidden rounded-lg bg-surface-soft sm:w-full">
                  <Image
                    src={coverImage(booking, index)}
                    alt={booking.propertyTitle}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone="primary">
                          REQ-{booking.id}
                        </StatusBadge>
                        <h3 className="font-body text-lg font-bold text-primary">
                          {booking.propertyTitle}
                        </h3>
                      </div>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                        <MapPin
                          size={15}
                          className="shrink-0 text-primary/60"
                        />
                        {booking.propertyAddress}
                      </p>
                    </div>
                    <StatusBadge tone={STATUS_TONES[booking.status]}>
                      {STATUS_LABELS[booking.status]}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-sm text-muted">
                      <span className="flex items-center gap-2">
                        <UsersRound size={15} className="text-primary/60" />
                        {tenantName}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock3 size={15} className="text-primary/60" />
                        {formatStayDates(booking)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {booking.status === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void changeStatus(booking, "CONFIRMED")
                            }
                            className="flex h-10 items-center gap-2 rounded-full px-4 font-body text-sm font-bold text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                          >
                            {isBusy ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Check size={16} />
                            )}
                            Confirm
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void changeStatus(booking, "CANCELLED")
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                            aria-label="Decline this request"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : null}

                      {booking.status === "CONFIRMED" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void changeStatus(booking, "COMPLETED")}
                          className="flex h-10 items-center gap-2 rounded-full px-4 font-body text-sm font-bold text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                        >
                          {isBusy ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <KeyRound size={16} />
                          )}
                          Mark complete
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label={`Message ${tenantName}`}
                      >
                        <MessageCircle size={18} />
                      </button>
                      <p className="font-display text-2xl font-bold text-primary">
                        <PropertyPrice value={booking.totalPrice} />
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
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
          {timeline.length === 0 ? (
            <p className="p-5 font-body text-sm text-muted sm:p-6">
              Booking activity will appear here.
            </p>
          ) : (
            timeline.map((booking) => (
              <article
                key={booking.id}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:p-6 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <IconTile tone="accent" size="lg" shape="circle">
                  <FileCheck2 size={20} />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="font-body text-sm font-bold text-primary">
                    {STATUS_LABELS[booking.status]}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-6 text-muted">
                    {booking.tenant?.name ?? "A tenant"} booked{" "}
                    {booking.propertyTitle}.
                  </p>
                  <p className="mt-3 font-body text-xs font-medium uppercase tracking-[0.12em] text-primary">
                    {formatRelativeTime(booking.createdAt)}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
