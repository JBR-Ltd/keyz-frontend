"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Landmark,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import EscrowLedgerSkeleton from "@/components/escrow/EscrowLedgerSkeleton";
import PropertyPrice from "@/components/property/PropertyPrice";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAllMyEscrow,
  type EscrowEntry,
  type EscrowStatus,
} from "@/lib/escrow";

// === Types

type LedgerFilter = "all" | "active" | "completed" | "issues";
type StatusTone = "primary" | "accent" | "danger" | "neutral";

interface EscrowLedgerProps {
  role: "landlord" | "agent";
}

interface FilterOption {
  label: string;
  value: LedgerFilter;
}

interface RecordAction {
  href: string;
  label: string;
}

// === Constants

const ACTIVE_STATUSES = new Set<EscrowStatus>([
  "AWAITING_PAYMENT",
  "HELD",
  "DISPUTED",
  "RELEASING",
]);
const COMPLETED_STATUSES = new Set<EscrowStatus>(["RELEASED", "REFUNDED"]);
const ISSUE_STATUSES = new Set<EscrowStatus>(["DISPUTED", "FAILED"]);

const FILTER_OPTIONS: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Issues", value: "issues" },
];

const STATUS_LABELS: Record<EscrowStatus, string> = {
  AWAITING_PAYMENT: "Awaiting tenant payment",
  HELD: "Held by Rello",
  DISPUTED: "Payout paused",
  RELEASING: "Payout processing",
  REFUNDING: "Refund processing",
  RELEASED: "Paid out",
  REFUNDED: "Refunded",
  FAILED: "Payment failed",
};

const STATUS_TONES: Record<EscrowStatus, StatusTone> = {
  AWAITING_PAYMENT: "neutral",
  HELD: "accent",
  DISPUTED: "danger",
  RELEASING: "primary",
  REFUNDING: "neutral",
  RELEASED: "primary",
  REFUNDED: "neutral",
  FAILED: "danger",
};

const ACTIVE_PRIORITY: Partial<Record<EscrowStatus, number>> = {
  DISPUTED: 0,
  HELD: 1,
  RELEASING: 2,
  AWAITING_PAYMENT: 3,
};

// === Helpers

function getPayoutAmount(entry: EscrowEntry): number {
  if (typeof entry.hostAmount === "number") return entry.hostAmount;
  if (typeof entry.commissionAmount === "number") {
    return Math.max(0, entry.amount - entry.commissionAmount);
  }
  return entry.amount;
}

