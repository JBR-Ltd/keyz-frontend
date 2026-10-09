"use client";

import {
  differenceInCalendarDays,
  format,
  parseISO,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import {
  AlertCircle,
  CalendarRange,
  Download,
  RotateCcw,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StatusBadge,
  type StatusBadgeProps,
} from "@/components/ui/status-badge";
import {
  getStatement,
  statementCsv,
  type Statement,
  type StatementRow,
} from "@/lib/instalments";
import { cn } from "@/lib/utils";

// === Types

type DatePreset = "30_days" | "3_months" | "1_year" | "custom";

interface DateRange {
  from: string;
  to: string;
}

interface PresetOption {
  id: DatePreset;
  label: string;
}

// === Constants

const MAX_STATEMENT_DAYS = 366 * 3;

const PRESET_OPTIONS: PresetOption[] = [
  { id: "30_days", label: "30 days" },
  { id: "3_months", label: "3 months" },
  { id: "1_year", label: "1 year" },
  { id: "custom", label: "Custom" },
];

const TYPE_LABELS: Record<string, string> = {
  RENT_PAYOUT: "Rent payout",
  DEPOSIT_CLAIM_PAYOUT: "Deposit claim payout",
  INSTALMENT_PAYOUT: "Instalment payout",
  AGENT_FEE: "Agent fee",
  PAYMENT: "Rent payment",
  REFUND: "Refund",
  DEPOSIT_RETURN: "Deposit return",
  INSTALMENT: "Rent instalment",
};

const STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  HELD: "Held securely",
  DISPUTED: "In dispute",
  RELEASING: "Processing",
  RELEASED: "Paid out",
  REFUNDING: "Refund processing",
  REFUNDED: "Refunded",
  FAILED: "Failed",
  CLAIMED: "Claim submitted",
  RETURNING: "Return processing",
  RETURNED: "Returned",
  SETTLED: "Settled",
  SCHEDULED: "Scheduled",
  OVERDUE: "Overdue",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

// === Helpers

function isoDay(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

function presetRange(preset: Exclude<DatePreset, "custom">): DateRange {
  const today = new Date();
  const to = isoDay(today);

  if (preset === "30_days") {
    return { from: isoDay(subDays(today, 29)), to };
  }

  if (preset === "3_months") {
    return { from: isoDay(subMonths(today, 3)), to };
  }

  return { from: isoDay(subYears(today, 1)), to };
}

function formatDate(value: string): string {
  return format(parseISO(value), "d MMM yyyy");
}

function formatFallbackLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function transactionLabel(type: string): string {
  return TYPE_LABELS[type] ?? formatFallbackLabel(type);
}

function statusLabel(status: string | null, isHost: boolean): string {
  if (status === "RELEASED") {
    return isHost ? "Paid out" : "Completed";
  }

  return status
    ? (STATUS_LABELS[status] ?? formatFallbackLabel(status))
    : "Recorded";
}

function statusTone(
  status: string | null,
): NonNullable<StatusBadgeProps["tone"]> {
  if (status === "FAILED" || status === "DISPUTED" || status === "OVERDUE") {
    return "danger";
  }

  if (
    status === "RELEASED" ||
    status === "REFUNDED" ||
    status === "RETURNED" ||
    status === "SETTLED" ||
    status === "PAID"
  ) {
    return "primary";
  }

  if (
    status === "HELD" ||
    status === "RELEASING" ||
    status === "REFUNDING" ||
    status === "RETURNING"
  ) {
    return "accent";
  }

  return "neutral";
}

function validateRange(from: string, to: string): string {
  if (!from || !to) {
    return "Choose both a start and end date.";
  }

  const start = parseISO(from);
  const end = parseISO(to);
  const today = parseISO(isoDay(new Date()));

  if (start > end) {
    return "The start date must be before the end date.";
  }

  if (end > today) {
    return "Statements cannot include future dates.";
  }

  if (differenceInCalendarDays(end, start) > MAX_STATEMENT_DAYS) {
    return "A statement can cover up to three years.";
  }

  return "";
}

// === Components

function StatementSkeleton(): ReactElement {
  return (
    <div className="mt-8" role="status" aria-label="Loading statement">
      <div className="grid border-y border-border/70 py-5 sm:grid-cols-3 sm:py-6">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`statement-total-${index + 1}`}
            className="border-b border-border/70 py-4 last:border-b-0 sm:border-b-0 sm:border-l sm:px-6 sm:py-0 sm:first:border-l-0 sm:first:pl-0"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-36" />
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-3">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={`statement-row-${index + 1}`}
            className="h-20 w-full"
          />
        ))}
      </div>
      <span className="sr-only">Loading statement</span>
    </div>
  );
}

