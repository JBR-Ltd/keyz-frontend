"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  ImageOff,
  KeyRound,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import Image from "next/image";
import ChatThread from "@/components/chat/ChatThread";
import OverlayPortal from "@/components/ui/OverlayPortal";
import PropertyPrice from "@/components/property/PropertyPrice";
import TenancyDocumentsDialog from "@/components/tenant/TenancyDocumentsDialog";
import TenancyRecordsDialog from "@/components/tenancy/TenancyRecordsDialog";
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
import AcceptBookingDialog, {
  type AcceptDialogMode,
} from "@/components/bookings/AcceptBookingDialog";
import CancelBookingDialog from "@/components/bookings/CancelBookingDialog";
import DepositClaimDialog from "@/components/bookings/DepositClaimDialog";
import PaymentStatusBadge from "@/components/bookings/PaymentStatusBadge";
import {
  describePaymentForHost,
  moveInLocked,
  stageFromLifecycle,
} from "@/lib/bookingPayments";
import { useDialogFocus } from "@/lib/useDialogFocus";

// === Types

type TenancyStage = "active" | "past" | "request" | "upcoming";
type TenancyTab = "all" | TenancyStage;

interface TenancyTabItem {
  id: TenancyTab;
  label: string;
}

interface BookingCoverProps {
  booking: Booking;
  fallbackIndex: number;
}

interface BookingDetailsDrawerProps {
  booking: Booking | null;
  isUpdating: boolean;
  onClose: () => void;
  onDocuments: (booking: Booking) => void;
  onMessage: (booking: Booking) => void;
  onRecords: (booking: Booking) => void;
  now: number;
  onAccept: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onClaimDeposit: (booking: Booking) => void;
  onChangeMoveIn: (booking: Booking) => void;
  onStatusChange: (booking: Booking, status: BookingStatus) => void;
}

interface AcceptTarget {
  booking: Booking;
  mode: AcceptDialogMode;
}

// === Constants

/** Matches the server's default page, so "show more" asks for the next one. */
const HOST_PAGE_SIZE = 100;

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

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStayDates(booking: Booking): string {
  if (booking.bookingKind === "RENTAL_REQUEST" || !booking.endDate) {
    if (booking.tenancyStartDate) {
      return `Moving in ${formatDate(booking.tenancyStartDate)}`;
    }

    return booking.preferredMoveInDate
      ? `Move in ${formatDate(booking.preferredMoveInDate)}`
      : "Flexible move-in";
  }

  return booking.startDate
    ? `${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}`
    : "Flexible move-in";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getTenancyStage(booking: Booking, now: number): TenancyStage {
  const fromServer = stageFromLifecycle(booking);

  if (fromServer) {
    return fromServer;
  }

  if (booking.status === "PENDING") {
    return "request";
  }

  if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
    return "past";
  }

  if (booking.bookingKind === "RENTAL_REQUEST" || !booking.startDate) {
    return "active";
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

function BookingCover({
  booking,
  fallbackIndex,
}: BookingCoverProps): ReactElement {
  const fallback =
    TENANT_ACTIVITY_IMAGES[fallbackIndex % TENANT_ACTIVITY_IMAGES.length];
  const [imageSrc, setImageSrc] = useState(
    booking.propertyImageUrl ?? fallback,
  );
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed && imageSrc === fallback) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-surface-soft text-muted">
        <ImageOff size={20} aria-hidden="true" />
      </span>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={booking.propertyTitle}
      fill
      sizes="(max-width: 767px) 100vw, 104px"
      className="object-cover"
      onError={() => {
        if (imageSrc !== fallback) {
          setImageSrc(fallback);
          return;
        }

        setHasFailed(true);
      }}
    />
  );
}