function getActivityTime(entry: EscrowEntry): number {
  const value =
    entry.releasedAt ?? entry.refundedAt ?? entry.heldAt ?? entry.createdAt;
  const time = value ? Date.parse(value) : 0;
  return Number.isNaN(time) ? 0 : time;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getEventDate(entry: EscrowEntry): string | null {
  return (
    entry.releasedAt ?? entry.refundedAt ?? entry.heldAt ?? entry.createdAt
  );
}

function getActiveMessage(status: EscrowStatus): string {
  switch (status) {
    case "DISPUTED":
      return "Payout is paused while Rello reviews the dispute.";
    case "HELD":
      return "Waiting for tenant move-in confirmation.";
    case "RELEASING":
      return "Payout is being processed.";
    case "AWAITING_PAYMENT":
      return "Waiting for the tenant to complete payment.";
    default:
      return "Review this payment for its latest status.";
  }
}

function getRecordAction(
  entry: EscrowEntry,
  role: EscrowLedgerProps["role"],
): RecordAction {
  if (entry.status === "DISPUTED") {
    return { href: `/${role}/disputes`, label: "View dispute" };
  }
  if (entry.status === "RELEASING" && entry.heldAt) {
    return { href: `/receipts/payment/${entry.id}`, label: "View receipt" };
  }
  return { href: `/${role}/bookings`, label: "View tenancy" };
}

function matchesFilter(entry: EscrowEntry, filter: LedgerFilter): boolean {
  switch (filter) {
    case "active":
      return ACTIVE_STATUSES.has(entry.status);
    case "completed":
      return COMPLETED_STATUSES.has(entry.status);
    case "issues":
      return ISSUE_STATUSES.has(entry.status);
    default:
      return true;
  }
}

function getHostPayoutLabel(entry: EscrowEntry): ReactElement | string {
  if (entry.status === "RELEASING" || entry.status === "RELEASED") {
    return <PropertyPrice value={getPayoutAmount(entry)} />;
  }
  if (["REFUNDING", "REFUNDED", "FAILED"].includes(entry.status))
    return "Not paid";
  return "Pending";
}

function getFeeLabel(entry: EscrowEntry): ReactElement | string {
  if (typeof entry.commissionAmount === "number") {
    return <PropertyPrice value={entry.commissionAmount} />;
  }
  return entry.status === "RELEASED" || entry.status === "RELEASING"
    ? "Not recorded"
    : "Pending";
}

export default function EscrowLedger({
  role,
}: EscrowLedgerProps): ReactElement {
  const [entries, setEntries] = useState<EscrowEntry[]>([]);
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const isMounted = useRef(false);

  const loadEntries = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await getAllMyEscrow();
    if (!isMounted.current) return;

    setEntries((current) => {
      if (!result.message) return result.data;
      return current.length > 0 ? current : result.data;
    });
    setLoadError(result.message ?? "");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void getAllMyEscrow().then((result) => {
      if (!isMounted.current) return;

      setEntries(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      isMounted.current = false;
    };
  }, []);

  const totals = useMemo(
    () =>
      entries.reduce(
        (summary, entry) => {
          if (entry.status === "HELD" || entry.status === "DISPUTED") {
            summary.held += entry.amount;
          }
          if (entry.status === "RELEASING")
            summary.onTheWay += getPayoutAmount(entry);
          if (entry.status === "RELEASED")
            summary.paidOut += getPayoutAmount(entry);
          return summary;
        },
        { held: 0, onTheWay: 0, paidOut: 0 },
      ),
    [entries],
  );

  const activeEntries = useMemo(
    () =>
      entries
        .filter((entry) => ACTIVE_STATUSES.has(entry.status))
        .sort((left, right) => {
          const priority =
            (ACTIVE_PRIORITY[left.status] ?? 4) -
            (ACTIVE_PRIORITY[right.status] ?? 4);
          return priority || getActivityTime(right) - getActivityTime(left);
        }),
    [entries],
  );

  const filterCounts = useMemo(
    () => ({
      all: entries.length,
      active: entries.filter((entry) => ACTIVE_STATUSES.has(entry.status))
        .length,
      completed: entries.filter((entry) => COMPLETED_STATUSES.has(entry.status))
        .length,
      issues: entries.filter((entry) => ISSUE_STATUSES.has(entry.status))
        .length,
    }),
    [entries],
  );

  const filteredEntries = useMemo(
    () =>
      entries
        .filter((entry) => matchesFilter(entry, filter))
        .sort((left, right) => getActivityTime(right) - getActivityTime(left)),
    [entries, filter],
  );

  if (isLoading && entries.length === 0 && !loadError)
    return <EscrowLedgerSkeleton />;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <Link
        href={`/${role}/dashboard`}
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full px-1 pr-3 font-body text-sm font-bold text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Back to dashboard
      </Link>
      <header className="flex flex-col gap-5 border-b border-primary/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-primary sm:text-5xl">
            Escrow and payouts
          </h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted sm:text-base">
            Track rent held by Rello and the payouts moving to your bank
            account.
          </p>
        </div>
        <nav aria-label="Escrow shortcuts" className="flex flex-wrap gap-2">
          <Link
            href={`/${role}/statement`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
          >
            Statement
          </Link>
          <Link
            href={`/${role}/settings?section=payments`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
          >
            Payout settings
          </Link>
        </nav>
      </header>

      {loadError ? (
        <div
          className="mt-6 flex flex-col gap-4 border-y border-red-700/20 bg-red-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-red-700" size={20} />
            <div>
              <p className="font-body text-sm font-bold text-primary">
                We could not refresh your escrow activity
              </p>
              <p className="mt-1 font-body text-sm text-muted">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadEntries()}
            disabled={isLoading}
            aria-label="Retry loading escrow activity"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-red-700/30 px-4 font-body text-sm font-bold text-red-700 transition-colors hover:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            <RefreshCw
              size={17}
              className={
                isLoading ? "animate-spin motion-reduce:animate-none" : ""
              }
            />
            {isLoading ? "Retrying" : "Retry"}
          </button>
        </div>
      ) : null}

      <section aria-labelledby="escrow-summary-heading" className="py-7">
        <h2 id="escrow-summary-heading" className="sr-only">
          Payout summary
        </h2>
        <div className="grid gap-5 sm:grid-cols-3 sm:gap-0">
          {[
            ["Held by Rello", totals.held, "Full funds currently protected"],
            ["On the way", totals.onTheWay, "Host payout being processed"],
            ["Paid out", totals.paidOut, "Host payout sent to your bank"],
          ].map(([label, amount, detail], index) => (
            <div
              key={String(label)}
              className={`min-w-0 ${index > 0 ? "border-t border-primary/15 pt-5 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0" : ""} ${index < 2 ? "sm:pr-7" : ""}`}
            >
              <p className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                {label}
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
                <PropertyPrice value={Number(amount)} />
              </p>
              <p className="mt-1 font-body text-xs leading-5 text-muted">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="border-t border-primary/15 py-8"
        aria-labelledby="active-payouts-heading"
      >
        <div>
          <h2
            id="active-payouts-heading"
            className="font-display text-3xl font-bold text-primary"
          >
            Active payouts
          </h2>
          <p className="mt-1 font-body text-sm text-muted">
            {activeEntries.length === 0
              ? "Nothing needs attention or release right now."
              : `${activeEntries.length} ${activeEntries.length === 1 ? "payment is" : "payments are"} still in progress.`}
          </p>
        </div>

        {activeEntries.length === 0 ? (
          <div className="mt-5 border-y border-primary/10 py-7 text-center">
            <Landmark className="mx-auto text-accent-alt" size={24} />
            <p className="mt-3 font-body text-sm font-bold text-primary">
              No active payouts
            </p>
            <p className="mx-auto mt-1 max-w-lg font-body text-sm text-muted">
              Funded tenancies will appear here while payment or release is in
              progress.
            </p>
            <Link
              href={`/${role}/bookings`}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              View tenancies <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-primary/10 border-y border-primary/15">
            {activeEntries.map((entry) => {
              const action = getRecordAction(entry, role);
              return (
                <article
                  key={entry.id}
                  className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-body text-base font-bold text-primary">
                        {entry.propertyTitle}
                      </p>
                      <StatusBadge tone={STATUS_TONES[entry.status]} size="sm">
                        {STATUS_LABELS[entry.status]}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 font-body text-sm text-muted">
                      {entry.tenant?.name ?? "Tenant"}
                    </p>
                    <p className="mt-2 flex items-start gap-2 font-body text-sm text-primary">
                      <Clock3
                        className="mt-0.5 shrink-0 text-accent-alt"
                        size={16}
                      />
                      {getActiveMessage(entry.status)}
                    </p>
                  </div>
                  <div className="md:min-w-36 md:text-right">
                    <p className="font-accent text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">
                      {entry.status === "RELEASING"
                        ? "Host payout"
                        : "Escrow amount"}
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold text-primary">
                      <PropertyPrice
                        value={
                          entry.status === "RELEASING"
                            ? getPayoutAmount(entry)
                            : entry.amount
                        }
                      />
                    </p>
                    {entry.depositAmount ? (
                      <p className="mt-1 font-body text-xs text-muted">
                        Includes <PropertyPrice value={entry.depositAmount} />{" "}
                        deposit
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={action.href}
                    className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-primary/25 px-4 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none md:justify-self-end"
                  >
                    {action.label} <ArrowRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="border-t border-primary/15 py-8"
        aria-labelledby="escrow-activity-heading"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2
              id="escrow-activity-heading"
              className="font-display text-3xl font-bold text-primary"
            >
              Escrow activity
            </h2>
            <p className="mt-1 font-body text-sm text-muted">
              Gross funds, fees, and the amount received are shown separately.
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            aria-label="Filter escrow activity"
          >
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none ${filter === option.value ? "bg-primary text-white" : "border border-primary/15 text-primary hover:bg-primary/5"}`}
              >
                {option.label}
                <span
                  className={`text-xs ${filter === option.value ? "text-white/75" : "text-muted"}`}
                >
                  {filterCounts[option.value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="mt-6 border-y border-primary/10 py-8 text-center">
            <ReceiptText className="mx-auto text-accent-alt" size={24} />
            <p className="mt-3 font-body text-sm font-bold text-primary">
              {entries.length === 0
                ? "No escrow activity yet"
                : "No records match this filter"}
            </p>
            <p className="mx-auto mt-1 max-w-lg font-body text-sm text-muted">
              {entries.length === 0
                ? "Payments will appear here after a tenant funds an accepted tenancy."
                : "Choose All to see your complete escrow history."}
            </p>
            {entries.length === 0 ? (
              <Link
                href={`/${role}/bookings`}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                View tenancies <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 hidden overflow-x-auto border-y border-primary/15 lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-primary/15 font-accent text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">
                    <th scope="col" className="px-3 py-4">
                      Property and tenant
                    </th>
                    <th scope="col" className="px-3 py-4">
                      Event date
                    </th>
                    <th scope="col" className="px-3 py-4 text-right">
                      Gross
                    </th>
                    <th scope="col" className="px-3 py-4 text-right">
                      Fee
                    </th>
                    <th scope="col" className="px-3 py-4 text-right">
                      Host payout
                    </th>
                    <th scope="col" className="px-3 py-4">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-4 text-right">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <th
                        scope="row"
                        className="min-w-64 px-3 py-5 align-top font-normal"
                      >
                        <p className="font-body text-sm font-bold text-primary">
                          {entry.propertyTitle}
                        </p>
                        <p className="mt-1 font-body text-xs text-muted">
                          {entry.tenant?.name ?? "Tenant"}
                        </p>
                        {entry.reference ? (
                          <p
                            className="mt-1 max-w-64 truncate font-mono text-[0.68rem] text-muted"
                            title={entry.reference}
                          >
                            Ref {entry.reference}
                          </p>
                        ) : null}
                        {entry.depositAmount ? (
                          <p className="mt-1 font-body text-xs text-muted">
                            Includes{" "}
                            <PropertyPrice value={entry.depositAmount} />{" "}
                            refundable deposit
                          </p>
                        ) : null}
                      </th>
                      <td className="whitespace-nowrap px-3 py-5 align-top font-body text-sm text-primary">
                        {formatDate(getEventDate(entry))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-5 text-right align-top font-body text-sm font-bold text-primary">
                        <PropertyPrice value={entry.amount} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-5 text-right align-top font-body text-sm text-muted">
                        {getFeeLabel(entry)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-5 text-right align-top font-body text-sm font-bold text-primary">
                        {getHostPayoutLabel(entry)}
                      </td>
                      <td className="px-3 py-5 align-top">
                        <StatusBadge
                          tone={STATUS_TONES[entry.status]}
                          size="sm"
                        >
                          {STATUS_LABELS[entry.status]}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-5 text-right align-top">
                        {entry.heldAt ? (
                          <Link
                            href={`/receipts/payment/${entry.id}`}
                            aria-label={`View receipt for ${entry.propertyTitle}`}
                            className="inline-flex min-h-11 items-center justify-center font-body text-sm font-bold text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            Receipt
                          </Link>
                        ) : (
                          <span className="font-body text-sm text-muted">
                            Not available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 divide-y divide-primary/10 border-y border-primary/15 lg:hidden">
              {filteredEntries.map((entry) => (
                <article key={entry.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-body text-base font-bold text-primary">
                        {entry.propertyTitle}
                      </h3>
                      <p className="mt-1 font-body text-sm text-muted">
                        {entry.tenant?.name ?? "Tenant"}
                      </p>
                    </div>
                    <StatusBadge tone={STATUS_TONES[entry.status]} size="sm">
                      {STATUS_LABELS[entry.status]}
                    </StatusBadge>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                    <div>
                      <dt className="font-accent text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
                        Event date
                      </dt>
                      <dd className="mt-1 font-body text-sm text-primary">
                        {formatDate(getEventDate(entry))}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-accent text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
                        Gross
                      </dt>
                      <dd className="mt-1 font-body text-sm font-bold text-primary">
                        <PropertyPrice value={entry.amount} />
                      </dd>
                    </div>
                    <div>
                      <dt className="font-accent text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
                        Rello fee
                      </dt>
                      <dd className="mt-1 font-body text-sm text-primary">
                        {getFeeLabel(entry)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-accent text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
                        Host payout
                      </dt>
                      <dd className="mt-1 font-body text-sm font-bold text-primary">
                        {getHostPayoutLabel(entry)}
                      </dd>
                    </div>
                  </dl>
                  {entry.depositAmount ? (
                    <p className="mt-4 font-body text-xs text-muted">
                      Includes <PropertyPrice value={entry.depositAmount} />{" "}
                      refundable deposit
                      {entry.depositStatus
                        ? `, ${entry.depositStatus.toLowerCase()}`
                        : ""}
                    </p>
                  ) : null}
                  {entry.reference ? (
                    <p className="mt-2 break-all font-mono text-[0.68rem] text-muted">
                      Reference {entry.reference}
                    </p>
                  ) : null}
                  {entry.heldAt ? (
                    <Link
                      href={`/receipts/payment/${entry.id}`}
                      className="mt-4 inline-flex min-h-11 items-center gap-2 font-body text-sm font-bold text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <ReceiptText size={16} />
                      View receipt
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section
        className="border-t border-primary/15 py-8"
        aria-labelledby="how-escrow-works-heading"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="shrink-0 text-accent-alt" size={24} />
          <h2
            id="how-escrow-works-heading"
            className="font-display text-2xl font-bold text-primary"
          >
            How escrow works
          </h2>
        </div>
        <ol className="mt-5 grid gap-5 md:grid-cols-3 md:gap-0">
          {[
            [
              "1",
              "Tenant funds the tenancy",
              "Rello protects the full payment before move-in.",
            ],
            [
              "2",
              "Rello holds the funds",
              "A dispute pauses release while the issue is reviewed.",
            ],
            [
              "3",
              "Host payout is released",
              "Your fee and host payout are recorded separately.",
            ],
          ].map(([step, title, description], index) => (
            <li
              key={step}
              className={`${index > 0 ? "border-t border-primary/10 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0" : ""} ${index < 2 ? "md:pr-6" : ""}`}
            >
              <p className="font-accent text-xs font-bold uppercase tracking-[0.14em] text-accent-alt">
                Step {step}
              </p>
              <p className="mt-2 font-body text-sm font-bold text-primary">
                {title}
              </p>
              <p className="mt-1 font-body text-sm leading-6 text-muted">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
