"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ImageOff,
  Inbox,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import ChatThread from "@/components/chat/ChatThread";
import TenancyDocumentsDialog from "@/components/tenant/TenancyDocumentsDialog";
import TenancyRecordsDialog from "@/components/tenancy/TenancyRecordsDialog";
import PropertyPrice from "@/components/property/PropertyPrice";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  getHostBookings,
  updateBookingStatus,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";
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

interface Tenancy {
  /** The booking behind the row, for the dialogs that act on it. */
  booking: Booking;
  endDate: string;
  /** The booking id. Status changes and chat scoping both key off it. */
  id: number;
  imageUrl: string | null;
  monthlyRent: number;
  /** What the price is for: a year, a month or the whole stay. */
  priceLabel: string;
  propertyAddress: string;
  propertyId: number;
  propertyTitle: string;
  stage: TenancyStage;
  startDate: string;
  status: BookingStatus;
  tenantId: number | null;
  tenantName: string;
  tenantVerified: boolean;
  unitLabel: string | null;
}

interface TabItem {
  id: TenancyTab;
  label: string;
}

interface TenancyDrawerProps {
  isUpdating: boolean;
  onClose: () => void;
  onMessage: (tenancy: Tenancy) => void;
  onDocuments: (tenancy: Tenancy) => void;
  onRecords: (tenancy: Tenancy) => void;
  now: number;
  onAccept: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onClaimDeposit: (booking: Booking) => void;
  onChangeMoveIn: (booking: Booking) => void;
  onStatusChange: (tenancy: Tenancy, status: BookingStatus) => void;
  tenancy: Tenancy | null;
}

interface AcceptTarget {
  booking: Booking;
  mode: AcceptDialogMode;
}

/** What an agent can do from a tenancy at each stage, and what it sends. */
interface StageAction {
  label: string;
  status: BookingStatus;
}

const PRIMARY_ACTIONS: Record<TenancyStage, StageAction | null> = {
  active: { label: "Mark completed", status: "COMPLETED" },
  past: null,
  request: { label: "Confirm request", status: "CONFIRMED" },
  upcoming: null,
};

const SECONDARY_ACTIONS: Record<TenancyStage, StageAction | null> = {
  active: null,
  past: null,
  request: { label: "Decline", status: "CANCELLED" },
  upcoming: { label: "Cancel tenancy", status: "CANCELLED" },
};

// === Constants

const TABS: TabItem[] = [
  { id: "all", label: "All" },
  { id: "request", label: "Requests" },
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
];

const STAGE_LABELS: Record<TenancyStage, string> = {
  active: "Active",
  past: "Completed",
  request: "New request",
  upcoming: "Upcoming",
};

const STAGE_TONES: Record<TenancyStage, "accent" | "neutral" | "primary"> = {
  active: "primary",
  past: "neutral",
  request: "accent",
  upcoming: "primary",
};

