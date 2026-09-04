"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Landmark,
  Loader2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { useToast } from "@/components/ui/toast";
import {
  getMyEscrow,
  releaseEscrow,
  type EscrowEntry,
  type EscrowStatus,
} from "@/lib/escrow";

const STATUS_LABELS: Record<EscrowStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  HELD: "Held",
  DISPUTED: "Disputed",
  RELEASED: "Released",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

const STATUS_TONES: Record<EscrowStatus, string> = {
  AWAITING_PAYMENT: "bg-accent/10 text-primary shadow-sm",
  HELD: "bg-primary/5 text-primary shadow-sm",
  DISPUTED: "bg-red-700/10 text-red-700 shadow-sm",
  RELEASED: "bg-bg text-primary shadow-sm",
  REFUNDED: "bg-bg text-primary shadow-sm",
  FAILED: "bg-red-700/10 text-red-700 shadow-sm",
};

export default function TenantEscrowPage(): ReactElement {
  const { notify } = useToast();
  const [entries, setEntries] = useState<EscrowEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [releasingId, setReleasingId] = useState<number | null>(null);

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

  const nextRelease = useMemo(
    () => entries.find((entry) => entry.status === "HELD") ?? null,
    [entries],
  );

  const handleRelease = async (entry: EscrowEntry): Promise<void> => {
    setReleasingId(entry.id);
    const result = await releaseEscrow(entry.id);
    setReleasingId(null);

    if (!result.data) {
      notify({
        title: "Funds not released",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    const updated = result.data;
    setEntries((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    notify({ title: "Funds released to the host", variant: "success" });
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg bg-[var(--color-bg)] p-6 text-primary shadow-sm sm:p-8 lg:p-10">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
            Escrow command
          </p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[0.9] sm:text-6xl">
            <PropertyPrice value={totals.held} /> protected right now.
          </h1>
          <p className="mt-5 max-w-xl font-body text-base leading-7 text-muted">
            Money you have paid stays with Rello until you confirm you moved in.
            The host is paid only after you release it.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-primary/5 p-5 shadow-sm">
              <ArrowDownLeft size={22} className="text-accent" />
              <p className="mt-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Awaiting payment
              </p>
              <p className="mt-2 font-display text-3xl font-bold">
                <PropertyPrice value={totals.awaiting} />
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 p-5 shadow-sm">
              <ArrowUpRight size={22} className="text-accent" />
              <p className="mt-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Released to hosts
              </p>
              <p className="mt-2 font-display text-3xl font-bold">
                <PropertyPrice value={totals.released} />
              </p>
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
                {nextRelease
                  ? `${nextRelease.propertyTitle} payout gate`
                  : "Nothing waiting to release"}
              </h2>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 text-accent-alt shadow-sm">
              <LockKeyhole size={22} />
            </span>
          </div>

          {nextRelease ? (
            <>
              <div className="mt-8 space-y-4">
                {[
                  ["Payment received", true],
                  ["Held by Rello", true],
                  ["No open dispute", nextRelease.status !== "DISPUTED"],
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
                      {passed ? "Passed" : "Blocked"}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleRelease(nextRelease)}
                disabled={
                  releasingId === nextRelease.id ||
                  nextRelease.status === "DISPUTED"
                }
                className="mt-8 flex w-full items-center justify-center gap-2 rounded bg-primary px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
              >
                {releasingId === nextRelease.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Release <PropertyPrice value={nextRelease.amount} /> to the host
              </button>

              {nextRelease.status === "DISPUTED" ? (
                <p className="mt-4 font-body text-sm leading-6 text-red-700">
                  A dispute is open on this booking, so nothing can move until it
                  is settled.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-8 font-body text-base leading-7 text-muted">
              {isLoading
                ? "Loading your payments..."
                : "Once you pay for a confirmed booking it appears here."}
            </p>
          )}
        </div>
      </section>

      {loadError ? (
        <p className="mt-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      <section className="mt-8 rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="grid border-b border-primary/15 bg-surface-soft px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted sm:grid-cols-[1fr_10rem_10rem] sm:px-6">
          <span>Protected booking</span>
          <span className="hidden sm:block">Amount</span>
          <span className="hidden sm:block">State</span>
        </div>
        {isLoading ? (
          <p className="p-6 text-center font-body text-sm text-muted">
            Loading...
          </p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-center font-body text-sm text-muted">
            No protected bookings yet.
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
                    {entry.host?.name ?? "Host"}
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
          ["Dispute shield", "Opening a dispute freezes the money immediately"],
          ["You hold the key", "The host is paid only when you release"],
          ["Audit trail", "Every movement is recorded against the booking"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg bg-surface-soft p-5 shadow-sm">
            <ShieldCheck size={22} className="text-accent-alt" />
            <p className="mt-4 font-body text-base font-bold text-primary">
              {title}
            </p>
            <p className="mt-2 font-body text-sm leading-6 text-muted">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
