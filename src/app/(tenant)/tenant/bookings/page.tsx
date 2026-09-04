"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  House,
  MapPin,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ChatThread from "@/components/chat/ChatThread";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { getMyBookings, type Booking, type BookingStatus } from "@/lib/bookings";
import {
  type ChatPartyRole,
  getConversationId,
  getCurrentChatUser,
} from "@/lib/chat/chatStorage";
import { TENANT_ACTIVITY_IMAGES } from "@/lib/tenantActivity";

// === Types

interface ActiveChatThread {
  conversationId: string;
  otherPartyName: string;
  otherPartyRole: ChatPartyRole;
  propertyName: string;
}

// === Constants

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
  PENDING: "Pending confirmation",
  CONFIRMED: "Active tenancy",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const BOOKING_PRIORITY: Record<BookingStatus, number> = {
  CONFIRMED: 0,
  PENDING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

// === Helpers

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStayDates(booking: Booking): string {
  return `${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}`;
}

function formatRelativeTime(value: string | null): string {
  if (!value) return "Recently";

  const days = Math.floor(
    (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;

  return formatDate(value);
}

function coverImage(booking: Booking, index: number): string {
  return (
    booking.propertyImageUrl ??
    TENANT_ACTIVITY_IMAGES[index % TENANT_ACTIVITY_IMAGES.length]
  );
}

function getHostRole(booking: Booking): ChatPartyRole {
  return booking.host?.role === "AGENT" ? "Agent" : "Landlord";
}

// === Component

export default function TenantBookingsPage(): ReactElement {
  const { notify } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeThread, setActiveThread] = useState<ActiveChatThread | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const currentUser = getCurrentChatUser();

  useEffect(() => {
    let active = true;

    const loadBookings = async (): Promise<void> => {
      setIsLoading(true);
      setLoadError("");
      const result = await getMyBookings();

      if (!active) return;

      setBookings(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    };

    void loadBookings();

    return () => {
      active = false;
    };
  }, [retryKey]);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((left, right) => {
        const priorityDifference =
          BOOKING_PRIORITY[left.status] - BOOKING_PRIORITY[right.status];

        if (priorityDifference !== 0) return priorityDifference;

        return (
          new Date(right.createdAt ?? right.startDate).getTime() -
          new Date(left.createdAt ?? left.startDate).getTime()
        );
      }),
    [bookings],
  );
  const primaryBooking = sortedBookings[0] ?? null;
  const bookingHistory = primaryBooking
    ? sortedBookings.filter((booking) => booking.id !== primaryBooking.id)
    : [];
  const hostName = primaryBooking?.host?.name ?? "Property host";
  const hostInitials = hostName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const openHostChat = (): void => {
    if (!primaryBooking?.host) return;

    setActiveThread({
      conversationId: getConversationId(String(primaryBooking.propertyId), [
        currentUser.id,
        String(primaryBooking.host.id),
      ]),
      otherPartyName: primaryBooking.host.name,
      otherPartyRole: getHostRole(primaryBooking),
      propertyName: primaryBooking.propertyTitle,
    });
  };

  const showUnavailableNotice = (feature: "documents" | "maintenance"): void => {
    notify({
      title:
        feature === "documents"
          ? "Lease documents are not available yet"
          : "Maintenance reporting is not available yet",
      description:
        feature === "documents"
          ? "Documents will appear here when lease document support is connected."
          : "Contact your landlord or agent directly if you need help with the property.",
      variant: "error",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-surface-soft px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-14">
      <div className="mx-auto max-w-[90rem]">
        {isLoading ? (
          <div className="grid animate-pulse gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.75fr)]">
            <div className="h-[34rem] rounded-2xl bg-bg" />
            <div className="grid gap-5">
              <div className="h-64 rounded-2xl bg-bg" />
              <div className="h-64 rounded-2xl bg-bg" />
            </div>
          </div>
        ) : loadError ? (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-bg px-6 py-12 text-center shadow-sm">
            <IconTile tone="neutral" size="lg" shape="circle">
              <RotateCcw size={22} />
            </IconTile>
            <h2 className="mt-5 font-display text-2xl font-bold text-primary">
              We could not load your home
            </h2>
            <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((current) => current + 1)}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Try again
            </button>
          </section>
        ) : !primaryBooking ? (
          <section className="flex min-h-[28rem] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-primary">
              <House size={28} aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-display text-3xl font-bold text-primary">
              Your next home will appear here
            </h2>
            <p className="mt-3 max-w-md font-body text-sm leading-6 text-muted">
              Once a property request is made, you can follow its progress and
              manage your tenancy from this page.
            </p>
            <Link
              href="/tenant/browse"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Browse homes
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.75fr)]">
              <article className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
                <div className="relative h-64 bg-primary sm:h-80">
                  <Image
                    src={coverImage(primaryBooking, 0)}
                    alt={primaryBooking.propertyTitle}
                    fill
                    priority
                    sizes="(max-width: 1280px) 100vw, 65vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
                    <div className="min-w-0 text-white">
                      <StatusBadge tone={STATUS_TONES[primaryBooking.status]}>
                        {STATUS_LABELS[primaryBooking.status]}
                      </StatusBadge>
                      <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
                        {primaryBooking.propertyTitle}
                      </h2>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-white/75">
                        <MapPin size={16} aria-hidden="true" />
                        {primaryBooking.propertyAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-surface-soft p-4">
                      <CalendarDays size={19} className="text-primary" />
                      <p className="mt-3 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                        Starts
                      </p>
                      <p className="mt-2 font-body text-sm font-bold text-primary">
                        {formatDate(primaryBooking.startDate)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-soft p-4">
                      <Clock3 size={19} className="text-primary" />
                      <p className="mt-3 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                        Ends
                      </p>
                      <p className="mt-2 font-body text-sm font-bold text-primary">
                        {formatDate(primaryBooking.endDate)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-soft p-4">
                      <CircleDollarSign size={19} className="text-primary" />
                      <p className="mt-3 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                        Booking amount
                      </p>
                      <p className="mt-2 font-display text-lg font-bold text-primary">
                        <PropertyPrice value={primaryBooking.totalPrice} />
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/property/${primaryBooking.propertyId}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      View property
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={openHostChat}
                      disabled={!primaryBooking.host}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 px-5 py-2.5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      Message host
                    </button>
                  </div>
                </div>
              </article>

              <div className="grid content-start gap-5">
                <article className="rounded-2xl border border-border bg-bg p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <IconTile tone="primary" size="lg">
                      <CircleDollarSign size={21} />
                    </IconTile>
                    <StatusBadge tone={STATUS_TONES[primaryBooking.status]}>
                      {STATUS_LABELS[primaryBooking.status]}
                    </StatusBadge>
                  </div>
                  <p className="mt-6 font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                    Payment overview
                  </p>
                  <p className="mt-3 font-display text-3xl font-bold text-primary">
                    <PropertyPrice value={primaryBooking.totalPrice} />
                  </p>
                  <p className="mt-3 font-body text-sm leading-6 text-muted">
                    This is the total amount recorded for this booking. Detailed
                    rent schedules and receipts are not available yet.
                  </p>
                </article>

                <article className="rounded-2xl border border-border bg-bg p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <IconTile tone="neutral" size="lg">
                      <FileText size={21} />
                    </IconTile>
                    <button
                      type="button"
                      onClick={() => showUnavailableNotice("documents")}
                      className="font-body text-xs font-bold text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      View documents
                    </button>
                  </div>
                  <h2 className="mt-6 font-display text-2xl font-bold text-primary">
                    Lease information
                  </h2>
                  <p className="mt-3 font-body text-sm leading-6 text-muted">
                    {formatStayDates(primaryBooking)}
                  </p>
                  <div className="mt-5 rounded-xl bg-surface-soft p-4">
                    <p className="font-body text-sm font-bold text-primary">
                      No lease document available
                    </p>
                    <p className="mt-1 font-body text-xs leading-5 text-muted">
                      Uploaded agreements will appear here when document support
                      is connected.
                    </p>
                  </div>
                </article>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-border bg-bg p-6 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <IconTile tone="primary" size="lg">
                      <Wrench size={21} />
                    </IconTile>
                    <div>
                      <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                        Property support
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-bold text-primary">
                        Maintenance
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showUnavailableNotice("maintenance")}
                    className="min-h-10 rounded-full border border-primary/20 px-4 py-2 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Report an issue
                  </button>
                </div>
                <div className="mt-6 rounded-xl bg-surface-soft px-5 py-6">
                  <p className="font-body text-sm font-bold text-primary">
                    Maintenance requests are not connected yet
                  </p>
                  <p className="mt-2 font-body text-sm leading-6 text-muted">
                    Until reporting is available here, contact {hostName} for
                    help with your home.
                  </p>
                </div>
              </article>

              <article className="rounded-2xl border border-border bg-bg p-6 shadow-sm sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary font-body text-sm font-bold text-white">
                    {hostInitials || "H"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                      Property contact
                    </p>
                    <h2 className="mt-2 truncate font-display text-2xl font-bold text-primary">
                      {hostName}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-muted">
                      {primaryBooking.host?.identityVerified ? (
                        <ShieldCheck
                          size={15}
                          className="text-accent-alt"
                          aria-hidden="true"
                        />
                      ) : null}
                      {getHostRole(primaryBooking)}
                      {primaryBooking.host?.identityVerified
                        ? " · Verified"
                        : ""}
                    </p>
                  </div>
                </div>
                <p className="mt-6 font-body text-sm leading-6 text-muted">
                  Contact your property host about access, your tenancy, or
                  support with the home.
                </p>
                <button
                  type="button"
                  onClick={openHostChat}
                  disabled={!primaryBooking.host}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  Message {primaryBooking.host ? hostName.split(" ")[0] : "host"}
                </button>
              </article>
            </section>

            {bookingHistory.length > 0 ? (
              <section className="mt-10 overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
                <div className="border-b border-border px-6 py-6 sm:px-7">
                  <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                    Rental history
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-primary">
                    Other bookings
                  </h2>
                </div>
                <div>
                  {bookingHistory.map((booking, index) => (
                    <Link
                      key={booking.id}
                      href={`/property/${booking.propertyId}`}
                      className="grid gap-4 border-b border-border p-5 transition-colors last:border-b-0 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:grid-cols-[5rem_1fr_auto] sm:items-center sm:px-7"
                    >
                      <span className="relative h-20 overflow-hidden rounded-xl bg-surface-soft">
                        <Image
                          src={coverImage(booking, index + 1)}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-body text-base font-bold text-primary">
                          {booking.propertyTitle}
                        </span>
                        <span className="mt-1 block font-body text-sm text-muted">
                          {formatStayDates(booking)}
                        </span>
                        <span className="mt-2 block font-body text-xs font-medium text-muted">
                          Updated {formatRelativeTime(booking.createdAt)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-3 sm:justify-end">
                        <StatusBadge tone={STATUS_TONES[booking.status]}>
                          {STATUS_LABELS[booking.status]}
                        </StatusBadge>
                        <ChevronRight
                          size={18}
                          className="text-muted"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      <ChatThread
        conversationId={activeThread?.conversationId ?? null}
        otherPartyName={activeThread?.otherPartyName ?? ""}
        otherPartyRole={activeThread?.otherPartyRole ?? "Agent"}
        propertyName={activeThread?.propertyName ?? ""}
        onClose={() => setActiveThread(null)}
      />
    </main>
  );
}
