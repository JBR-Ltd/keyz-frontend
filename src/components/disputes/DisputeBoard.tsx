"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  escalateDispute,
  getMyDisputes,
  openDispute,
  withdrawDispute,
  type Dispute,
  type DisputeStatus,
} from "@/lib/disputes";
import { getHostBookings, getMyBookings, type Booking } from "@/lib/bookings";

interface DisputeBoardProps {
  /** Whose bookings to offer when opening a case. */
  perspective: "host" | "tenant";
}

const LANE_TITLES: Record<string, string> = {
  OPEN: "Needs action",
  UNDER_REVIEW: "Rello review",
  CLOSED: "Resolved",
};

const STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "With Rello",
  RESOLVED_FOR_TENANT: "Closed for tenant",
  RESOLVED_FOR_HOST: "Closed for host",
  WITHDRAWN: "Withdrawn",
};

function laneFor(status: DisputeStatus): string {
  if (status === "OPEN") return "OPEN";
  if (status === "UNDER_REVIEW") return "UNDER_REVIEW";
  return "CLOSED";
}

export default function DisputeBoard({
  perspective,
}: DisputeBoardProps): ReactElement {
  const { notify } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [newBookingId, setNewBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      const [disputeResult, bookingResult] = await Promise.all([
        getMyDisputes(),
        perspective === "host" ? getHostBookings() : getMyBookings(),
      ]);

      if (!active) {
        return;
      }

      setDisputes(disputeResult.data);
      setBookings(bookingResult.data);
      setLoadError(disputeResult.message ?? "");
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [perspective]);

  const lanes = useMemo(() => {
    const grouped: Record<string, Dispute[]> = {
      OPEN: [],
      UNDER_REVIEW: [],
      CLOSED: [],
    };

    disputes.forEach((dispute) =>
      grouped[laneFor(dispute.status)].push(dispute),
    );

    return grouped;
  }, [disputes]);

  const selected = useMemo(
    () =>
      disputes.find((dispute) => dispute.id === selectedId) ??
      disputes.find((dispute) => dispute.status === "OPEN") ??
      disputes[0] ??
      null,
    [disputes, selectedId],
  );

  /** A booking can only carry one live dispute, so those are filtered out. */
  const disputableBookings = useMemo(() => {
    const live = new Set(
      disputes
        .filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW")
        .map((d) => d.bookingId),
    );

    return bookings.filter(
      (booking) =>
        !live.has(booking.id) &&
        (booking.status === "CONFIRMED" || booking.status === "COMPLETED"),
    );
  }, [bookings, disputes]);

  const handleOpen = async (): Promise<void> => {
    const bookingId = Number(newBookingId);

    if (!Number.isFinite(bookingId) || bookingId <= 0 || !reason.trim()) {
      notify({
        title: "Fill in the case",
        description: "Choose a booking and say what went wrong.",
        variant: "error",
      });
      return;
    }

    setIsOpening(true);
    const result = await openDispute({
      bookingId,
      reason: reason.trim(),
      detail: detail.trim(),
    });
    setIsOpening(false);

    if (!result.data) {
      notify({
        title: "Dispute not opened",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setDisputes((current) => [result.data as Dispute, ...current]);
    setNewBookingId("");
    setReason("");
    setDetail("");
    notify({
      title: "Dispute opened",
      description: "The money on this booking is on hold.",
      variant: "success",
    });
  };

  const runAction = async (
    dispute: Dispute,
    action: "escalate" | "withdraw",
  ): Promise<void> => {
    setBusyId(dispute.id);
    const result =
      action === "escalate"
        ? await escalateDispute(dispute.id)
        : await withdrawDispute(dispute.id);
    setBusyId(null);

    if (!result.data) {
      notify({
        title: "Nothing changed",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    const updated = result.data;
    setDisputes((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    notify({
      title: action === "escalate" ? "Sent to Rello" : "Dispute withdrawn",
      variant: "success",
    });
  };

  const needsAction = lanes.OPEN.length;

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <header className="flex flex-col gap-6 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Resolution board
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
            Disputes
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
            Opening a case freezes the money on that booking until it is
            settled. Rello decides any case both sides cannot close themselves.
          </p>
        </div>
        {needsAction > 0 ? (
          <div className="rounded-lg bg-accent/10 p-5 shadow-sm">
            <p className="flex items-center gap-2 font-body text-sm font-bold text-primary">
              <AlertTriangle size={17} className="text-primary" />
              {needsAction} case{needsAction === 1 ? "" : "s"} still open
            </p>
          </div>
        ) : null}
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_21rem]">
        <div className="grid gap-5 lg:grid-cols-3">
          {(["OPEN", "UNDER_REVIEW", "CLOSED"] as const).map((lane) => (
            <section
              key={lane}
              className="rounded-lg bg-surface-soft p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-bold text-primary">
                  {LANE_TITLES[lane]}
                </h2>
                <span className="rounded-full bg-primary/5 px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary shadow-sm">
                  {lanes[lane].length}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {isLoading ? (
                  Array.from({ length: 2 }, (_, index) => (
                    <div
                      key={`loading-${lane}-${index + 1}`}
                      className="rounded-lg bg-[var(--color-bg)] p-5 shadow-sm"
                      aria-hidden="true"
                    >
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="mt-4 h-5 w-4/5" />
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-6 h-8 w-full" />
                    </div>
                  ))
                ) : lanes[lane].length === 0 ? (
                  <p className="font-body text-sm text-muted">Nothing here.</p>
                ) : (
                  lanes[lane].map((dispute) => (
                    <button
                      key={dispute.id}
                      type="button"
                      onClick={() => setSelectedId(dispute.id)}
                      className="w-full rounded-lg bg-[var(--color-bg)] p-5 text-left shadow-sm transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-primary">
                        DSP-{dispute.id}
                      </p>
                      <h3 className="mt-3 font-body text-base font-bold text-primary">
                        {dispute.reason}
                      </h3>
                      <p className="mt-3 font-body text-sm leading-6 text-muted">
                        {dispute.propertyTitle}
                      </p>
                      <div className="mt-5 flex items-center justify-between border-t border-primary/10 pt-4">
                        <span className="flex items-center gap-2 font-body text-sm text-muted">
                          <Clock3 size={15} className="text-primary" />
                          {STATUS_LABELS[dispute.status]}
                        </span>
                        <Scale size={17} className="text-primary" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>

        <aside className="rounded-lg bg-[var(--color-bg)] p-6 text-primary shadow-sm">
          {selected ? (
            <>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
                Case detail
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold">
                DSP-{selected.id}
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-muted">
                {selected.reason} on {selected.propertyTitle}.
              </p>

              {selected.detail ? (
                <p className="mt-4 rounded-lg bg-surface-soft p-4 font-body text-sm leading-6 text-muted shadow-sm">
                  {selected.detail}
                </p>
              ) : null}

              {selected.resolutionNote ? (
                <p className="mt-4 rounded-lg bg-accent/10 p-4 font-body text-sm leading-6 text-primary shadow-sm">
                  {selected.resolutionNote}
                </p>
              ) : null}

              {selected.status === "OPEN" ? (
                <div className="mt-7 grid gap-3">
                  <button
                    type="button"
                    onClick={() => void runAction(selected, "escalate")}
                    disabled={busyId === selected.id}
                    className="flex w-full items-center justify-center gap-2 rounded bg-accent px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary transition-all duration-200 ease-in-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                  >
                    {busyId === selected.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ShieldAlert size={16} />
                    )}
                    Ask Rello to decide
                  </button>
                  <button
                    type="button"
                    onClick={() => void runAction(selected, "withdraw")}
                    disabled={busyId === selected.id}
                    className="flex w-full items-center justify-center gap-2 rounded px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                  >
                    <CheckCircle2 size={16} />
                    Withdraw this case
                  </button>
                </div>
              ) : (
                <p className="mt-7 rounded-lg bg-surface-soft p-4 font-body text-sm leading-6 text-muted shadow-sm">
                  {selected.status === "UNDER_REVIEW"
                    ? "Rello is reviewing this case."
                    : "This case is closed."}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
                Open a case
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold">
                Something went wrong?
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-muted">
                Opening a case puts the money for that booking on hold straight
                away.
              </p>
            </>
          )}

          <div className="mt-8 border-t border-primary/10 pt-6">
            <p className="font-body text-sm font-bold text-primary">
              Open a new case
            </p>

            {disputableBookings.length === 0 ? (
              isLoading ? (
                <div role="status" aria-label="Loading eligible bookings">
                  <Skeleton className="mt-4 h-12 w-full" />
                  <Skeleton className="mt-3 h-12 w-full" />
                  <span className="sr-only">Loading eligible bookings</span>
                </div>
              ) : (
                <p className="mt-3 font-body text-sm leading-6 text-muted">
                  No bookings are eligible for a dispute right now.
                </p>
              )
            ) : (
              <div className="mt-4 grid gap-4">
                <Select
                  ariaLabel="Booking"
                  placeholder="Choose a booking"
                  value={newBookingId}
                  onValueChange={setNewBookingId}
                  className="min-h-12 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-sm text-primary"
                  options={disputableBookings.map((booking) => ({
                    label: `${booking.propertyTitle} (#${booking.id})`,
                    value: String(booking.id),
                  }))}
                />
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={120}
                  placeholder="What went wrong?"
                  aria-label="Reason"
                  className="min-h-12 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-sm text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <textarea
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  rows={4}
                  placeholder="Add any detail that helps settle this."
                  aria-label="Detail"
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-sm text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => void handleOpen()}
                  disabled={isOpening}
                  className="flex w-full items-center justify-center gap-2 rounded bg-primary px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  {isOpening ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShieldAlert size={16} />
                  )}
                  Open dispute
                </button>
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