function BookingDetailsDrawer({
  booking,
  isUpdating,
  onClose,
  onDocuments,
  onMessage,
  onRecords,
  now,
  onAccept,
  onCancel,
  onClaimDeposit,
  onChangeMoveIn,
  onStatusChange,
}: BookingDetailsDrawerProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const drawerRef = useDialogFocus<HTMLElement>(booking !== null);

  useEffect(() => {
    if (!booking) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [booking, onClose]);

  return (
    <AnimatePresence>
      {booking ? (
        <OverlayPortal>
          <div className="fixed inset-0 z-[120]">
            <motion.button
              type="button"
              className="modal-backdrop absolute inset-0"
              aria-label="Close tenancy details"
              onClick={onClose}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="landlord-tenancy-title"
              className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-bg shadow-2xl"
              initial={reduceMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <div className="relative aspect-[16/7] bg-surface-soft">
                <BookingCover booking={booking} fallbackIndex={0} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg text-primary shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Close details"
                >
                  <X size={20} aria-hidden="true" />
                </button>
                <StatusBadge
                  tone={STATUS_TONES[booking.status]}
                  className="absolute bottom-5 left-5"
                >
                  {STATUS_LABELS[booking.status]}
                </StatusBadge>
              </div>

              <div className="p-6 sm:p-8">
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                  Tenancy details
                </p>
                <h2
                  id="landlord-tenancy-title"
                  className="mt-3 font-display text-3xl font-bold text-primary"
                >
                  {booking.propertyTitle}
                </h2>
                <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                  <MapPin size={15} aria-hidden="true" />
                  {booking.propertyAddress}
                </p>
                {booking.unitLabel ? (
                  <p className="mt-2 font-body text-sm font-semibold text-primary">
                    Assigned {booking.unitLabel}
                  </p>
                ) : null}

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-surface-soft p-4">
                    <UserRound size={19} className="text-accent-alt" />
                    <p className="mt-3 font-body text-xs font-medium text-muted">
                      Tenant
                    </p>
                    <p className="mt-1 font-body text-sm font-bold text-primary">
                      {booking.tenant?.name ?? "Tenant"}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 font-body text-xs text-muted">
                      <ShieldCheck size={13} aria-hidden="true" />
                      {booking.tenant?.identityVerified
                        ? "Identity verified"
                        : "Verification incomplete"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-soft p-4">
                    <WalletCards size={19} className="text-accent-alt" />
                    <p className="mt-3 font-body text-xs font-medium text-muted">
                      Request total
                    </p>
                    <p className="mt-1 font-body text-sm font-bold text-primary">
                      <PropertyPrice value={booking.totalPrice} />
                    </p>
                    <p className="mt-1 font-body text-xs text-muted">
                      Calculated by the booking service
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-primary/10 p-5">
                  <div className="flex items-start gap-3">
                    <CalendarDays
                      size={19}
                      className="mt-0.5 text-accent-alt"
                    />
                    <div>
                      <p className="font-body text-xs font-medium text-muted">
                        Proposed tenancy period
                      </p>
                      <p className="mt-1 font-body text-sm font-bold text-primary">
                        {formatStayDates(booking)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/10 p-5">
                  <div className="min-w-0">
                    <p className="font-body text-xs font-medium text-muted">
                      Payment
                    </p>
                    <p className="mt-1 font-body text-sm font-bold text-primary">
                      {describePaymentForHost(booking, now)}
                    </p>
                  </div>
                  <PaymentStatusBadge
                    audience="host"
                    booking={booking}
                    now={now}
                  />
                </div>

                {booking.cancellationReason ? (
                  <p className="mt-3 rounded-xl bg-surface-soft p-4 font-body text-sm leading-6 text-primary">
                    Reason given: &ldquo;{booking.cancellationReason}&rdquo;
                  </p>
                ) : null}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {booking.status === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onAccept(booking)}
                        disabled={isUpdating}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <ArrowRight size={17} />
                        )}
                        Confirm request
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(booking)}
                        disabled={isUpdating}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-red-700/25 px-5 font-body text-sm font-bold text-red-700 transition-colors hover:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                      >
                        Decline
                      </button>
                    </>
                  ) : null}
                  {booking.status === "CONFIRMED" ? (
                    <button
                      type="button"
                      onClick={() => onStatusChange(booking, "COMPLETED")}
                      disabled={isUpdating}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                    >
                      {isUpdating ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <KeyRound size={17} />
                      )}
                      Mark complete
                    </button>
                  ) : null}
                  {booking.status === "CONFIRMED" &&
                  booking.bookingKind !== "SHORT_STAY" &&
                  !moveInLocked(booking) ? (
                    <button
                      type="button"
                      onClick={() => onChangeMoveIn(booking)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <CalendarDays size={16} aria-hidden="true" />
                      Change move-in
                    </button>
                  ) : null}
                  {booking.status === "CONFIRMED" ? (
                    <button
                      type="button"
                      onClick={() => onCancel(booking)}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-red-700/25 px-5 font-body text-sm font-bold text-red-700 transition-colors hover:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Cancel booking
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onMessage(booking)}
                    disabled={booking.tenant === null}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    Message tenant
                  </button>
                  {booking.status === "CONFIRMED" ||
                  booking.status === "COMPLETED" ? (
                    <button
                      type="button"
                      onClick={() => onDocuments(booking)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <FileText size={16} aria-hidden="true" />
                      Paperwork
                    </button>
                  ) : null}
                  {booking.status === "CONFIRMED" ||
                  booking.status === "COMPLETED" ? (
                    <button
                      type="button"
                      onClick={() => onRecords(booking)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {booking.bookingKind === "SHORT_STAY"
                        ? "Condition reports"
                        : "Agreement and reports"}
                    </button>
                  ) : null}
                  {booking.depositStatus === "HELD" &&
                  booking.status === "COMPLETED" ? (
                    <button
                      type="button"
                      onClick={() => onClaimDeposit(booking)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Claim against deposit
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.aside>
          </div>
        </OverlayPortal>
      ) : null}
    </AnimatePresence>
  );
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
  const [recordsBooking, setRecordsBooking] = useState<Booking | null>(null);
  const [documentsBooking, setDocumentsBooking] = useState<Booking | null>(
    null,
  );
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [accepting, setAccepting] = useState<AcceptTarget | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [claiming, setClaiming] = useState<Booking | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;

    void getHostBookings().then((result) => {
      if (!active) {
        return;
      }

      setNow(Date.now());
      setBookings(result.data);
      setTotal(result.total ?? result.data.length);
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

  const applyUpdate = (updated: Booking): void => {
    setBookings((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelectedBooking((current) =>
      current?.id === updated.id ? updated : current,
    );
  };

  // Accepting a rental closes the other requests on that home, so the list is re-read
  const refresh = async (): Promise<void> => {
    const result = await getHostBookings();

    if (!result.message) {
      setBookings(result.data);
      setTotal(result.total ?? result.data.length);
    }
  };

  const loadMore = async (): Promise<void> => {
    setIsLoadingMore(true);
    const result = await getHostBookings({
      page: Math.floor(bookings.length / HOST_PAGE_SIZE),
      size: HOST_PAGE_SIZE,
    });
    setIsLoadingMore(false);

    if (result.message) {
      notify({
        title: "More tenancies could not load",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setBookings((current) => {
      const known = new Set(current.map((item) => item.id));
      return [...current, ...result.data.filter((item) => !known.has(item.id))];
    });
  };

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
    setSelectedBooking((current) =>
      current?.id === updated.id ? updated : current,
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

      <section className="mt-7 min-w-0 overflow-hidden rounded-xl border border-border/70 bg-[var(--color-bg)] shadow-sm">
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
                className="grid h-28 gap-4 p-5 md:grid-cols-[6.5rem_1fr] md:p-6"
              >
                <div className="rounded-xl bg-skeleton-strong" />
                <div className="flex items-center justify-between gap-8 py-2">
                  <div className="w-full max-w-xl space-y-3">
                    <div className="h-4 w-2/5 rounded-full bg-skeleton" />
                    <div className="h-3 w-3/5 rounded-full bg-skeleton" />
                    <div className="h-3 w-1/3 rounded-full bg-skeleton" />
                  </div>
                  <div className="hidden h-10 w-32 rounded-full bg-skeleton md:block" />
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
          <>
            <div className="hidden border-b border-border/70 bg-surface-soft/55 px-5 py-3 font-body text-[11px] font-bold uppercase tracking-[0.14em] text-muted xl:grid xl:grid-cols-[minmax(19rem,1.6fr)_minmax(9rem,0.7fr)_minmax(10rem,0.75fr)_minmax(7rem,0.5fr)_minmax(9rem,auto)] xl:gap-5 xl:px-6">
              <span>Property</span>
              <span>Tenant</span>
              <span>Tenancy period</span>
              <span>Request total</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-primary/10">
              {visibleBookings.map((booking, index) => {
                const tenantName = booking.tenant?.name ?? "Tenant";
                const isBusy = pendingId === booking.id;

                return (
                  <article
                    key={booking.id}
                    className="grid gap-5 p-5 transition-colors hover:bg-surface-soft/45 md:grid-cols-[6.5rem_minmax(0,1fr)] md:items-center md:px-6 md:py-6 xl:grid-cols-[minmax(19rem,1.6fr)_minmax(9rem,0.7fr)_minmax(10rem,0.75fr)_minmax(7rem,0.5fr)_minmax(9rem,auto)]"
                  >
                    <div className="flex min-w-0 items-center gap-4 md:col-span-2 xl:col-span-1">
                      <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-surface-soft">
                        <BookingCover booking={booking} fallbackIndex={index} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone={STATUS_TONES[booking.status]}>
                            {STATUS_LABELS[booking.status]}
                          </StatusBadge>
                          <span className="font-body text-[11px] font-bold text-muted">
                            REQ-{booking.id}
                          </span>
                          <PaymentStatusBadge
                            audience="host"
                            booking={booking}
                            now={now}
                          />
                        </div>
                        <h3 className="mt-2 line-clamp-2 font-body text-sm font-bold leading-5 text-primary">
                          {booking.propertyTitle}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 truncate font-body text-xs text-muted">
                          <MapPin
                            size={13}
                            className="shrink-0 text-accent-alt"
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            {booking.propertyAddress}
                          </span>
                        </p>
                        {booking.unitLabel ? (
                          <p className="mt-1 font-body text-xs font-semibold text-primary">
                            {booking.unitLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/5 font-display text-xs font-bold text-primary">
                        {getInitials(tenantName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-body text-sm font-bold text-primary">
                          {tenantName}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 font-body text-xs text-muted">
                          <ShieldCheck size={13} aria-hidden="true" />
                          {booking.tenant?.identityVerified
                            ? "Verified"
                            : "Not verified"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 font-body text-xs">
                      <p className="flex items-baseline justify-between gap-3 xl:block">
                        <span className="text-muted">Move in</span>
                        <span className="font-bold text-primary xl:mt-0.5 xl:block">
                          {booking.tenancyStartDate
                            ? formatDate(booking.tenancyStartDate)
                            : booking.startDate
                            ? formatDate(booking.startDate)
                            : booking.preferredMoveInDate
                              ? formatDate(booking.preferredMoveInDate)
                              : "Flexible"}
                        </span>
                      </p>
                      <p className="flex items-baseline justify-between gap-3 xl:block">
                        <span className="text-muted">Move out</span>
                        <span className="font-bold text-primary xl:mt-0.5 xl:block">
                          {booking.endDate
                            ? formatDate(booking.endDate)
                            : "No fixed end date"}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="font-display text-lg font-bold text-primary">
                        <PropertyPrice value={booking.totalPrice} />
                      </p>
                      <p className="mt-1 font-body text-xs text-muted">Total</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
                      {booking.status === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              setAccepting({ booking, mode: "accept" })
                            }
                            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 font-body text-xs font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Check size={15} aria-hidden="true" />
                            )}
                            Confirm
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(booking)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/15 px-4 font-body text-xs font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Details
                        <ChevronRight size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
        {!isLoading && bookings.length < total ? (
          <div className="border-t border-primary/10 p-5 text-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={isLoadingMore}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
            >
              {isLoadingMore ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              Show more tenancies ({total - bookings.length} more)
            </button>
          </div>
        ) : null}
      </section>

      <BookingDetailsDrawer
        booking={selectedBooking}
        isUpdating={pendingId === selectedBooking?.id}
        onClose={() => setSelectedBooking(null)}
        onDocuments={(booking) => {
          setSelectedBooking(null);
          setDocumentsBooking(booking);
        }}
        onRecords={(booking) => {
          setSelectedBooking(null);
          setRecordsBooking(booking);
        }}
        onMessage={(booking) => {
          setSelectedBooking(null);
          setChatBooking(booking);
        }}
        now={now}
        onAccept={(booking) => {
          setSelectedBooking(null);
          setAccepting({ booking, mode: "accept" });
        }}
        onCancel={(booking) => {
          setSelectedBooking(null);
          setCancelling(booking);
        }}
        onClaimDeposit={(booking) => {
          setSelectedBooking(null);
          setClaiming(booking);
        }}
        onChangeMoveIn={(booking) => {
          setSelectedBooking(null);
          setAccepting({ booking, mode: "move-in" });
        }}
        onStatusChange={(booking, status) => void changeStatus(booking, status)}
      />

      <AcceptBookingDialog
        key={accepting ? `${accepting.mode}-${accepting.booking.id}` : "closed"}
        booking={accepting?.booking ?? null}
        mode={accepting?.mode ?? "accept"}
        onClose={() => setAccepting(null)}
        onSaved={(updated) => {
          setAccepting(null);
          applyUpdate(updated);
          void refresh();
        }}
      />

      <DepositClaimDialog
        key={claiming ? `claim-${claiming.id}` : "no-claim"}
        booking={claiming}
        onClose={() => setClaiming(null)}
        onClaimed={() => {
          setClaiming(null);
          void refresh();
        }}
      />

      <CancelBookingDialog
        key={cancelling ? `cancel-${cancelling.id}` : "closed"}
        actor="host"
        booking={cancelling}
        now={now}
        onClose={() => setCancelling(null)}
        onDone={(updated) => {
          setCancelling(null);
          applyUpdate(updated);
        }}
      />

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

      <TenancyRecordsDialog
        bookingId={recordsBooking?.id ?? null}
        onClose={() => setRecordsBooking(null)}
        propertyTitle={recordsBooking?.propertyTitle ?? ""}
        showAgreement={recordsBooking?.bookingKind !== "SHORT_STAY"}
        viewer="host"
      />

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
