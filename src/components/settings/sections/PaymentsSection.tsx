"use client";

import { Landmark, ReceiptText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyEscrow, type EscrowEntry, type EscrowStatus } from "@/lib/escrow";
import {
  getBankName,
  maskAccountNumber,
  useHostVerification,
} from "@/lib/hostVerification";

const STATUS_LABELS: Record<EscrowStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  HELD: "Held in escrow",
  DISPUTED: "Disputed",
  RELEASING: "On its way",
  RELEASED: "Paid out",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

const STATUS_TONES: Record<
  EscrowStatus,
  "accent" | "danger" | "neutral" | "primary"
> = {
  AWAITING_PAYMENT: "accent",
  HELD: "primary",
  DISPUTED: "danger",
  RELEASING: "accent",
  RELEASED: "neutral",
  REFUNDED: "neutral",
  FAILED: "danger",
};

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaymentsSection(): ReactElement {
  const pathname = usePathname();
  const role = pathname.split("/")[1] ?? "tenant";
  const isHost = role === "landlord" || role === "agent";
  const { isLoading: isLoadingPayout, snapshot } = useHostVerification();
  const [entries, setEntries] = useState<EscrowEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    void getMyEscrow().then((result) => {
      if (!active) {
        return;
      }

      setEntries(result.data);
      setLoadError(result.message ?? "");
      setIsLoadingHistory(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const payout = snapshot?.payout ?? null;
  const hasPayoutAccount = payout?.accountLast4 != null;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-bg shadow-sm">
      <div className="border-b border-border bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Money
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Payments
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          {isHost
            ? "Rent is held in escrow and released to one account. Rello never stores your card."
            : "Rent is paid through the bank at checkout and held in escrow until your stay is honoured. Rello never stores your card."}
        </p>
      </div>

      {isHost ? (
        <div className="border-b border-border px-5 py-7 sm:px-7">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                <Landmark size={20} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-body text-lg font-bold text-primary">
                  Payout account
                </h3>
                {isLoadingPayout ? (
                  <div role="status" aria-label="Loading payout account">
                    <Skeleton className="mt-3 h-4 w-40" />
                    <Skeleton className="mt-2 h-4 w-28" />
                    <span className="sr-only">Loading payout account</span>
                  </div>
                ) : hasPayoutAccount ? (
                  <>
                    <p className="mt-2 font-body text-sm text-primary">
                      {getBankName(payout?.bankCode ?? null)} ·{" "}
                      {maskAccountNumber(payout?.accountLast4 ?? null)}
                    </p>
                    <p className="mt-1 font-body text-sm text-muted">
                      {payout?.accountName ?? "Verified account"}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                    You have not set one yet. Escrow cannot be released to you
                    until you do.
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/${role}/verify/payout`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/30 px-5 py-2.5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {hasPayoutAccount ? "Change account" : "Add an account"}
            </Link>
          </div>
          <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
            One account only. Changing it asks for the bank details again, so a
            payout can never quietly go somewhere new.
          </p>
        </div>
      ) : null}

      <div className="px-5 py-7 sm:px-7">
        <h3 className="font-body text-lg font-bold text-primary">
          {isHost ? "Money in and out" : "What you have paid"}
        </h3>

        {loadError ? (
          <p className="mt-3 font-body text-sm text-red-700">{loadError}</p>
        ) : null}

        {isLoadingHistory ? (
          <div
            className="mt-5 grid gap-3"
            role="status"
            aria-label="Loading payment history"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={`loading-payment-${index + 1}`}
                className="flex items-center justify-between gap-4 rounded-lg bg-surface-soft px-5 py-4"
                aria-hidden="true"
              >
                <div className="flex-1">
                  <Skeleton className="h-5 w-44 max-w-full" />
                  <Skeleton className="mt-2 h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
            <span className="sr-only">Loading payment history</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-5 rounded-lg bg-surface-soft p-8 text-center">
            <ReceiptText size={22} className="mx-auto text-accent-alt" />
            <p className="mt-3 font-body text-sm leading-6 text-muted">
              Nothing yet. Payments appear here as soon as a booking is paid
              for.
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-soft px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-bold text-primary">
                    {entry.propertyTitle}
                  </p>
                  <p className="mt-1 font-body text-xs text-muted">
                    {formatDate(entry.heldAt ?? entry.createdAt)} · booking #
                    {entry.bookingId}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge tone={STATUS_TONES[entry.status]}>
                    {STATUS_LABELS[entry.status]}
                  </StatusBadge>
                  <p className="font-display text-lg font-bold text-primary">
                    <PropertyPrice value={entry.amount} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
