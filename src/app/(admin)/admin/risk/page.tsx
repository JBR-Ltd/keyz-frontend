"use client";

import { AlertTriangle, Loader2, Scale, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  getDepositClaims,
  getRiskFlags,
  reviewRiskFlag,
  settleDeposit,
  type RiskFlag,
  type RiskSeverity,
  type RiskStatus,
} from "@/lib/adminRisk";
import type { EscrowEntry } from "@/lib/escrow";

// === Constants

const SEVERITY_TONES: Record<RiskSeverity, "accent" | "danger" | "neutral"> = {
  HIGH: "danger",
  MEDIUM: "accent",
  LOW: "neutral",
};

const TYPE_LABELS: Record<string, string> = {
  HIGH_VALUE_PAYMENT: "Large payment",
  REFUND_PATTERN: "Repeated refunds",
  SHARED_PAYOUT_ACCOUNT: "Shared payout account",
  RAPID_CANCELLATION: "Cancelled straight after paying",
  DUE_DILIGENCE_INCOMPLETE: "Due diligence missing",
  MANUAL: "Raised by an admin",
};

const FILTERS: { id: RiskStatus | "ALL"; label: string }[] = [
  { id: "OPEN", label: "Open" },
  { id: "ESCALATED", label: "Escalated" },
  { id: "CLEARED", label: "Cleared" },
  { id: "ALL", label: "All" },
];

// === Helpers

function formatMoment(value: string | null): string {
  return value
    ? new Date(value).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
}

// === Component

/**
 * The compliance queue. Flags are raised by the system as money moves; a person
 * decides what they mean, and the note they leave is the record the money laundering
 * rules expect us to keep.
 */
