"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Check,
  Clock3,
  FileCheck2,
  FileText,
  KeyRound,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import ChatThread from "@/components/chat/ChatThread";
import PropertyPrice from "@/components/property/PropertyPrice";
import TenancyDocumentsDialog from "@/components/tenant/TenancyDocumentsDialog";
import { IconTile } from "@/components/ui/icon-tile";
import {
  StatusBadge,
  type StatusBadgeProps,
} from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  getHostBookings,
  updateBookingStatus,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";
import { TENANT_ACTIVITY_IMAGES } from "@/lib/tenantActivity";

// === Types

type TenancyStage = "active" | "past" | "request" | "upcoming";
type TenancyTab = "all" | TenancyStage;

interface TenancyTabItem {
  id: TenancyTab;
  label: string;
}

// === Constants

const TENANCY_TABS: TenancyTabItem[] = [
  { id: "all", label: "All" },
  { id: "request", label: "Requests" },
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
];

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

function coverImage(booking: Booking, index: number): string {
  return (
    booking.propertyImageUrl ??
    TENANT_ACTIVITY_IMAGES[index % TENANT_ACTIVITY_IMAGES.length]
  );
}

function getTenancyStage(booking: Booking, now: number): TenancyStage {
  if (booking.status === "PENDING") {
    return "request";
  }

  if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
    return "past";
  }

  return new Date(booking.startDate).getTime() > now ? "upcoming" : "active";
}

function matchesSearch(booking: Booking, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    booking.tenant?.name ?? "",
    booking.propertyTitle,
    booking.propertyAddress,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export default function LandlordBookingsPage(): ReactElement {
  const { notify } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TenancyTab>("all");
  const [query, setQuery] = useState("");
  // Captured once so the "upcoming" count stays stable across re-renders
  const [now, setNow] = useState(0);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [documentsBooking, setDocumentsBooking] = useState<Booking | null>(null);

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

  const visibleBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          (activeTab === "all" ||
            getTenancyStage(booking, now) === activeTab) &&
          matchesSearch(booking, query),
      ),
    [activeTab, bookings, now, query],
  );

  const countForTab = (tab: TenancyTab): number =>
    tab === "all"
      ? bookings.length
      : bookings.filter((booking) => getTenancyStage(booking, now) === tab)
          .length;

  const changeStatus = async (
    booking: Booking,
    status: BookingStatus,
  ): Promise<void> => {
    setPendingId(booking.id);
    const result = await updateBookingStatus(booking.id, status);
    setPendingId(null);

    if (!result.data) {
      notify({
        title: "Tenancy not updated",
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
      title: `Tenancy ${STATUS_LABELS[status].toLowerCase()}`,
      variant: "success",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <div className="flex flex-col gap-4 rounded-lg bg-bg p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="overflow-x-auto">
          <div
            className="flex min-w-max gap-1"
            role="tablist"
            aria-label="Tenancy status"
          >
            {TENANCY_TABS.map((tab) => {
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    active
                      ? "inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-body text-sm font-bold text-white"
                      : "inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-body text-sm font-bold text-muted hover:bg-primary/5 hover:text-primary"
                  }
                >
                  {tab.label}
                  <span
                    className={
                      active
                        ? "rounded-full bg-white/15 px-2 py-0.5 text-[11px]"
                        : "rounded-full bg-primary/5 px-2 py-0.5 text-[11px] text-primary"
                    }
                  >
                    {countForTab(tab.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Search tenancies</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tenant or property"
            className="h-12 w-full rounded-full border border-primary/10 bg-surface-soft pl-11 pr-4 font-body text-sm text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <section className="mt-7 min-w-0 overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">

        {loadError ? (
          <p className="border-b border-border px-5 py-3 font-body text-xs text-red-700 sm:px-6">
            {loadError}
          </p>
        ) : null}

        {isLoading ? (
          <div
            className="divide-y divide-primary/10 animate-pulse motion-reduce:animate-none"
            aria-label="Loading tenancies"
            aria-busy="true"
          >
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="grid h-36 gap-4 p-5 sm:grid-cols-[8rem_1fr] sm:p-6"
              >
                <div className="rounded-lg bg-skeleton-strong" />
                <div className="space-y-4 py-2">
                  <div className="h-4 w-2/5 rounded-full bg-skeleton" />
                  <div className="h-3 w-3/5 rounded-full bg-skeleton" />
                  <div className="h-3 w-1/3 rounded-full bg-skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="grid min-h-[28rem] place-items-center px-6 py-16 text-center">
            <div className="max-w-md">
              <IconTile
                size="lg"
                shape="circle"
                tone="accent"
                className="mx-auto h-20 w-20"
              >
                {query.trim() ? <Search size={52} /> : <FileCheck2 size={56} />}
              </IconTile>
              <h2 className="mt-6 font-display text-3xl font-bold text-primary">
                {query.trim()
                  ? "No matching tenancies"
                  : activeTab === "request"
                    ? "No requests waiting"
                    : "Nothing here yet"}
              </h2>
              <p className="mx-auto mt-3 font-body text-sm leading-6 text-muted">
                {query.trim()
                  ? "Try another tenant name, property, or location."
                  : activeTab === "request"
                    ? "New tenant requests will appear here when they arrive."
                    : "Tenancies in this stage will appear here automatically."}
              </p>
            </div>
          </div>
        ) : (
          visibleBookings.map((booking, index) => {
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

                      {booking.status === "CONFIRMED" ||
                      booking.status === "COMPLETED" ? (
                        <button
                          type="button"
                          onClick={() => setDocumentsBooking(booking)}
                          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          aria-label={`Paperwork for ${booking.propertyTitle}`}
                        >
                          <FileText size={18} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setChatBooking(booking)}
                        disabled={booking.tenant === null}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
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

      {chatBooking && chatBooking.tenant ? (
        <ChatThread
          conversationId={`booking-${chatBooking.id}`}
          otherUserId={chatBooking.tenant.id}
          propertyId={chatBooking.propertyId}
          otherPartyName={chatBooking.tenant.name}
          otherPartyRole="Tenant"
          propertyName={chatBooking.propertyTitle}
          onClose={() => setChatBooking(null)}
        />
      ) : null}

      {documentsBooking ? (
        <TenancyDocumentsDialog
          bookingId={documentsBooking.id}
          propertyTitle={documentsBooking.propertyTitle}
          open
          onClose={() => setDocumentsBooking(null)}
        />
      ) : null}
    </main>
  );
}