// === Helpers

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string): string {
  return toDate(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Stage is derived from status plus dates rather than stored. A confirmed booking
 * moves from upcoming to active to past on its own as the dates pass, with no
 * second source of truth to keep in step.
 */
function toStage(booking: Booking): TenancyStage {
  const fromServer = stageFromLifecycle(booking);

  if (fromServer) {
    return fromServer;
  }

  if (booking.status === "PENDING") {
    return "request";
  }

  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    return "past";
  }

  if (booking.bookingKind === "RENTAL_REQUEST" || !booking.endDate) {
    return "active";
  }

  const today = new Date().setHours(0, 0, 0, 0);

  if (booking.startDate && toDate(booking.startDate).getTime() > today) {
    return "upcoming";
  }

  return toDate(booking.endDate).getTime() < today ? "past" : "active";
}

function toTenancy(booking: Booking): Tenancy {
  return {
    booking,
    endDate: booking.endDate
      ? formatDate(booking.endDate)
      : "No fixed end date",
    id: booking.id,
    imageUrl: booking.propertyImageUrl,
    monthlyRent: booking.totalPrice,
    priceLabel:
      booking.rentalMode === "SHORT_STAY"
        ? "Stay total"
        : booking.rentalMode === "MONTHLY"
          ? "Monthly rent"
          : "Yearly rent",
    propertyAddress: booking.propertyAddress,
    propertyId: booking.propertyId,
    propertyTitle: booking.propertyTitle,
    stage: toStage(booking),
    startDate: booking.tenancyStartDate
      ? formatDate(booking.tenancyStartDate)
      : booking.startDate
        ? formatDate(booking.startDate)
        : booking.preferredMoveInDate
          ? formatDate(booking.preferredMoveInDate)
          : "Flexible move-in",
    status: booking.status,
    tenantId: booking.tenant?.id ?? null,
    tenantName: booking.tenant?.name ?? "Tenant",
    tenantVerified: booking.tenant?.identityVerified ?? false,
    unitLabel: booking.unitLabel ?? null,
  };
}

function countForTab(tenancies: Tenancy[], tab: TenancyTab): number {
  return tab === "all"
    ? tenancies.length
    : tenancies.filter((tenancy) => tenancy.stage === tab).length;
}

function matchesQuery(tenancy: Tenancy, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    tenancy.tenantName,
    tenancy.propertyTitle,
    tenancy.propertyAddress,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

// === Components

function TenanciesSkeleton(): ReactElement {
  return (
    <main
      className="min-h-screen animate-pulse overflow-x-hidden px-5 py-12 motion-reduce:animate-none sm:px-8 lg:px-10 lg:py-16 xl:px-14"
      aria-busy="true"
      aria-label="Loading tenancies"
    >
      <div className="flex flex-col gap-4 rounded-lg bg-bg p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="overflow-hidden">
          <div className="flex min-w-max gap-2">
            {["w-20", "w-28", "w-28", "w-24", "w-20"].map((width, index) => (
              <div
                key={index}
                className={`h-11 shrink-0 rounded-full bg-skeleton ${width}`}
              />
            ))}
          </div>
        </div>
        <div className="h-12 w-full rounded-full bg-skeleton lg:max-w-xs" />
      </div>

      <div className="mt-7 overflow-hidden rounded-lg border border-border/70 bg-bg shadow-sm">
        <div className="hidden border-b border-primary/10 bg-surface-soft px-6 py-3 lg:grid lg:grid-cols-[minmax(15rem,1.1fr)_minmax(16rem,1.2fr)_minmax(10rem,0.8fr)_minmax(8rem,0.6fr)_2rem] lg:gap-5">
          <div className="h-3 w-16 rounded-full bg-skeleton" />
          <div className="h-3 w-20 rounded-full bg-skeleton" />
          <div className="h-3 w-28 rounded-full bg-skeleton" />
          <div className="h-3 w-14 rounded-full bg-skeleton" />
        </div>

        <div className="divide-y divide-primary/10">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="relative grid gap-5 p-5 lg:grid-cols-[minmax(15rem,1.1fr)_minmax(16rem,1.2fr)_minmax(10rem,0.8fr)_minmax(8rem,0.6fr)_2rem] lg:items-center lg:px-6"
            >
              <div className="flex min-w-0 items-center gap-3 pr-9 lg:pr-0">
                <div className="h-11 w-11 shrink-0 rounded-full bg-skeleton-strong" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-32 max-w-full rounded-full bg-skeleton" />
                  <div className="mt-2 h-3 w-20 rounded-full bg-skeleton" />
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <div className="h-13 w-13 shrink-0 rounded-lg bg-skeleton-strong" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-40 max-w-full rounded-full bg-skeleton" />
                  <div className="mt-2 h-3 w-48 max-w-full rounded-full bg-skeleton" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-soft p-3 lg:contents">
                <div>
                  <div className="h-3 w-20 rounded-full bg-skeleton lg:hidden" />
                  <div className="mt-2 h-4 w-24 rounded-full bg-skeleton lg:mt-0" />
                  <div className="mt-2 h-3 w-28 rounded-full bg-skeleton" />
                  <div className="mt-2 h-3 w-24 rounded-full bg-skeleton" />
                </div>
                <div>
                  <div className="h-3 w-12 rounded-full bg-skeleton lg:hidden" />
                  <div className="mt-2 h-7 w-24 rounded-full bg-skeleton lg:mt-0" />
                </div>
              </div>

              <div className="absolute right-5 top-7 h-5 w-5 rounded-full bg-skeleton lg:static" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading tenancies</span>
    </main>
  );
}

function EmptyTenancies({
  query,
  tab,
}: {
  query: string;
  tab: TenancyTab;
}): ReactElement {
  const isSearchEmpty = Boolean(query.trim());

  return (
    <section className="grid min-h-[28rem] place-items-center rounded-lg bg-bg px-6 py-16 text-center shadow-sm">
      <div className="max-w-md">
        <IconTile
          size="lg"
          shape="circle"
          tone="accent"
          className="mx-auto h-20 w-20"
        >
          {isSearchEmpty ? <Search size={52} /> : <Inbox size={56} />}
        </IconTile>
        <h2 className="mt-6 font-display text-3xl font-bold text-primary">
          {isSearchEmpty
            ? "No matching tenancies"
            : tab === "request"
              ? "No requests waiting"
              : "Nothing here yet"}
        </h2>
        <p className="mx-auto mt-3 font-body text-sm leading-6 text-muted">
          {isSearchEmpty
            ? "Try another tenant name, property, or location."
            : tab === "request"
              ? "New tenant requests will appear here when they arrive."
              : "Tenancies in this stage will appear here automatically."}
        </p>
      </div>
    </section>
  );
}

function TenancyDrawer({
  isUpdating,
  onClose,
  onDocuments,
  onRecords,
  onMessage,
  now,
  onAccept,
  onCancel,
  onClaimDeposit,
  onChangeMoveIn,
  onStatusChange,
  tenancy,
}: TenancyDrawerProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const drawerRef = useDialogFocus<HTMLElement>(tenancy !== null);

  const primaryAction = tenancy ? PRIMARY_ACTIONS[tenancy.stage] : null;
  const secondaryAction = tenancy ? SECONDARY_ACTIONS[tenancy.stage] : null;

  useEffect(() => {
    if (!tenancy) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, tenancy]);

  return (
    <AnimatePresence>
      {tenancy ? (
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
              aria-labelledby="tenancy-drawer-title"
              className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-bg shadow-2xl"
              initial={reduceMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <div className="relative h-52">
                {tenancy.imageUrl ? (
                  <Image
                    src={tenancy.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 512px) 100vw, 512px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-surface-soft text-muted">
                    <ImageOff size={28} aria-hidden="true" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/55 to-transparent" />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg text-primary shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Close details"
                >
                  <X size={20} />
                </button>
                <StatusBadge
                  tone={STAGE_TONES[tenancy.stage]}
                  className="absolute bottom-5 left-5"
                >
                  {STAGE_LABELS[tenancy.stage]}
                </StatusBadge>
              </div>

              <div className="p-6 sm:p-8">
                <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                  Tenancy details
                </p>
                <h2
                  id="tenancy-drawer-title"
                  className="mt-3 font-display text-3xl font-bold text-primary"
                >
                  {tenancy.propertyTitle}
                </h2>
                <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                  <MapPin size={15} />
                  {tenancy.propertyAddress}
                </p>
                {tenancy.unitLabel ? (
                  <p className="mt-2 font-body text-sm font-semibold text-primary">
                    Assigned {tenancy.unitLabel}
                  </p>
                ) : null}

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-surface-soft p-4">
                    <UserRound size={19} className="text-accent-alt" />
                    <p className="mt-3 font-body text-xs font-medium text-muted">
                      Tenant
                    </p>
                    <p className="mt-1 font-body text-sm font-bold text-primary">
                      {tenancy.tenantName}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 font-body text-xs text-muted">
                      <ShieldCheck size={13} />
                      {tenancy.tenantVerified
                        ? "Identity verified"
                        : "Verification incomplete"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface-soft p-4">
                    <WalletCards size={19} className="text-accent-alt" />
                    <p className="mt-3 font-body text-xs font-medium text-muted">
                      {tenancy.priceLabel}
                    </p>
                    <p className="mt-1 font-body text-sm font-bold text-primary">
                      <PropertyPrice value={tenancy.monthlyRent} />
                    </p>
                    <PaymentStatusBadge
                      audience="host"
                      booking={tenancy.booking}
                      now={now}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-primary/10 p-5">
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
                        {tenancy.startDate} to {tenancy.endDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-primary/10 p-5">
                  <p className="font-body text-xs font-medium text-muted">
                    Payment
                  </p>
                  <p className="mt-1 font-body text-sm font-bold text-primary">
                    {describePaymentForHost(tenancy.booking, now)}
                  </p>
                </div>

                {tenancy.booking.cancellationReason ? (
                  <p className="mt-3 rounded-lg bg-surface-soft p-4 font-body text-sm leading-6 text-primary">
                    Reason given: &ldquo;{tenancy.booking.cancellationReason}&rdquo;
                  </p>
                ) : null}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {primaryAction ? (
                    <button
                      type="button"
                      onClick={() =>
                        primaryAction.status === "CONFIRMED"
                          ? onAccept(tenancy.booking)
                          : onStatusChange(tenancy, primaryAction.status)
                      }
                      disabled={isUpdating}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdating ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : null}
                      {primaryAction.label}
                      {isUpdating ? null : <ArrowRight size={17} />}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onMessage(tenancy)}
                    disabled={tenancy.tenantId === null}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Message tenant
                  </button>
                  {tenancy.stage === "active" || tenancy.stage === "past" ? (
                    <button
                      type="button"
                      onClick={() => onDocuments(tenancy)}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Paperwork
                    </button>
                  ) : null}
                  {tenancy.status === "CONFIRMED" || tenancy.status === "COMPLETED" ? (
                    <button
                      type="button"
                      onClick={() => onRecords(tenancy)}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {tenancy.booking.bookingKind === "SHORT_STAY"
                        ? "Condition reports"
                        : "Agreement and reports"}
                    </button>
                  ) : null}
                  {tenancy.status === "CONFIRMED" &&
                  tenancy.booking.bookingKind !== "SHORT_STAY" &&
                  !moveInLocked(tenancy.booking) ? (
                    <button
                      type="button"
                      onClick={() => onChangeMoveIn(tenancy.booking)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <CalendarDays size={16} aria-hidden="true" />
                      Change move-in
                    </button>
                  ) : null}
                  {tenancy.booking.depositStatus === "HELD" &&
                  tenancy.status === "COMPLETED" ? (
                    <button
                      type="button"
                      onClick={() => onClaimDeposit(tenancy.booking)}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Claim against deposit
                    </button>
                  ) : null}
                  {secondaryAction ? (
                    <button
                      type="button"
                      onClick={() => onCancel(tenancy.booking)}
                      disabled={isUpdating}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-red-700/25 px-5 font-body text-sm font-bold text-red-700 hover:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {secondaryAction.label}
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

export default function AgentBookingsPage(): ReactElement {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [activeTab, setActiveTab] = useState<TenancyTab>("all");
  const [query, setQuery] = useState("");
  const [selectedTenancy, setSelectedTenancy] = useState<Tenancy | null>(null);
  const [chatTenancy, setChatTenancy] = useState<Tenancy | null>(null);
  const [recordsTenancy, setRecordsTenancy] = useState<Tenancy | null>(null);
  const [documentsTenancy, setDocumentsTenancy] = useState<Tenancy | null>(
    null,
  );
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [accepting, setAccepting] = useState<AcceptTarget | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [claiming, setClaiming] = useState<Booking | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const result = await getHostBookings();

    setNow(Date.now());
    setTenancies(result.data.map(toTenancy));
    setLoadError(result.message ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    void getHostBookings().then((result) => {
      if (!active) {
        return;
      }

      setTenancies(result.data.map(toTenancy));
      setLoadError(result.message ?? "");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const changeStatus = async (
    tenancy: Tenancy,
    status: BookingStatus,
  ): Promise<void> => {
    setUpdatingId(tenancy.id);

    const result = await updateBookingStatus(tenancy.id, status);

    setUpdatingId(null);

    if (!result.data) {
      notify({
        title: "That did not save",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setSelectedTenancy(null);
    notify({
      title:
        status === "CONFIRMED"
          ? "Tenancy confirmed"
          : status === "COMPLETED"
            ? "Tenancy completed"
            : "Tenancy cancelled",
      variant: "success",
    });

    // Re-read rather than patching locally: the stage depends on dates as well
    // as status, and the server is the one that decides both
    await load();
  };

  const visibleTenancies = useMemo(
    () =>
      tenancies.filter(
        (tenancy) =>
          (activeTab === "all" || tenancy.stage === activeTab) &&
          matchesQuery(tenancy, query),
      ),
    [activeTab, query, tenancies],
  );

  if (loading) {
    return <TenanciesSkeleton />;
  }

  return (
    <motion.main
      className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-4 rounded-lg bg-bg p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="overflow-x-auto">
          <div
            className="flex min-w-max gap-1"
            role="tablist"
            aria-label="Tenancy status"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const count = countForTab(tenancies, tab.id);

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
                    {count}
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

      <div className="mt-7">
        {visibleTenancies.length === 0 ? (
          <EmptyTenancies query={query} tab={activeTab} />
        ) : (
          <section className="overflow-hidden rounded-lg border border-border/70 bg-bg shadow-sm">
            <div className="hidden border-b border-primary/10 bg-surface-soft px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[0.14em] text-muted lg:grid lg:grid-cols-[minmax(15rem,1.1fr)_minmax(16rem,1.2fr)_minmax(10rem,0.8fr)_minmax(8rem,0.6fr)_2rem] lg:gap-5">
              <span>Tenant</span>
              <span>Property</span>
              <span>Tenancy period</span>
              <span>Status</span>
              <span className="sr-only">Open</span>
            </div>

            <div className="divide-y divide-primary/10">
              {visibleTenancies.map((tenancy) => (
                <button
                  key={tenancy.id}
                  type="button"
                  onClick={() => setSelectedTenancy(tenancy)}
                  className="relative grid w-full gap-5 p-5 text-left transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent lg:grid-cols-[minmax(15rem,1.1fr)_minmax(16rem,1.2fr)_minmax(10rem,0.8fr)_minmax(8rem,0.6fr)_2rem] lg:items-center lg:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3 pr-9 lg:pr-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/5 font-display text-sm font-bold text-primary">
                      {tenancy.tenantName
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-bold text-primary">
                        {tenancy.tenantName}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 font-body text-xs text-muted">
                        <ShieldCheck size={13} />
                        {tenancy.tenantVerified ? "Verified" : "Not verified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-3">
                    {tenancy.imageUrl ? (
                      <Image
                        src={tenancy.imageUrl}
                        alt=""
                        width={52}
                        height={52}
                        className="h-13 w-13 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-muted">
                        <ImageOff size={18} aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-bold text-primary">
                        {tenancy.propertyTitle}
                      </p>
                      <p className="mt-1 flex items-center gap-1 truncate font-body text-xs text-muted">
                        <MapPin size={12} />
                        {tenancy.propertyAddress}
                      </p>
                      {tenancy.unitLabel ? (
                        <p className="mt-1 font-body text-xs font-semibold text-primary">
                          {tenancy.unitLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-soft p-3 lg:contents">
                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-muted lg:hidden">
                        Tenancy period
                      </p>
                      <p className="mt-1 font-body text-sm font-bold text-primary lg:mt-0">
                        {tenancy.startDate}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted">
                        to {tenancy.endDate}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted">
                        <PropertyPrice value={tenancy.monthlyRent} />{" "}
                        {tenancy.priceLabel.toLowerCase()}
                      </p>
                    </div>

                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-muted lg:hidden">
                        Status
                      </p>
                      <StatusBadge
                        tone={STAGE_TONES[tenancy.stage]}
                        className="mt-1 lg:mt-0"
                      >
                        {STAGE_LABELS[tenancy.stage]}
                      </StatusBadge>
                      <PaymentStatusBadge
                        audience="host"
                        booking={tenancy.booking}
                        now={now}
                        className="mt-2 block w-fit"
                      />
                    </div>
                  </div>

                  <ChevronRight
                    size={19}
                    className="absolute right-5 top-7 text-muted lg:static"
                  />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {loadError ? (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-bg px-4 py-3 font-body text-sm font-bold text-red-700">
          {loadError}
        </p>
      ) : null}

      <TenancyRecordsDialog
        bookingId={recordsTenancy?.id ?? null}
        onClose={() => setRecordsTenancy(null)}
        propertyTitle={recordsTenancy?.propertyTitle ?? ""}
        showAgreement={recordsTenancy?.booking.bookingKind !== "SHORT_STAY"}
        viewer="host"
      />

      {documentsTenancy ? (
        <TenancyDocumentsDialog
          bookingId={documentsTenancy.id}
          propertyTitle={documentsTenancy.propertyTitle}
          open
          onClose={() => setDocumentsTenancy(null)}
        />
      ) : null}

      {chatTenancy && chatTenancy.tenantId !== null ? (
        <ChatThread
          conversationId={`booking-${chatTenancy.id}`}
          otherUserId={chatTenancy.tenantId}
          propertyId={chatTenancy.propertyId}
          otherPartyName={chatTenancy.tenantName}
          otherPartyRole="Tenant"
          propertyName={chatTenancy.propertyTitle}
          onClose={() => setChatTenancy(null)}
        />
      ) : null}

      <TenancyDrawer
        isUpdating={updatingId === selectedTenancy?.id}
        onClose={() => setSelectedTenancy(null)}
        onMessage={(tenancy) => {
          setSelectedTenancy(null);
          setChatTenancy(tenancy);
        }}
        onDocuments={(tenancy) => {
          setSelectedTenancy(null);
          setDocumentsTenancy(tenancy);
        }}
        onRecords={(tenancy) => {
          setSelectedTenancy(null);
          setRecordsTenancy(tenancy);
        }}
        now={now}
        onAccept={(booking) => {
          setSelectedTenancy(null);
          setAccepting({ booking, mode: "accept" });
        }}
        onCancel={(booking) => {
          setSelectedTenancy(null);
          setCancelling(booking);
        }}
        onClaimDeposit={(booking) => {
          setSelectedTenancy(null);
          setClaiming(booking);
        }}
        onChangeMoveIn={(booking) => {
          setSelectedTenancy(null);
          setAccepting({ booking, mode: "move-in" });
        }}
        onStatusChange={(tenancy, status) => void changeStatus(tenancy, status)}
        tenancy={selectedTenancy}
      />

      <AcceptBookingDialog
        key={accepting ? `${accepting.mode}-${accepting.booking.id}` : "closed"}
        booking={accepting?.booking ?? null}
        mode={accepting?.mode ?? "accept"}
        onClose={() => setAccepting(null)}
        onSaved={() => {
          setAccepting(null);
          void load();
        }}
      />

      <DepositClaimDialog
        key={claiming ? `claim-${claiming.id}` : "no-claim"}
        booking={claiming}
        onClose={() => setClaiming(null)}
        onClaimed={() => {
          setClaiming(null);
          void load();
        }}
      />

      <CancelBookingDialog
        key={cancelling ? `cancel-${cancelling.id}` : "closed"}
        actor="host"
        booking={cancelling}
        now={now}
        onClose={() => setCancelling(null)}
        onDone={() => {
          setCancelling(null);
          void load();
        }}
      />
    </motion.main>
  );
}
