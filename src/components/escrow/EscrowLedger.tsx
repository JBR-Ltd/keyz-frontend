"use client";

// Shared by landlords and agents. Everything here is scoped by the caller token,
// so the screen is identical for either role.

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Landmark,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";
import EscrowLedgerSkeleton from "@/components/escrow/EscrowLedgerSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyEscrow, type EscrowEntry, type EscrowStatus } from "@/lib/escrow";

const STATUS_LABELS: Record<EscrowStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  HELD: "Held",
  DISPUTED: "Disputed",
  RELEASING: "On its way",
  RELEASED: "Paid out",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

const STATUS_TONES: Record<EscrowStatus, string> = {
  AWAITING_PAYMENT: "bg-accent/10 text-primary shadow-sm",
  HELD: "bg-primary/5 text-primary shadow-sm",
  DISPUTED: "bg-red-700/10 text-red-700 shadow-sm",
  RELEASING: "bg-accent/10 text-primary shadow-sm",
  RELEASED: "bg-bg text-primary shadow-sm",
  REFUNDED: "bg-bg text-primary shadow-sm",
  FAILED: "bg-red-700/10 text-red-700 shadow-sm",
};

export default function EscrowLedger(): ReactElement {
  const [entries, setEntries] = useState<EscrowEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    void getMyEscrow().then((result) => {
      if (!active) {
        return;
      }

      setEntries(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const sumOf = (status: EscrowStatus): number =>
      entries
        .filter((entry) => entry.status === status)
        .reduce((total, entry) => total + entry.amount, 0);

    return {
      held: sumOf("HELD"),
      awaiting: sumOf("AWAITING_PAYMENT"),
      released: sumOf("RELEASED"),
    };
  }, [entries]);

  const awaitingRelease = useMemo(
    () => entries.find((entry) => entry.status === "HELD") ?? null,
    [entries],
  );

  if (isLoading) {
    return <EscrowLedgerSkeleton />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg bg-[var(--color-bg)] p-6 text-primary shadow-sm sm:p-8 lg:p-10">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
            Payout command
          </p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[0.9] sm:text-6xl">
            {isLoading ? (
              <span
                className="inline-block h-14 w-52 animate-pulse rounded-lg bg-primary/10 align-middle motion-reduce:animate-none sm:h-16"
                aria-label="Loading escrow total"
              />
            ) : (
              <PropertyPrice value={totals.held} />
            )}{" "}
            secured in escrow.
          </h1>
          <p className="mt-5 max-w-xl font-body text-base leading-7 text-muted">
            Tenants pay Rello up front. The money reaches your payout account
            once the tenant confirms they moved in.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-primary/5 p-5 shadow-sm">
              <ArrowDownLeft size={22} className="text-accent" />
              <p className="mt-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Awaiting payment
              </p>
              <div className="mt-2 font-display text-3xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-9 w-28" />
                ) : (
                  <PropertyPrice value={totals.awaiting} />
                )}
              </div>
            </div>
            <div className="rounded-lg bg-primary/5 p-5 shadow-sm">
              <ArrowUpRight size={22} className="text-accent" />
              <p className="mt-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Paid out to you
              </p>
              <div className="mt-2 font-display text-3xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-9 w-28" />
                ) : (
                  <PropertyPrice value={totals.released} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
                Release controls
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary">
                {awaitingRelease
                  ? `${awaitingRelease.propertyTitle} payout gate`
                  : "Nothing waiting on release"}
              </h2>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 text-accent-alt shadow-sm">
              <LockKeyhole size={22} />
            </span>
          </div>

          {awaitingRelease ? (
            <>
              <div className="mt-8 space-y-4">
                {[
                  ["Tenant paid", true],
                  ["Held by Rello", true],
                  // Always outstanding here: once the tenant releases, this row leaves the HELD list
                  ["Tenant confirmed move-in", false],
                ].map(([control, passed]) => (
                  <div
                    key={String(control)}
                    className="flex items-center justify-between gap-4 rounded-lg bg-surface-soft p-4 shadow-sm"
                  >
                    <span className="flex items-center gap-3 font-body text-sm font-bold text-primary">
                      <CheckCircle2
                        size={18}
                        className={passed ? "text-accent-alt" : "text-muted"}
                      />
                      {control}
                    </span>
                    <span className="font-accent text-xs font-bold uppercase tracking-[0.14em] text-muted">
                      {passed ? "Passed" : "Waiting"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-lg bg-accent/10 p-5 shadow-sm">
                <p className="font-body text-sm font-bold text-primary">
                  {awaitingRelease.status === "DISPUTED"
                    ? "A dispute is open on this booking."
                    : "Waiting on the tenant to confirm move-in."}
                </p>
                <p className="mt-2 font-body text-sm leading-6 text-muted">
                  {awaitingRelease.status === "DISPUTED"
                    ? "Nothing moves until Rello settles it."
                    : "You cannot release these funds yourself. That is what makes the hold worth something to the tenant."}
                </p>
              </div>
            </>
          ) : (
            <div className="mt-8">
              {isLoading ? (
                <div role="status" aria-label="Loading payout release status">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-3 h-5 w-1/2" />
                  <span className="sr-only">Loading payout release status</span>
                </div>
              ) : (
                <p className="font-body text-base leading-7 text-muted">
                  Funded bookings appear here once a tenant pays.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {loadError ? (
        <p className="mt-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      <section className="mt-8 rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="grid border-b border-primary/15 bg-surface-soft px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted sm:grid-cols-[1fr_10rem_10rem] sm:px-6">
          <span>Funded booking</span>
          <span className="hidden sm:block">Amount</span>
          <span className="hidden sm:block">State</span>
        </div>
        {isLoading ? (
          <div role="status" aria-label="Loading funded bookings">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={`loading-payout-${index + 1}`}
                className="grid gap-4 border-b border-primary/10 p-5 last:border-b-0 sm:grid-cols-[1fr_10rem_10rem] sm:items-center sm:p-6"
                aria-hidden="true"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-44 max-w-full" />
                    <Skeleton className="mt-2 h-4 w-28" />
                  </div>
                </div>
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            ))}
            <span className="sr-only">Loading funded bookings</span>
          </div>
        ) : entries.length === 0 ? (
          <p className="p-6 text-center font-body text-sm text-muted">
            No funded bookings yet.
          </p>
        ) : (
          entries.map((entry) => (
            <article
              key={entry.id}
              className="grid gap-4 border-b border-primary/10 p-5 last:border-b-0 sm:grid-cols-[1fr_10rem_10rem] sm:items-center sm:p-6"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5 text-accent-alt shadow-sm">
                  {entry.status === "RELEASED" ? (
                    <ReceiptText size={20} />
                  ) : (
                    <Landmark size={20} />
                  )}
                </span>
                <div>
                  <p className="font-body text-lg font-bold text-primary">
                    {entry.propertyTitle}
                  </p>
                  <p className="mt-1 font-body text-sm text-muted">
                    {entry.tenant?.name ?? "Tenant"}
                  </p>
                </div>
              </div>
              <p className="font-display text-2xl font-bold text-primary">
                <PropertyPrice value={entry.amount} />
              </p>
              <span
                className={`w-fit rounded-full px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] ${STATUS_TONES[entry.status]}`}
              >
                {STATUS_LABELS[entry.status]}
              </span>
            </article>
          ))
        )}
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          [
            "Verified payout account",
            "Paystack confirms the name on your account",
          ],
          [
            "Dispute hold",
            "An open dispute freezes a payout until it is settled",
          ],
          ["Audit trail", "Every movement is recorded against the booking"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg bg-surface-soft p-5 shadow-sm">
            <ShieldCheck size={22} className="text-accent-alt" />
            <p className="mt-4 font-body text-base font-bold text-primary">
              {title}
            </p>
            <p className="mt-2 font-body text-sm leading-6 text-muted">
              {text}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
