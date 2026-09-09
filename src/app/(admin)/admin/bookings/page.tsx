"use client";

import { useCallback, type ReactElement } from "react";
import { CalendarRange, MapPin } from "lucide-react";
import AdminQueueShell from "@/components/admin/AdminQueueShell";
import PropertyPrice from "@/components/property/PropertyPrice";
import { StatusBadge } from "@/components/ui/status-badge";
import { searchBookings } from "@/lib/admin";
import type { Booking, BookingStatus } from "@/lib/bookings";
import { useAdminSearch } from "@/lib/adminSearch";

const STATUS_OPTIONS = [
  { label: "Every status", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_TONES: Record<
  BookingStatus,
  "accent" | "danger" | "neutral" | "primary"
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

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBookingsPage(): ReactElement {
  const search = useAdminSearch<Booking>(searchBookings);
  const { setStatus } = search;
  const onStatusChange = useCallback(
    (next: string) => setStatus(next === "all" ? "" : next),
    [setStatus],
  );

  return (
    <AdminQueueShell
      eyebrow="Admin portal"
      title="Bookings"
      intro="Every booking on the platform. Search by listing, address or the name of either party."
      searchLabel="Search bookings"
      searchPlaceholder="Listing, address or a person's name"
      statusOptions={STATUS_OPTIONS}
      status={search.status || "all"}
      onStatusChange={onStatusChange}
      query={search.query}
      onQueryChange={search.setQuery}
      page={search.page}
      totalPages={search.totalPages}
      totalItems={search.totalItems}
      onPageChange={search.goToPage}
      isLoading={search.isLoading}
      isSearching={search.isSearching}
      isEmpty={search.items.length === 0}
      emptyMessage="No booking matches that."
      error={search.error}
    >
      {search.items.map((booking) => (
        <article
          key={booking.id}
          className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={STATUS_TONES[booking.status]}>
                  {STATUS_LABELS[booking.status]}
                </StatusBadge>
                <span className="font-body text-xs text-muted">
                  #{booking.id}
                </span>
              </div>
              <h2 className="mt-3 font-body text-lg font-bold text-primary">
                {booking.propertyTitle}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-muted">
                <MapPin size={14} aria-hidden="true" />
                {booking.propertyAddress}
              </p>
            </div>

            <p className="font-display text-2xl font-bold text-primary">
              <PropertyPrice value={booking.totalPrice} />
            </p>
          </div>

          <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div>
              <dt className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Tenant
              </dt>
              <dd className="mt-1 font-body text-sm text-primary">
                {booking.tenant?.name ?? "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Host
              </dt>
              <dd className="mt-1 font-body text-sm text-primary">
                {booking.host?.name ?? "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Dates
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 font-body text-sm text-primary">
                <CalendarRange size={14} aria-hidden="true" />
                {formatDate(booking.startDate)} to {formatDate(booking.endDate)}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </AdminQueueShell>
  );
}
