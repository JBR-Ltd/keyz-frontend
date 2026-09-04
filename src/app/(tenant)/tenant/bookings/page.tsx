"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  CalendarCheck,
  Clock3,
  Landmark,
  MapPin,
  MessageCircle,
  MessageSquareText,
} from "lucide-react";
import Image from "next/image";
import ChatThread from "@/components/chat/ChatThread";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { utilityCardVariants } from "@/components/ui/utility-card";
import { getMyBookings, type Booking, type BookingStatus } from "@/lib/bookings";
import { getSavedListings } from "@/lib/savedListings";
import { TENANT_ACTIVITY_IMAGES } from "@/lib/tenantActivity";
import {
  ChatPartyRole,
  ConversationSummary,
  getAllConversations,
  getConversationId,
  getCurrentChatUser,
  subscribeToChatStorage,
} from "@/lib/chat/chatStorage";

interface ActiveChatThread {
  conversationId: string;
  otherUserId: number | null;
  propertyId: number;
  otherPartyName: string;
  otherPartyRole: ChatPartyRole;
  propertyName: string;
}

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
      year: "numeric",
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
  if (days < 30) return `${days} days ago`;

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

/** Cover image falls back to the stock set when a listing has no photo yet. */
function coverImage(booking: Booking, index: number): string {
  return (
    booking.propertyImageUrl ??
    TENANT_ACTIVITY_IMAGES[index % TENANT_ACTIVITY_IMAGES.length]
  );
}

export default function TenantBookingsPage(): ReactElement {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeThread, setActiveThread] = useState<ActiveChatThread | null>(
    null,
  );
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const currentUser = getCurrentChatUser();

  useEffect(() => {
    let active = true;

    function loadConversations(): void {
      void getAllConversations().then((result) => {
        if (!active) {
          return;
        }

        setConversations(result.data);
        setStorageUnavailable(result.unavailable);
      });
    }

    loadConversations();

    const unsubscribe = subscribeToChatStorage(loadConversations);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      const [bookingResult, savedResult] = await Promise.all([
        getMyBookings(),
        getSavedListings(),
      ]);

      if (!active) {
        return;
      }

      setBookings(bookingResult.data);
      setSavedCount(savedResult.data.length);
      setLoadError(bookingResult.message ?? "");
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = bookings.filter(
      (booking) => booking.status === "CONFIRMED",
    ).length;
    const pending = bookings.filter(
      (booking) => booking.status === "PENDING",
    ).length;
    const committed = bookings
      .filter((booking) => booking.status !== "CANCELLED")
      .reduce((total, booking) => total + booking.totalPrice, 0);

    return [
      {
        label: "Active Rentals",
        value: String(active).padStart(2, "0"),
        trend: `${bookings.length} in total`,
        direction: "up" as const,
        icon: CalendarCheck,
        tone: "soft" as const,
        tile: "primary" as const,
      },
      {
        label: "Pending Requests",
        value: String(pending).padStart(2, "0"),
        trend: "Awaiting response",
        direction: "up" as const,
        icon: MessageSquareText,
        tone: "soft" as const,
        tile: "primary" as const,
      },
      {
        label: "Committed Spend",
        value: committed,
        trend: "Across your stays",
        direction: "down" as const,
        icon: Landmark,
        tone: "soft" as const,
        tile: "primary" as const,
      },
      {
        label: "Saved Listings",
        value: String(savedCount).padStart(2, "0"),
        trend: "Ready to book",
        direction: "up" as const,
        icon: Bookmark,
        tone: "default" as const,
        tile: "primary" as const,
      },
    ];
  }, [bookings, savedCount]);

  const timeline = useMemo(() => bookings.slice(0, 3), [bookings]);

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Your rental desk
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Bookings
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Track your rentals, property requests, and booking status from one
          scannable workspace.
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(
          ({ label, value, trend, direction, icon: Icon, tone, tile }) => {
            const TrendIcon =
              direction === "up" ? ArrowUpRight : ArrowDownRight;

            return (
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
                <p
                  className={`mt-4 flex items-center gap-2 font-body text-xs font-bold ${direction === "up" ? "text-primary" : "text-muted"}`}
                >
                  <TrendIcon size={15} />
                  {trend}
                </p>
              </article>
            );
          },
        )}
      </section>

      <section className="mt-10 min-w-0 overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Tenant activity
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary">
            Your Rentals
          </h2>
        </div>

        {storageUnavailable ? (
          <p className="border-b border-border px-5 py-3 font-body text-xs text-primary sm:px-6">
            Local message storage is unavailable in this browser session.
          </p>
        ) : null}

        {loadError ? (
          <p className="border-b border-border px-5 py-3 font-body text-xs text-red-700 sm:px-6">
            {loadError}
          </p>
        ) : null}

        <div>
          {isLoading ? (
            <p className="px-5 py-10 text-center font-body text-sm text-muted sm:px-6">
              Loading your bookings...
            </p>
          ) : bookings.length === 0 ? (
            <p className="px-5 py-10 text-center font-body text-sm text-muted sm:px-6">
              You have no bookings yet. Browse verified homes to make your first
              request.
            </p>
          ) : (
            bookings.map((booking, index) => {
              const hostId = booking.host ? String(booking.host.id) : "host";
              const conversationId = getConversationId(
                String(booking.propertyId),
                [currentUser.id, hostId],
              );
              const conversation = conversations.find(
                (summary) => summary.conversationId === conversationId,
              );
              const hasUnread = Boolean(conversation?.unreadCount);
              const hostName = booking.host?.name ?? "Host";

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
                      className="object-cover transition-all duration-200 ease-in-out"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone="primary">Rental</StatusBadge>
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
                      <div className="flex items-center gap-2 font-body text-sm text-muted">
                        <Clock3
                          size={15}
                          className="shrink-0 text-primary/60"
                        />
                        <span>{formatStayDates(booking)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveThread({
                              conversationId,
                              otherUserId: booking.host?.id ?? null,
                              propertyId: booking.propertyId,
                              otherPartyName: hostName,
                              otherPartyRole:
                                booking.host?.role === "AGENT"
                                  ? "Agent"
                                  : "Landlord",
                              propertyName: booking.propertyTitle,
                            })
                          }
                          className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          aria-label={`Message ${hostName}`}
                        >
                          <MessageCircle size={18} aria-hidden="true" />
                          {hasUnread ? (
                            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                          ) : null}
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
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Timeline
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary">
            Recent Activity
          </h2>
        </div>
        <div className="grid md:grid-cols-3">
          {timeline.length === 0 ? (
            <p className="p-5 font-body text-sm text-muted sm:p-6">
              Your booking activity will appear here.
            </p>
          ) : (
            timeline.map((booking) => (
              <article
                key={booking.id}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md md:border-b-0 md:border-r md:last:border-r-0 sm:p-6"
              >
                <IconTile tone="primary" size="lg" shape="circle">
                  <CalendarCheck size={20} />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="font-body text-sm font-bold text-primary">
                    {STATUS_LABELS[booking.status]}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-6 text-muted">
                    {booking.propertyTitle}
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

      <ChatThread
        conversationId={activeThread?.conversationId ?? null}
        otherUserId={activeThread?.otherUserId ?? null}
        propertyId={activeThread?.propertyId}
        otherPartyName={activeThread?.otherPartyName ?? ""}
        otherPartyRole={activeThread?.otherPartyRole ?? "Agent"}
        propertyName={activeThread?.propertyName ?? ""}
        onClose={() => setActiveThread(null)}
      />
    </main>
  );
}
