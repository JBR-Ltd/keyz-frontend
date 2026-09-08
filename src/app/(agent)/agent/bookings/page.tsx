"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Inbox,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDialogFocus } from "@/lib/useDialogFocus";

// === Types

type TenancyStage = "active" | "past" | "request" | "upcoming";
type TenancyTab = "all" | TenancyStage;

interface Tenancy {
  endDate: string;
  id: number;
  imageUrl: string;
  monthlyRent: number;
  propertyAddress: string;
  propertyTitle: string;
  stage: TenancyStage;
  startDate: string;
  tenantName: string;
  tenantVerified: boolean;
}

interface TabItem {
  id: TenancyTab;
  label: string;
}

interface TenancyDrawerProps {
  onClose: () => void;
  tenancy: Tenancy | null;
}

// === Constants

const TABS: TabItem[] = [
  { id: "all", label: "All" },
  { id: "request", label: "Requests" },
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
];

const TENANCIES: Tenancy[] = [
  {
    endDate: "7 Sep 2027",
    id: 801,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 950000,
    propertyAddress: "Maitama, Abuja",
    propertyTitle: "Maitama Park Apartment",
    stage: "request",
    startDate: "8 Sep 2026",
    tenantName: "Ada Nwosu",
    tenantVerified: true,
  },
  {
    endDate: "17 Sep 2027",
    id: 802,
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 1750000,
    propertyAddress: "Victoria Island, Lagos",
    propertyTitle: "Harbour View Residence",
    stage: "request",
    startDate: "18 Sep 2026",
    tenantName: "Tolu Martins",
    tenantVerified: true,
  },
  {
    endDate: "23 Sep 2027",
    id: 803,
    imageUrl:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 1100000,
    propertyAddress: "Wuse 2, Abuja",
    propertyTitle: "Wuse City Apartment",
    stage: "request",
    startDate: "24 Sep 2026",
    tenantName: "David Okoro",
    tenantVerified: false,
  },
  {
    endDate: "11 Sep 2027",
    id: 804,
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 1200000,
    propertyAddress: "Lekki Phase 1, Lagos",
    propertyTitle: "Lekki Garden Maisonette",
    stage: "upcoming",
    startDate: "12 Sep 2026",
    tenantName: "Kelechi Eze",
    tenantVerified: true,
  },
  {
    endDate: "31 Aug 2027",
    id: 805,
    imageUrl:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 850000,
    propertyAddress: "GRA, Port Harcourt",
    propertyTitle: "Garden City Townhouse",
    stage: "active",
    startDate: "1 Sep 2026",
    tenantName: "Amaka Obi",
    tenantVerified: true,
  },
  {
    endDate: "30 Jun 2026",
    id: 806,
    imageUrl:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=640&h=480&fit=crop&auto=format&q=80",
    monthlyRent: 780000,
    propertyAddress: "Yaba, Lagos",
    propertyTitle: "Yaba Courtyard Flat",
    stage: "past",
    startDate: "1 Jul 2025",
    tenantName: "Zainab Bello",
    tenantVerified: true,
  },
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

const STAGE_ACTIONS: Record<TenancyStage, string> = {
  active: "Manage tenancy",
  past: "View details",
  request: "Review request",
  upcoming: "Prepare move-in",
};

// === Helpers

function countForTab(tab: TenancyTab): number {
  return tab === "all"
    ? TENANCIES.length
    : TENANCIES.filter((tenancy) => tenancy.stage === tab).length;
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

function subscribeToPreviewState(): () => void {
  return () => undefined;
}

function getLoadingPreview(): boolean {
  return new URLSearchParams(window.location.search).get("state") === "loading";
}

function getServerLoadingPreview(): boolean {
  return false;
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
  onClose,
  tenancy,
}: TenancyDrawerProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const drawerRef = useDialogFocus<HTMLElement>(tenancy !== null);

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
                <Image
                  src={tenancy.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 512px) 100vw, 512px"
                  className="object-cover"
                />
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
                  <button
                    type="button"
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {STAGE_ACTIONS[tenancy.stage]}
                    <ArrowRight size={17} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/15 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Message tenant
                  </button>
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
  const [activeTab, setActiveTab] = useState<TenancyTab>("all");
  const [query, setQuery] = useState("");
  const [selectedTenancy, setSelectedTenancy] = useState<Tenancy | null>(null);
  const loading = useSyncExternalStore(
    subscribeToPreviewState,
    getLoadingPreview,
    getServerLoadingPreview,
  );

  const visibleTenancies = useMemo(
    () =>
      TENANCIES.filter(
        (tenancy) =>
          (activeTab === "all" || tenancy.stage === activeTab) &&
          matchesQuery(tenancy, query),
      ),
    [activeTab, query],
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
              const count = countForTab(tab.id);

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
                    <Image
                      src={tenancy.imageUrl}
                      alt=""
                      width={52}
                      height={52}
                      className="h-13 w-13 shrink-0 rounded-lg object-cover"
                    />
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

      <TenancyDrawer
        tenancy={selectedTenancy}
        onClose={() => setSelectedTenancy(null)}
      />
    </motion.main>
  );
}
