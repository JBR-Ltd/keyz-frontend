"use client";

import { Loader2, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { useToast } from "@/components/ui/toast";
import type { Booking } from "@/lib/bookings";
import {
  choosePaymentPlan,
  getInstalments,
  startInstalmentPayment,
  type Instalment,
  type InstalmentStatus,
} from "@/lib/instalments";

interface InstalmentPlanSectionProps {
  booking: Booking;
  /** True until the booking's first payment has gone through. */
  canChoose: boolean;
  onChanged: (booking: Booking) => void;
}

const PLAN_LABELS: Record<number, string> = {
  1: "All at once",
  2: "2 parts",
  4: "Quarterly",
  12: "Monthly",
};

const STATUS_LABELS: Record<InstalmentStatus, string> = {
  SCHEDULED: "Upcoming",
  AWAITING_PAYMENT: "Payment started",
  OVERDUE: "Overdue",
  PAID: "Paid",
  RELEASING: "Paid",
  RELEASED: "Paid",
  REFUNDED: "Refunded",
  CANCELLED: "Not due",
};

const UNPAID: InstalmentStatus[] = ["SCHEDULED", "AWAITING_PAYMENT", "OVERDUE"];

function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export default function InstalmentPlanSection({
  booking,
  canChoose,
  onChanged,
}: InstalmentPlanSectionProps): ReactElement | null {
  const { notify } = useToast();
  const [schedule, setSchedule] = useState<Instalment[]>([]);
  const [busyPlan, setBusyPlan] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const count = booking.instalmentCount ?? 1;

  useEffect(() => {
    if (!booking.instalmentCount) {
      return;
    }

    let active = true;

    void getInstalments(booking.id).then((result) => {
      if (active) {
        setSchedule(result.data);
      }
    });

    return () => {
      active = false;
    };
  }, [booking.id, booking.instalmentCount]);

  if (!booking.instalmentsAllowed && !booking.instalmentCount) {
    return null;
  }

  const options = [1, 2, 4, 12].filter(
    (value) => value === 1 || value <= (booking.maxInstalments ?? 12),
  );

  const choose = async (value: number): Promise<void> => {
    if (value === count) {
      return;
    }

    setBusyPlan(value);
    const result = await choosePaymentPlan(booking.id, value);
    setBusyPlan(null);

    if (!result.data) {
      notify({ title: "Plan not changed", description: result.message ?? "Try again in a moment.", variant: "error" });
      return;
    }

    setSchedule(result.data);
    onChanged({ ...booking, instalmentCount: value === 1 ? null : value });
  };

  const pay = async (instalment: Instalment): Promise<void> => {
    setPayingId(instalment.id);
    const result = await startInstalmentPayment(instalment.id);

    if (!result.data) {
      setPayingId(null);
      notify({ title: "Payment could not start", description: result.message ?? "Try again in a moment.", variant: "error" });
      return;
    }

    window.location.assign(result.data);
  };

  const nextDue = schedule.find(
    (instalment) => instalment.sequenceNumber > 1 && UNPAID.includes(instalment.status),
  );

  return (
    <div className="mt-5 grid gap-4 rounded-xl bg-surface-soft p-4">
      <div>
        <p className="font-body text-sm font-bold text-primary">How you pay the rent</p>
        <p className="mt-1 font-body text-xs leading-5 text-muted">
          {canChoose
            ? "Your host accepts rent in parts. The deposit is paid with the first part. You can change this until you pay."
            : count > 1
              ? `Paid in ${count} parts. Each part is held for a few days before your host is paid.`
              : "Paid all at once."}
        </p>
      </div>

      {canChoose ? (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment plan">
          {options.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={count === value}
              onClick={() => void choose(value)}
              disabled={busyPlan !== null}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 ${
                count === value ? "bg-primary text-white" : "border border-primary/20 text-primary hover:bg-primary/5"
              }`}
            >
              {busyPlan === value ? <Loader2 size={13} className="animate-spin" /> : null}
              {PLAN_LABELS[value]}
            </button>
          ))}
        </div>
      ) : null}

      {schedule.length > 0 ? (
        <ol className="grid gap-2">
          {schedule.map((instalment) => (
            <li
              key={instalment.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-bg px-3 py-2 font-body text-sm"
            >
              <span className="min-w-0">
                <span className="block font-bold text-primary">
                  Part {instalment.sequenceNumber}
                  {instalment.sequenceNumber === 1 && booking.depositAmount ? ", with deposit" : ""}
                </span>
                <span className={`block text-xs ${instalment.status === "OVERDUE" ? "font-bold text-red-700" : "text-muted"}`}>
                  {STATUS_LABELS[instalment.status]} · due {formatDay(instalment.dueDate)}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-bold text-primary">
                  <PropertyPrice value={instalment.amount} />
                </span>
                {instalment.paidAt && instalment.sequenceNumber > 1 ? (
                  <Link
                    href={`/receipts/instalment/${instalment.id}`}
                    aria-label={`Receipt for part ${instalment.sequenceNumber}`}
                    className="text-accent-alt hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <ReceiptText size={16} />
                  </Link>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {!canChoose && nextDue ? (
        <button
          type="button"
          onClick={() => void pay(nextDue)}
          disabled={payingId !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 font-body text-sm font-bold text-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        >
          {payingId === nextDue.id ? <Loader2 size={15} className="animate-spin" /> : null}
          Pay part {nextDue.sequenceNumber} now
        </button>
      ) : null}
    </div>
  );
}