export default function AdminRiskPage(): ReactElement {
  const { notify } = useToast();
  const [filter, setFilter] = useState<RiskStatus | "ALL">("OPEN");
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [claims, setClaims] = useState<EscrowEntry[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [splits, setSplits] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getRiskFlags(filter === "ALL" ? undefined : filter),
      getDepositClaims(),
    ]).then(([flagResult, claimResult]) => {
      if (!active) {
        return;
      }

      setFlags(flagResult.data);
      setClaims(claimResult.data);
      setLoadError(flagResult.message ?? claimResult.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [filter, reloadKey]);

  const review = async (
    flag: RiskFlag,
    status: "CLEARED" | "ESCALATED",
  ): Promise<void> => {
    const note = notes[flag.id] ?? "";

    if (note.trim().length < 5) {
      notify({
        title: "Write what you found",
        description: "The note is the record that this was looked at.",
        variant: "error",
      });
      return;
    }

    setBusyId(flag.id);
    const result = await reviewRiskFlag(flag.id, status, note);
    setBusyId(null);

    if (!result.data) {
      notify({
        title: "Not saved",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    notify({
      title: status === "CLEARED" ? "Flag cleared" : "Flag escalated",
      variant: "success",
    });
    setReloadKey((current) => current + 1);
  };

  const settle = async (claim: EscrowEntry): Promise<void> => {
    const held = claim.depositAmount ?? 0;
    const entered = Number(splits[claim.id] ?? "");

    if (!Number.isFinite(entered) || entered < 0 || entered > held) {
      notify({
        title: "Check the amount",
        description: `Return between 0 and ${held.toLocaleString("en-NG")}.`,
        variant: "error",
      });
      return;
    }

    const note = notes[claim.id] ?? "";

    if (note.trim().length < 5) {
      notify({
        title: "Say why",
        description: "Both sides are told the outcome.",
        variant: "error",
      });
      return;
    }

    setBusyId(claim.id);
    const result = await settleDeposit(claim.id, entered, note);
    setBusyId(null);

    if (!result.data) {
      notify({
        title: "Not settled",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    notify({ title: "Deposit settled", variant: "success" });
    setReloadKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header>
        <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
          Compliance
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-primary">
          Risk and deposits
        </h1>
        <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
          Flags are raised automatically as money moves. Clearing or escalating
          one is a decision a person makes, and the note is what makes it a
          record. Never tell a customer that a flag exists.
        </p>
      </header>

      <section className="mt-8">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Risk flag status">
          {FILTERS.map((item) => {
            const active = filter === item.id;

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(item.id)}
                className={
                  active
                    ? "inline-flex min-h-11 items-center rounded-full bg-primary px-4 font-body text-sm font-bold text-white"
                    : "inline-flex min-h-11 items-center rounded-full px-4 font-body text-sm font-bold text-muted hover:bg-primary/5 hover:text-primary"
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {loadError ? (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-bg px-4 py-3 font-body text-sm font-bold text-red-700">
            {loadError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="mt-8 font-body text-sm text-muted">Loading...</p>
        ) : flags.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-bg p-8 text-center">
            <ShieldCheck size={32} className="mx-auto text-accent-alt" />
            <p className="mt-4 font-body text-sm text-muted">
              Nothing in this list.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4">
            {flags.map((flag) => (
              <li
                key={flag.id}
                className="rounded-2xl border border-border bg-bg p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={SEVERITY_TONES[flag.severity]} size="sm">
                        {flag.severity}
                      </StatusBadge>
                      <span className="font-body text-sm font-bold text-primary">
                        {TYPE_LABELS[flag.type] ?? flag.type}
                      </span>
                      <span className="font-body text-xs text-muted">
                        {formatMoment(flag.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 font-body text-sm leading-6 text-muted">
                      {flag.detail}
                    </p>
                    <p className="mt-2 font-body text-xs text-muted">
                      {flag.userName ?? "Unknown"}
                      {flag.userEmail ? ` · ${flag.userEmail}` : ""}
                      {flag.propertyTitle ? ` · ${flag.propertyTitle}` : ""}
                      {flag.bookingId ? ` · booking ${flag.bookingId}` : ""}
                    </p>
                  </div>
                  {flag.amount ? (
                    <p className="font-display text-xl font-bold text-primary">
                      <PropertyPrice value={flag.amount} />
                    </p>
                  ) : null}
                </div>

                {flag.status === "OPEN" ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <input
                      value={notes[flag.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [flag.id]: event.target.value,
                        }))
                      }
                      placeholder="What did you find?"
                      className="min-h-11 w-full rounded-lg border border-border bg-bg px-4 font-body text-sm text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                    <button
                      type="button"
                      onClick={() => void review(flag, "CLEARED")}
                      disabled={busyId === flag.id}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/15 px-4 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                    >
                      {busyId === flag.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : null}
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(flag, "ESCALATED")}
                      disabled={busyId === flag.id}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-700 px-4 font-body text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                    >
                      <AlertTriangle size={15} />
                      Escalate
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg bg-surface-soft p-4 font-body text-sm leading-6 text-primary">
                    {flag.status === "CLEARED" ? "Cleared" : "Escalated"} by{" "}
                    {flag.reviewedBy ?? "an admin"} on{" "}
                    {formatMoment(flag.reviewedAt)}: {flag.reviewNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-bold text-primary">
          Deposit claims
        </h2>
        <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
          A host has claimed against a deposit. Decide how much goes back to the
          tenant; the rest is paid to the host. Fair wear and tear is not damage,
          and a claim without evidence is not a claim.
        </p>

        {claims.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-bg p-8 text-center">
            <Scale size={32} className="mx-auto text-accent-alt" />
            <p className="mt-4 font-body text-sm text-muted">
              No deposit claims waiting.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4">
            {claims.map((claim) => (
              <li
                key={claim.id}
                className="rounded-2xl border border-border bg-bg p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-sm font-bold text-primary">
                      {claim.propertyTitle}
                    </p>
                    <p className="mt-1 font-body text-xs text-muted">
                      {claim.tenant?.name ?? "Tenant"} and{" "}
                      {claim.host?.name ?? "host"} · booking {claim.bookingId}
                    </p>
                    <p className="mt-3 font-body text-sm leading-6 text-primary">
                      &ldquo;{claim.depositClaimNote}&rdquo;
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-xs text-muted">Deposit held</p>
                    <p className="font-display text-xl font-bold text-primary">
                      <PropertyPrice value={claim.depositAmount ?? 0} />
                    </p>
                    <p className="mt-1 font-body text-xs text-muted">
                      Claimed{" "}
                      <PropertyPrice value={claim.depositClaimAmount ?? 0} />
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
                  <label className="block">
                    <span className="sr-only">Amount back to the tenant</span>
                    <input
                      type="number"
                      min="0"
                      max={claim.depositAmount ?? 0}
                      value={splits[claim.id] ?? ""}
                      onChange={(event) =>
                        setSplits((current) => ({
                          ...current,
                          [claim.id]: event.target.value,
                        }))
                      }
                      placeholder="Back to tenant"
                      className="min-h-11 w-full rounded-lg border border-border bg-bg px-4 font-body text-sm text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                  <input
                    value={notes[claim.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [claim.id]: event.target.value,
                      }))
                    }
                    placeholder="What you decided, and why"
                    className="min-h-11 w-full rounded-lg border border-border bg-bg px-4 font-body text-sm text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                  <button
                    type="button"
                    onClick={() => void settle(claim)}
                    disabled={busyId === claim.id}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                  >
                    {busyId === claim.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : null}
                    Settle
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
