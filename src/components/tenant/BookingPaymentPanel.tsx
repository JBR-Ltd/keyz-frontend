"use client";

import {
  CircleDollarSign,
  Loader2,
  LockKeyhole,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactElement } from "react";
import CancelBookingDialog from "@/components/bookings/CancelBookingDialog";
import ComplianceDetailsDialog from "@/components/tenant/ComplianceDetailsDialog";
import PaymentStatusBadge from "@/components/bookings/PaymentStatusBadge";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { useToast } from "@/components/ui/toast";
import type { Booking } from "@/lib/bookings";
import {
  formatMoment,
  paymentStageOf,
  timeLeft,
  type PaymentStage,
} from "@/lib/bookingPayments";
import { startBookingPayment } from "@/lib/escrow";

// === Types

interface BookingPaymentPanelProps {
  booking: Booking;
  now: number;
  onChanged: (booking: Booking) => void;
}

interface PanelCopy {
  body: string;
  heading: string;
}

// === Helpers

function copyFor(
  stage: PaymentStage,
  booking: Booking,
  now: number,
): PanelCopy {
  const hostName = booking.host?.name ?? "the host";

  switch (stage) {
    case "due": {
      const deadline = booking.paymentDueAt
        ? `Pay by ${formatMoment(booking.paymentDueAt)}${timeLeft(booking.paymentDueAt, now) ? ` (${timeLeft(booking.paymentDueAt, now)})` : ""} to secure it. `
        : "";

      return {
        heading: "Accepted. Pay to secure it",
        body: `${deadline}Rello holds your payment and only pays ${hostName} a few days after you move in, so you have time to raise anything that is wrong.`,
      };
    }
    case "overdue":
      return {
        heading: "The time to pay has passed",
        body: "This booking is being released. If you have already paid, it is confirmed automatically and nothing is lost.",
      };
    case "held":
      return {
        heading: "Paid and protected",
        body: `Rello is holding your payment. ${hostName} is paid a few days after you move in, unless you report a problem first.`,
      };
    case "frozen":
      return {
        heading: "Your payment is on hold",
        body: "Rello is looking into this booking, so the money stays where it is until that is settled.",
      };
    case "paying_out":
    case "paid_out":
      return {
        heading: "Paid to your host",
        body: `Your payment has been released to ${hostName}.`,
      };
    case "refunding":
      return {
        heading: "Refund on its way",
        body: "Your payment is going back to the card or account you paid with. It usually arrives within a few working days.",
      };
    case "refunded":
      return {
        heading: "Refunded",
        body: "Your payment went back to the card or account you paid with.",
      };
    case "not_due":
      break;
  }

  if (booking.status === "PENDING") {
    return {
      heading: "Nothing to pay yet",
      body: `You only pay once ${hostName} accepts. We will email you as soon as they do.`,
    };
  }

  if (booking.status === "CANCELLED") {
    return {
      heading: "Cancelled",
      body: booking.cancellationReason
        ? `No payment was taken. Reason given: “${booking.cancellationReason}”`
        : "No payment was taken for this booking.",
    };
  }

  return {
    heading: "No payment on this booking",
    body: "Nothing was paid through Rello for this booking.",
  };
}

// === Component

export default function BookingPaymentPanel({
  booking,
  now,
  onChanged,
}: BookingPaymentPanelProps): ReactElement {
  const { notify } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [needsDetails, setNeedsDetails] = useState(false);
  const stage = paymentStageOf(booking, now);
  const copy = copyFor(stage, booking, now);
  const moneyMoving =
    booking.paymentStatus === "DISPUTED" ||
    booking.paymentStatus === "RELEASING" ||
    booking.paymentStatus === "RELEASED" ||
    booking.paymentStatus === "REFUNDING";
  const canCancel =
    (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
    !moneyMoving;
  const showsReceipt =
    stage === "held" ||
    stage === "paying_out" ||
    stage === "paid_out" ||
    stage === "refunding" ||
    stage === "refunded" ||
    stage === "frozen";

  const pay = async (): Promise<void> => {
    setIsStarting(true);
    const result = await startBookingPayment(booking.id);

    if (!result.data) {
      setIsStarting(false);

      // A payment large enough to report needs a few details first
      if (result.code === "COMPLIANCE_DETAILS_REQUIRED") {
        setNeedsDetails(true);
        return;
      }

      notify({
        title: "Payment could not start",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    // Paystack checkout is a full page, and returns the tenant to /tenant/payments/return
    window.location.assign(result.data);
  };

  return (
    <article className="rounded-2xl border border-border bg-bg p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <IconTile tone={stage === "due" ? "accent" : "primary"} size="lg">
          {stage === "held" ? (
            <LockKeyhole size={21} />
          ) : (
            <CircleDollarSign size={21} />
          )}
        </IconTile>
        <PaymentStatusBadge audience="tenant" booking={booking} now={now} />
      </div>

      <p className="mt-6 font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
        Payment
      </p>
      <p className="mt-3 font-display text-3xl font-bold text-primary">
        <PropertyPrice value={booking.totalPrice} />
      </p>
      {booking.depositAmount ? (
        <dl className="mt-3 grid gap-1 font-body text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Rent</dt>
            <dd className="text-primary">
              <PropertyPrice value={booking.totalPrice - booking.depositAmount} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Refundable deposit</dt>
            <dd className="text-primary">
              <PropertyPrice value={booking.depositAmount} />
            </dd>
          </div>
        </dl>
      ) : null}

      <h2 className="mt-4 font-body text-base font-bold text-primary">
        {copy.heading}
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        {copy.body}
      </p>

      <div className="mt-6 grid gap-3">
        {stage === "due" ? (
          <button
            type="button"
            onClick={() => void pay()}
            disabled={isStarting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
          >
            {isStarting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <LockKeyhole size={16} aria-hidden="true" />
            )}
            {isStarting ? "Opening secure checkout" : "Pay securely with Paystack"}
          </button>
        ) : null}

        {showsReceipt ? (
          <Link
            href="/tenant/escrow"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ReceiptText size={16} aria-hidden="true" />
            Payments and receipts
          </Link>
        ) : null}

        {canCancel ? (
          <button
            type="button"
            onClick={() => setIsCancelling(true)}
            className="mx-auto min-h-10 px-3 font-body text-xs font-bold text-muted underline-offset-4 hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {booking.status === "PENDING"
              ? "Withdraw request"
              : "Cancel booking"}
          </button>
        ) : null}
      </div>

      <ComplianceDetailsDialog
        open={needsDetails}
        onClose={() => setNeedsDetails(false)}
        onSaved={() => {
          setNeedsDetails(false);
          void pay();
        }}
      />

      <CancelBookingDialog
        key={isCancelling ? `cancel-${booking.id}` : "closed"}
        actor="tenant"
        booking={isCancelling ? booking : null}
        now={now}
        onClose={() => setIsCancelling(false)}
        onDone={(updated) => {
          setIsCancelling(false);
          onChanged(updated);
        }}
      />
    </article>
  );
}
