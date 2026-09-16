"use client";

import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { verifyPaymentReturn, type EscrowEntry } from "@/lib/escrow";

// === Types

type ReturnPhase =
  | "checking"
  | "confirmed"
  | "pending"
  | "not_completed"
  | "failed";

interface ReturnState {
  entry: EscrowEntry | null;
  message: string;
  phase: ReturnPhase;
}

// === Constants

/**
 * Paystack usually confirms within seconds of the redirect. Past this, the webhook
 * finishes the job and the tenant is emailed a receipt, so the page stops asking.
 */
const CHECK_ATTEMPTS = 4;
const CHECK_INTERVAL_MS = 3000;

const MISSING_REFERENCE =
  "This page needs a payment reference. Open your bookings to see where your payment stands.";

// === Components

function Shell({ children }: { children: ReactElement }): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden bg-surface-soft px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-bg p-6 text-center shadow-sm sm:p-10">
        {children}
      </div>
    </main>
  );
}

function Checking(): ReactElement {
  return (
    <Shell>
      <div role="status" aria-live="polite">
        <Loader2
          size={40}
          className="mx-auto animate-spin text-accent-alt"
          aria-hidden="true"
        />
        <h1 className="mt-6 font-display text-3xl font-bold text-primary">
          Confirming your payment
        </h1>
        <p className="mt-3 font-body text-sm leading-6 text-muted">
          Checking with Paystack. This usually takes a few seconds.
        </p>
      </div>
    </Shell>
  );
}

function PaymentReturn(): ReactElement {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const cancelled = params.get("cancelled") === "true";
  const [state, setState] = useState<ReturnState>({
    entry: null,
    message: "",
    phase: "checking",
  });

  useEffect(() => {
    if (!reference) {
      return;
    }

    let active = true;
    let timer: number | undefined;

    const check = async (attempt: number): Promise<void> => {
      const result = await verifyPaymentReturn(reference);

      if (!active) {
        return;
      }

      if (!result.data) {
        setState({
          entry: null,
          message: result.message ?? "We could not check that payment.",
          phase: "failed",
        });
        return;
      }

      const entry = result.data;
      const unpaid =
        entry.status === "AWAITING_PAYMENT" || entry.status === "FAILED";

      if (!unpaid) {
        setState({ entry, message: "", phase: "confirmed" });
        return;
      }

      if (cancelled || entry.status === "FAILED") {
        setState({ entry, message: "", phase: "not_completed" });
        return;
      }

      if (attempt + 1 < CHECK_ATTEMPTS) {
        timer = window.setTimeout(
          () => void check(attempt + 1),
          CHECK_INTERVAL_MS,
        );
        return;
      }

      setState({ entry, message: "", phase: "pending" });
    };

    void check(0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cancelled, reference]);

  const phase: ReturnPhase = reference ? state.phase : "failed";
  const message = reference ? state.message : MISSING_REFERENCE;
  const entry = state.entry;

  if (phase === "checking") {
    return <Checking />;
  }

  const refundedInstead =
    entry?.status === "REFUNDING" || entry?.status === "REFUNDED";

  return (
    <Shell>
      <div>
        {phase === "confirmed" ? (
          <CheckCircle2
            size={44}
            className="mx-auto text-accent-alt"
            aria-hidden="true"
          />
        ) : phase === "pending" ? (
          <Clock3
            size={44}
            className="mx-auto text-accent-alt"
            aria-hidden="true"
          />
        ) : (
          <XCircle size={44} className="mx-auto text-red-700" aria-hidden="true" />
        )}

        <h1 className="mt-6 font-display text-3xl font-bold text-primary">
          {phase === "confirmed"
            ? refundedInstead
              ? "Payment received and being refunded"
              : "Payment received"
            : phase === "pending"
              ? "Still confirming your payment"
              : phase === "not_completed"
                ? "Payment not completed"
                : "We could not confirm this payment"}
        </h1>

        <p className="mx-auto mt-3 max-w-md font-body text-sm leading-6 text-muted">
          {phase === "confirmed"
            ? refundedInstead
              ? "This booking had already been cancelled, so your payment is going straight back to you."
              : "Rello is holding your payment. The host is paid a few days after you move in, and your receipt is on its way to your email."
            : phase === "pending"
              ? "Paystack has not confirmed it yet. You do not need to pay again: as soon as it confirms, your booking updates and we email your receipt."
              : phase === "not_completed"
                ? "No money was taken. You can pay from your booking any time before the deadline."
                : message}
        </p>

        {entry ? (
          <dl className="mt-8 grid gap-3 rounded-xl bg-surface-soft p-5 text-left font-body text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted">Home</dt>
              <dd className="truncate font-bold text-primary">
                {entry.propertyTitle}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted">Amount</dt>
              <dd className="font-bold text-primary">
                <PropertyPrice value={entry.amount} />
              </dd>
            </div>
            {entry.reference ? (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Reference</dt>
                <dd className="truncate font-mono text-xs text-primary">
                  {entry.reference}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/tenant/bookings"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {phase === "not_completed" ? "Back to your booking" : "View your booking"}
          </Link>
          {phase === "confirmed" ? (
            <Link
              href="/tenant/escrow"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/20 px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Payments and receipts
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

export default function PaymentReturnPage(): ReactElement {
  return (
    <Suspense fallback={<Checking />}>
      <PaymentReturn />
    </Suspense>
  );
}