function TransactionStatus({
  isHost,
  status,
}: {
  isHost: boolean;
  status: string | null;
}): ReactElement {
  return (
    <StatusBadge size="sm" tone={statusTone(status)}>
      {statusLabel(status, isHost)}
    </StatusBadge>
  );
}

function TransactionIdentity({ row }: { row: StatementRow }): ReactElement {
  return (
    <div className="min-w-0">
      <p className="font-body text-sm font-bold text-primary">
        {transactionLabel(row.type)}
      </p>
      {row.reference ? (
        <p
          className="mt-1 max-w-56 truncate font-mono text-[11px] text-muted"
          title={row.reference}
        >
          {row.reference}
        </p>
      ) : null}
    </div>
  );
}

function MobileTransactions({
  isHost,
  rows,
}: {
  isHost: boolean;
  rows: StatementRow[];
}): ReactElement {
  return (
    <ul className="mt-7 grid gap-3 lg:hidden">
      {rows.map((row, index) => (
        <li
          key={`${row.reference ?? row.type}-${index}`}
          className="rounded-xl border border-border/70 bg-bg p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <TransactionIdentity row={row} />
            <TransactionStatus isHost={isHost} status={row.status} />
          </div>
          <p className="mt-4 font-display text-xl font-bold text-primary">
            <PropertyPrice value={isHost ? row.net : row.gross} />
          </p>
          <dl className="mt-4 grid gap-3 border-t border-border/70 pt-4 font-body text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Date</dt>
              <dd className="text-right font-semibold text-primary">
                {formatDate(row.date)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Home</dt>
              <dd className="max-w-[65%] text-right font-semibold text-primary">
                {row.propertyTitle}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">{isHost ? "Tenant" : "Host"}</dt>
              <dd className="max-w-[65%] text-right text-primary">
                {row.counterparty}
              </dd>
            </div>
            {isHost ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted">Gross</dt>
                  <dd className="text-right text-primary">
                    <PropertyPrice value={row.gross} />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted">Rello fee</dt>
                  <dd className="text-right text-primary">
                    <PropertyPrice value={row.commission ?? 0} />
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </li>
      ))}
    </ul>
  );
}

function DesktopTransactions({
  isHost,
  rows,
}: {
  isHost: boolean;
  rows: StatementRow[];
}): ReactElement {
  return (
    <div className="mt-8 hidden overflow-hidden rounded-xl border border-border/70 bg-bg lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] font-body text-sm">
          <thead className="border-b border-border/70 bg-surface-soft/55 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th scope="col" className="px-5 py-3">
                Date
              </th>
              <th scope="col" className="px-5 py-3">
                Transaction
              </th>
              <th scope="col" className="px-5 py-3">
                Home
              </th>
              <th scope="col" className="px-5 py-3">
                {isHost ? "Tenant" : "Host"}
              </th>
              {isHost ? (
                <>
                  <th scope="col" className="px-5 py-3 text-right">
                    Gross
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Fee
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Received
                  </th>
                </>
              ) : (
                <th scope="col" className="px-5 py-3 text-right">
                  Amount
                </th>
              )}
              <th scope="col" className="px-5 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70 text-primary">
            {rows.map((row, index) => (
              <tr
                key={`${row.reference ?? row.type}-${index}`}
                className="align-middle"
              >
                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {formatDate(row.date)}
                </td>
                <td className="px-5 py-4">
                  <TransactionIdentity row={row} />
                </td>
                <td className="max-w-52 px-5 py-4 font-semibold">
                  <span className="line-clamp-2">{row.propertyTitle}</span>
                </td>
                <td className="max-w-44 px-5 py-4 text-muted">
                  <span className="line-clamp-2">{row.counterparty}</span>
                </td>
                {isHost ? (
                  <>
                    <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">
                      <PropertyPrice value={row.gross} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-muted">
                      <PropertyPrice value={row.commission ?? 0} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums">
                      <PropertyPrice value={row.net} />
                    </td>
                  </>
                ) : (
                  <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums">
                    <PropertyPrice value={row.gross} />
                  </td>
                )}
                <td className="px-5 py-4">
                  <TransactionStatus isHost={isHost} status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Money in and out for a date range, for a tenant or a host, with a CSV for their records. */
export default function StatementView(): ReactElement {
  const pathname = usePathname();
  const initialRange = useMemo(() => presetRange("1_year"), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [preset, setPreset] = useState<DatePreset>("1_year");
  const [statement, setStatement] = useState<Statement | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState(initialRange);
  const [requestVersion, setRequestVersion] = useState(0);
  const validationMessage = validateRange(from, to);
  const isHostRoute =
    pathname.startsWith("/landlord/") || pathname.startsWith("/agent/");
  const isHost = statement?.view === "HOST" || isHostRoute;

  useEffect(() => {
    let active = true;

    void getStatement(range.from, range.to).then((result) => {
      if (!active) {
        return;
      }

      setStatement(result.data);
      setError(
        result.data
          ? ""
          : (result.message ?? "The statement could not be loaded."),
      );
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [range, requestVersion]);

  const download = (): void => {
    if (!statement) {
      return;
    }

    const url = URL.createObjectURL(
      new Blob([statementCsv(statement)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `rello-statement-${statement.from}-to-${statement.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyPreset = (nextPreset: DatePreset): void => {
    setPreset(nextPreset);

    if (nextPreset === "custom") {
      return;
    }

    const nextRange = presetRange(nextPreset);
    setFrom(nextRange.from);
    setTo(nextRange.to);
  };

  const showWiderRange = (): void => {
    const nextRange = presetRange("1_year");
    setPreset("1_year");
    setFrom(nextRange.from);
    setTo(nextRange.to);
    setIsLoading(true);
    setError("");
    setRange(nextRange);
  };

  const tenantPaid =
    statement?.rows.reduce(
      (total, row) => total + Math.max(row.gross, 0),
      0,
    ) ?? 0;
  const tenantReturned =
    statement?.rows.reduce(
      (total, row) => total + Math.abs(Math.min(row.gross, 0)),
      0,
    ) ?? 0;
  const summaryItems: Array<[string, number]> = statement
    ? isHost
      ? [
          ["Gross earnings", statement.totalGross],
          ["Rello fees", statement.totalCommission],
          ["Received", statement.totalNet],
        ]
      : [
          ["Paid", tenantPaid],
          ["Returned", tenantReturned],
          ["Net paid", statement.totalNet],
        ]
    : [];

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-7 sm:px-8 sm:py-9 lg:px-10 xl:px-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-primary sm:text-5xl">
              Statement
            </h1>
            <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
              {isHost
                ? "Review payouts, Rello fees, and the amounts you received."
                : "Review your payments, refunds, and deposit returns."}
            </p>
          </div>
          <button
            type="button"
            onClick={download}
            disabled={isLoading || !statement || statement.rows.length === 0}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} aria-hidden="true" />
            Download CSV
          </button>
        </div>

        <form
          className="mt-7 border-y border-border/70 py-5"
          onSubmit={(event) => {
            event.preventDefault();

            if (!validationMessage) {
              setIsLoading(true);
              setError("");
              setRange({ from, to });
            }
          }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <fieldset>
              <legend className="font-body text-xs font-bold uppercase tracking-[0.12em] text-muted">
                Statement period
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={preset === option.id}
                    onClick={() => applyPreset(option.id)}
                    className={cn(
                      "min-h-11 rounded-full border px-4 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      preset === option.id
                        ? "border-primary bg-primary text-white"
                        : "border-primary/15 bg-bg text-primary hover:border-primary/30 hover:bg-primary/5",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {preset === "custom" ? (
                <div className="grid w-full gap-1 sm:w-[22rem]">
                  <span className="font-body text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    Custom range
                  </span>
                  <DateRangePicker
                    ariaLabel="Choose statement date range"
                    startDate={from}
                    endDate={to}
                    maxDate={isoDay(new Date())}
                    onChange={(nextFrom, nextTo) => {
                      setFrom(nextFrom);
                      setTo(nextTo);
                    }}
                  />
                </div>
              ) : (
                <p className="pb-3 font-body text-sm text-muted">
                  {formatDate(from)} to {formatDate(to)}
                </p>
              )}
              <button
                type="submit"
                disabled={Boolean(validationMessage) || isLoading}
                className="min-h-12 rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
          {validationMessage ? (
            <p className="mt-3 font-body text-sm text-red-700" role="alert">
              {validationMessage}
            </p>
          ) : null}
        </form>

        {isLoading ? (
          <StatementSkeleton />
        ) : error ? (
          <div
            className="mt-8 flex max-w-2xl items-start gap-4 border-y border-red-700/20 py-6"
            role="alert"
          >
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-700"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-body text-base font-bold text-primary">
                We could not load this statement
              </h2>
              <p className="mt-1 font-body text-sm leading-6 text-muted">
                {error}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setError("");
                  setRequestVersion((version) => version + 1);
                }}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        ) : statement ? (
          <>
            <dl className="mt-8 grid border-y border-border/70 py-5 sm:grid-cols-3 sm:py-6">
              {summaryItems.map(([label, value]) => (
                <div
                  key={label}
                  className="border-b border-border/70 py-4 last:border-b-0 sm:border-b-0 sm:border-l sm:px-6 sm:py-0 sm:first:border-l-0 sm:first:pl-0"
                >
                  <dt className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    {label}
                  </dt>
                  <dd className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">
                    <PropertyPrice value={value} />
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">
                  Transactions
                </h2>
                <p className="mt-1 font-body text-sm text-muted">
                  {formatDate(statement.from)} to {formatDate(statement.to)}
                </p>
              </div>
              <p className="font-body text-sm font-semibold text-muted">
                {statement.rows.length}{" "}
                {statement.rows.length === 1 ? "record" : "records"}
              </p>
            </div>

            {statement.rows.length === 0 ? (
              <div className="mt-7 border-y border-border/70 py-12 text-center">
                <CalendarRange
                  size={32}
                  className="mx-auto text-accent-alt"
                  aria-hidden="true"
                />
                <h2 className="mt-4 font-display text-2xl font-bold text-primary">
                  No transactions in this period
                </h2>
                <p className="mx-auto mt-2 max-w-md font-body text-sm leading-6 text-muted">
                  Nothing moved between {formatDate(statement.from)} and{" "}
                  {formatDate(statement.to)}.
                </p>
                {preset !== "1_year" ? (
                  <button
                    type="button"
                    onClick={showWiderRange}
                    className="mt-5 min-h-11 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    View the last year
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <DesktopTransactions
                  isHost={isHost}
                  rows={statement.rows}
                />
                <MobileTransactions
                  isHost={isHost}
                  rows={statement.rows}
                />
              </>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
