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
import { useDialogFocus } from "@/lib/useDialogFocus";

// === Types

type TenancyStage = "active" | "past" | "request" | "upcoming";
type TenancyTab = "all" | TenancyStage;

interface Tenancy {
  endDate: string;
  /** The booking id. Status changes and chat scoping both key off it. */
  id: number;
  imageUrl: string | null;
  monthlyRent: number;
  propertyAddress: string;
  propertyId: number;
  propertyTitle: string;
  stage: TenancyStage;
  startDate: string;
  status: BookingStatus;
  tenantId: number | null;
  tenantName: string;
  tenantVerified: boolean;
}

interface TabItem {
  id: TenancyTab;
  label: string;
}

interface TenancyDrawerProps {
  isUpdating: boolean;
  onClose: () => void;
  onMessage: (tenancy: Tenancy) => void;
  onStatusChange: (tenancy: Tenancy, status: BookingStatus) => void;
  tenancy: Tenancy | null;
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

const STAGE_TONES: Record<
  TenancyStage,
  "accent" | "neutral" | "primary"
> = {
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
  if (booking.status === "PENDING") {
    return "request";
  }

  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    return "past";
  }

  const today = new Date().setHours(0, 0, 0, 0);

  if (toDate(booking.startDate).getTime() > today) {
    return "upcoming";
  }

  return toDate(booking.endDate).getTime() < today ? "past" : "active";
}

function toTenancy(booking: Booking): Tenancy {
  return {
    endDate: formatDate(booking.endDate),
    id: booking.id,
    imageUrl: booking.propertyImageUrl,
    monthlyRent: booking.totalPrice,
    propertyAddress: booking.propertyAddress,
    propertyId: booking.propertyId,
    propertyTitle: booking.propertyTitle,
    stage: toStage(booking),
    startDate: formatDate(booking.startDate),
    status: booking.status,
    tenantId: booking.tenant?.id ?? null,
    tenantName: booking.tenant?.name ?? "Tenant",
    tenantVerified: booking.tenant?.identityVerified ?? false,
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
      className="min-h-screen animate-pulse px-5 py-12 motion-reduce:animate-none sm:px-8 lg:px-10 lg:py-16 xl:px-14"
      aria-busy="true"
      aria-label="Loading tenancies"
    >
      <div className="h-12 rounded-lg bg-primary/5" />
      <div className="mt-7 overflow-hidden rounded-lg bg-bg shadow-sm">
        <div className="h-14 border-b border-primary/10 bg-surface-soft" />
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 border-b border-primary/10 last:border-0"
          />
        ))}
      </div>
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
  onMessage,
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
              className="absolute inset-0 bg-primary/45"
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
                      Monthly rent
                    </p>
                    <p className="mt-1 font-body text-sm font-bold text-primary">
                      <PropertyPrice value={tenancy.monthlyRent} />
                    </p>
                    <p className="mt-1 font-body text-xs text-muted">
                      Protected payment
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-primary/10 p-5">
                  <div className="flex items-start gap-3">
                    <CalendarDays size={19} className="mt-0.5 text-accent-alt" />
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

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {primaryAction ? (
                    <button
                      type="button"
                      onClick={() => onStatusChange(tenancy, primaryAction.status)}
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
                  {secondaryAction ? (
                    <button
                      type="button"
                      onClick={() =>
                        onStatusChange(tenancy, secondaryAction.status)
                      }
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
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    const result = await getHostBookings();

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
          <section className="overflow-hidden rounded-lg bg-bg shadow-sm">
            <div className="hidden border-b border-primary/10 bg-surface-soft px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[0.14em] text-muted md:grid md:grid-cols-[minmax(15rem,1.1fr)_minmax(16rem,1.2fr)_minmax(10rem,0.8fr)_minmax(8rem,0.6fr)_2rem] md:gap-5">
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
                  className="grid w-full gap-5 p-5 text-left transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent md:grid-cols-[minmax(15rem,1.1fr)_minmax(16rem,1.2fr)_minmax(10rem,0.8fr)_minmax(8rem,0.6fr)_2rem] md:items-center md:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
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
                    </div>
                  </div>

                  <div>
                    <p className="font-body text-sm font-bold text-primary">
                      {tenancy.startDate}
                    </p>
                    <p className="mt-1 font-body text-xs text-muted">
                      <PropertyPrice value={tenancy.monthlyRent} /> monthly
                    </p>
                  </div>

                  <StatusBadge tone={STAGE_TONES[tenancy.stage]}>
                    {STAGE_LABELS[tenancy.stage]}
                  </StatusBadge>

                  <ChevronRight size={19} className="text-muted" />
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
        onStatusChange={(tenancy, status) => void changeStatus(tenancy, status)}
        tenancy={selectedTenancy}
      />
    </motion.main>
  );
}
