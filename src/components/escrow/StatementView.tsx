"use client";

import { Download, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { DateRangePicker } from "@/components/ui/date-picker";
import { getStatement, statementCsv, type Statement } from "@/lib/instalments";

const TYPE_LABELS: Record<string, string> = {
  RENT_PAYOUT: "Rent paid out",
  DEPOSIT_CLAIM_PAYOUT: "Deposit claim paid out",
  INSTALMENT_PAYOUT: "Instalment paid out",
  AGENT_FEE: "Agent fee",
  PAYMENT: "Payment",
  REFUND: "Refund",
  DEPOSIT_RETURN: "Deposit returned",
  INSTALMENT: "Instalment",
};

function isoDay(offsetDays: number): string {
  const day = new Date();
  day.setDate(day.getDate() + offsetDays);

  return day.toISOString().slice(0, 10);
}

/** Money in and out for a date range, for a tenant or a host, with a CSV for their records. */
export default function StatementView(): ReactElement {
  const [from, setFrom] = useState(() => isoDay(-365));
  const [to, setTo] = useState(() => isoDay(0));
  const [statement, setStatement] = useState<Statement | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState({ from, to });

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
  }, [range]);

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

  const isHost = statement?.view === "HOST";

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
        Records
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold text-primary sm:text-5xl">
        Statement
      </h1>
      <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
        Every payment
        {isHost ? " paid out to you" : " you made, refund and deposit return"}{" "}
        in the dates you choose, taken straight from the payment records Rello
        keeps. Up to three years at a time.
      </p>

      <form
        className="mt-8 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setIsLoading(true);
          setRange({ from, to });
        }}
      >
        <div className="grid min-w-[min(22rem,100%)] gap-1">
          <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Date range
          </p>
          <DateRangePicker
            ariaLabel="Choose statement date range"
            startDate={from}
            endDate={to}
            onChange={(nextFrom, nextTo) => {
              setFrom(nextFrom);
              setTo(nextTo);
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!from || !to}
          className="min-h-11 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Show
        </button>
        <button
          type="button"
          onClick={download}
          disabled={!statement || statement.rows.length === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        >
          <Download size={15} aria-hidden="true" />
          Download CSV
        </button>
      </form>

      {isLoading ? (
        <div className="mt-10 flex justify-center" role="status">
          <Loader2 size={22} className="animate-spin text-muted" />
          <span className="sr-only">Loading statement</span>
        </div>
      ) : error ? (
        <p className="mt-8 font-body text-sm text-red-700">{error}</p>
      ) : statement ? (
        <>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Gross", statement.totalGross],
              ["Rello fees", statement.totalCommission],
              [isHost ? "Received" : "Net paid", statement.totalNet],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-lg bg-surface-soft p-5"
              >
                <dt className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  {label}
                </dt>
                <dd className="mt-2 font-display text-2xl font-bold text-primary">
                  <PropertyPrice value={Number(value)} />
                </dd>
              </div>
            ))}
          </dl>

          {statement.rows.length === 0 ? (
            <p className="mt-8 rounded-lg bg-surface-soft p-8 text-center font-body text-sm text-muted">
              Nothing moved in these dates.
            </p>
          ) : (
            <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-bg">
              <table className="w-full min-w-[44rem] font-body text-sm">
                <thead className="bg-surface-soft text-left text-xs uppercase tracking-[0.1em] text-muted">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">What</th>
                    <th className="px-4 py-3">Home</th>
                    <th className="px-4 py-3">{isHost ? "Tenant" : "Host"}</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Fee</th>
                    <th className="px-4 py-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-primary">
                  {statement.rows.map((row, index) => (
                    <tr key={`${row.reference ?? row.type}-${index}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.date}
                      </td>
                      <td className="px-4 py-3">
                        {TYPE_LABELS[row.type] ?? row.type}
                      </td>
                      <td className="px-4 py-3">{row.propertyTitle}</td>
                      <td className="px-4 py-3 text-muted">
                        {row.counterparty}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <PropertyPrice value={row.gross} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {row.commission ? (
                          <PropertyPrice value={row.commission} />
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        <PropertyPrice value={row.net} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
