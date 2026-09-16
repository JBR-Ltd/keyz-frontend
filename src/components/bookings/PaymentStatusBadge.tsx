"use client";

import type { ReactElement } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Booking } from "@/lib/bookings";
import {
  PAYMENT_LABELS,
  PAYMENT_TONES,
  paymentStageOf,
  type PaymentAudience,
} from "@/lib/bookingPayments";

interface PaymentStatusBadgeProps {
  audience: PaymentAudience;
  booking: Booking;
  className?: string;
  now: number;
  size?: "md" | "sm";
}

/** Renders nothing while there is nothing to pay, so a request stays uncluttered. */
export default function PaymentStatusBadge({
  audience,
  booking,
  className,
  now,
  size = "sm",
}: PaymentStatusBadgeProps): ReactElement | null {
  const stage = paymentStageOf(booking, now);

  if (stage === "not_due") {
    return null;
  }

  return (
    <StatusBadge size={size} tone={PAYMENT_TONES[stage]} className={className}>
      {PAYMENT_LABELS[audience][stage]}
    </StatusBadge>
  );
}
