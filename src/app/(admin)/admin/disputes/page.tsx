"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Clock3, Loader2, Scale, ShieldCheck, UserRound } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getDisputeQueue,
  resolveDispute,
  type AdminResult,
} from "@/lib/admin";
import type { Dispute } from "@/lib/disputes";

type Outcome = "RESOLVED_FOR_TENANT" | "RESOLVED_FOR_HOST";

export default function AdminDisputesPage(): ReactElement {
  const { notify } = useToast();
  const [queue, setQueue] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    void getDisputeQueue().then((result: AdminResult<Dispute[]>) => {
      if (!active) {
        return;
      }

      setQueue(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const decide = async (
    dispute: Dispute,
    outcome: Outcome,
  ): Promise<void> => {
    setBusyId(dispute.id);
    const result = await resolveDispute(
      dispute.id,
      outcome,
      notes[dispute.id]?.trim() ?? "",
    );
    setBusyId(null);

    if (!result.data) {
      notify({
        title: "Dispute not closed",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    // Closing moves the money too, so it leaves the queue entirely
    setQueue((current) => current.filter((item) => item.id !== dispute.id));
    notify({
      title:
        outcome === "RESOLVED_FOR_TENANT"
          ? "Closed for the tenant, funds refunded"
          : "Closed for the host, funds released",
      variant: "success",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Review queue
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Disputes
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Cases the two parties could not settle. Closing one moves the money at
          the same time, so the decision and the payout never disagree.
        </p>
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <p className="py-16 text-center font-body text-sm text-muted">
          Loading the queue...
        </p>
      ) : queue.length === 0 ? (
        <div className="rounded-lg bg-surface-soft p-10 text-center shadow-sm">
          <ShieldCheck size={26} className="mx-auto text-accent-alt" />
          <h2 className="mt-4 font-display text-3xl font-bold text-primary">
            Queue is clear
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-base leading-7 text-muted">
            Nothing is waiting on a decision.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {queue.map((dispute) => (
            <article
              key={dispute.id}
              className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone="primary">DSP-{dispute.id}</StatusBadge>
                    <StatusBadge
                      tone={
                        dispute.status === "UNDER_REVIEW" ? "accent" : "neutral"
                      }
                    >
                      {dispute.status === "UNDER_REVIEW"
                        ? "Escalated"
                        : "Open"}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold text-primary">
                    {dispute.reason}
                  </h2>
                  <p className="mt-2 font-body text-sm text-muted">
                    {dispute.propertyTitle} · booking #{dispute.bookingId}
                  </p>
                </div>
                <div className="flex items-center gap-4 font-body text-sm text-muted">
                  <span className="flex items-center gap-2">
                    <UserRound size={15} className="text-primary/60" />
                    {dispute.raisedBy?.name ?? "Unknown"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 size={15} className="text-primary/60" />
                    {dispute.createdAt
                      ? new Date(dispute.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Recently"}
                  </span>
                </div>
              </div>

              {dispute.detail ? (
                <p className="mt-5 rounded-lg bg-surface-soft p-4 font-body text-sm leading-6 text-muted shadow-sm">
                  {dispute.detail}
                </p>
              ) : null}

              <label className="mt-5 block">
                <span className="font-body text-sm font-bold text-primary">
                  Decision note
                </span>
                <textarea
                  rows={3}
                  value={notes[dispute.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [dispute.id]: event.target.value,
                    }))
                  }
                  placeholder="Both parties see this. Say what decided it."
                  className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-sm text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void decide(dispute, "RESOLVED_FOR_TENANT")}
                  disabled={busyId === dispute.id}
                  className="flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  {busyId === dispute.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Scale size={15} />
                  )}
                  Refund the tenant
                </button>
                <button
                  type="button"
                  onClick={() => void decide(dispute, "RESOLVED_FOR_HOST")}
                  disabled={busyId === dispute.id}
                  className="flex items-center gap-2 rounded px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  <Scale size={15} />
                  Pay the host
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
