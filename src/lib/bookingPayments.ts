import type { Booking, LifecycleStage } from "@/lib/bookings";

// === Types

/**
 * Where the money on a booking stands, worked out once so the tenant's page, the
 * host's list and the drawer never disagree about it.
 */
export type PaymentStage =
  | "not_due"
  | "due"
  | "overdue"
  | "held"
  | "frozen"
  | "paying_out"
  | "paid_out"
  | "refunding"
  | "refunded";

export type PaymentAudience = "host" | "tenant";

export type PaymentTone = "accent" | "danger" | "neutral" | "primary";

// === Constants

export const PAYMENT_LABELS: Record<
  PaymentAudience,
  Record<PaymentStage, string>
> = {
  tenant: {
    not_due: "Nothing to pay yet",
    due: "Payment due",
    overdue: "Time to pay has passed",
    held: "Paid, held by Rello",
    frozen: "Payment on hold",
    paying_out: "Paid to host",
    paid_out: "Paid to host",
    refunding: "Refund on its way",
    refunded: "Refunded",
  },
  host: {
    not_due: "No payment yet",
    due: "Awaiting payment",
    overdue: "Not paid in time",
    held: "Paid, held in escrow",
    frozen: "Payment on hold",
    paying_out: "Payout on its way",
    paid_out: "Paid out",
    refunding: "Refunding tenant",
    refunded: "Refunded to tenant",
  },
};

export const PAYMENT_TONES: Record<PaymentStage, PaymentTone> = {
  not_due: "neutral",
  due: "accent",
  overdue: "danger",
  held: "primary",
  frozen: "danger",
  paying_out: "primary",
  paid_out: "neutral",
  refunding: "accent",
  refunded: "neutral",
};

// === Helpers

export function paymentStageOf(booking: Booking, now: number): PaymentStage {
  switch (booking.paymentStatus) {
    case "HELD":
      // Held on a booking already called off is a refund about to start
      return booking.status === "CANCELLED" ? "refunding" : "held";
    case "DISPUTED":
      return "frozen";
    case "RELEASING":
      return "paying_out";
    case "RELEASED":
      return "paid_out";
    case "REFUNDING":
      return "refunding";
    case "REFUNDED":
      return "refunded";
    default:
      break;
  }

  if (booking.status !== "CONFIRMED") {
    return "not_due";
  }

  return booking.paymentDueAt && parseMoment(booking.paymentDueAt) < now
    ? "overdue"
    : "due";
}

/** The day the stay or tenancy began, if one has been agreed. */
export function occupancyStart(booking: Booking): string | null {
  return booking.bookingKind === "RENTAL_REQUEST"
    ? (booking.tenancyStartDate ?? booking.startDate)
    : booking.startDate;
}

/**
 * Whether the stay or tenancy has begun. Once it has, a paid booking is no longer
 * cancelled from the booking; a problem goes through a report instead.
 */
export function hasBegun(booking: Booking, now: number): boolean {
  const start = occupancyStart(booking);

  return start ? parseDay(start) <= now : false;
}

export function parseDay(value: string): number {
  return new Date(`${value}T00:00:00`).getTime();
}

/** The server sends moments without a zone, meaning its own local time. */
export function parseMoment(value: string): number {
  return new Date(value).getTime();
}

export function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDay(new Date());
}

export function shiftDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toIsoDay(date);
}

export function formatDay(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMoment(value: string): string {
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "5 hours left", "40 minutes left", or null once the moment has passed. */
export function timeLeft(value: string, now: number): string | null {
  const minutes = Math.floor((parseMoment(value) - now) / 60000);

  if (minutes <= 0) {
    return null;
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} left`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 48) {
    return `${hours} hour${hours === 1 ? "" : "s"} left`;
  }

  const days = Math.floor(hours / 24);

  return `${days} days left`;
}

/** The four tabs a host sorts tenancies into. */
export type HostTenancyStage = "active" | "past" | "request" | "upcoming";

const STAGE_BY_LIFECYCLE: Record<LifecycleStage, HostTenancyStage> = {
  REQUEST: "request",
  UPCOMING: "upcoming",
  ACTIVE: "active",
  PAST: "past",
};

/**
 * The server's own reading of where a booking is, when it sent one. An accepted
 * rental is upcoming until its move-in, which the client cannot tell from status.
 */
export function stageFromLifecycle(booking: Booking): HostTenancyStage | null {
  return booking.lifecycleStage
    ? STAGE_BY_LIFECYCLE[booking.lifecycleStage]
    : null;
}

/** Once the money has settled, the move-in it was counted from is history. */
export function moveInLocked(booking: Booking): boolean {
  return (
    booking.paymentStatus === "RELEASING" ||
    booking.paymentStatus === "RELEASED" ||
    booking.paymentStatus === "REFUNDING" ||
    booking.paymentStatus === "REFUNDED"
  );
}

/** One line on where the money stands, as a host needs to read it. */
export function describePaymentForHost(booking: Booking, now: number): string {
  switch (paymentStageOf(booking, now)) {
    case "due":
      return booking.paymentDueAt
        ? `Tenant has until ${formatMoment(booking.paymentDueAt)} to pay`
        : "Waiting for the tenant to pay";
    case "overdue":
      return "Not paid in time, so it is being released";
    case "held":
      return "Paid and held by Rello until a few days after move-in";
    case "frozen":
      return "On hold while Rello reviews it";
    case "paying_out":
      return "On its way to your bank account";
    case "paid_out":
      return "Paid out to your bank account";
    case "refunding":
    case "refunded":
      return "Returned to the tenant";
    case "not_due":
      return booking.status === "PENDING"
        ? "Nothing is charged until you accept"
        : "No payment was taken";
  }
}
