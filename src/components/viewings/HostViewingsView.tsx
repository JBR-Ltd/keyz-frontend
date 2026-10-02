"use client";

import { useEffect, useState, type ReactElement } from "react";
import { CalendarClock, Check, MapPin, Monitor, Video, X } from "lucide-react";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { StatusBadge } from "@/components/ui/status-badge";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  decideViewing,
  getHostViewings,
  joinViewing,
  type Viewing,
  type ViewingStatus,
} from "@/lib/viewings";

const STATUS_LABELS: Record<ViewingStatus, string> = {
  PENDING: "Waiting on you",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Done",
};

const STATUS_TONES: Record<
  ViewingStatus,
  "accent" | "danger" | "neutral" | "primary"
> = {
  PENDING: "accent",
  CONFIRMED: "primary",
  DECLINED: "danger",
  CANCELLED: "neutral",
  COMPLETED: "neutral",
};

function formatMoment(value: string): string {
  return new Date(value).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HostViewingsView(): ReactElement {
  const { notify } = useToast();
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getHostViewings().then((result) => {
      if (!active) {
        return;
      }

      setViewings(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const decide = async (
    viewing: Viewing,
    status: ViewingStatus,
  ): Promise<void> => {
    setBusyKey(`${viewing.id}:${status}`);
    const result = await decideViewing(viewing.id, status).finally(() =>
      setBusyKey(null),
    );

    if (result.data === null) {
      notify({
        title: "Not saved",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    const updated = result.data;

    setViewings((current) =>
      current.map((item) => (item.id === viewing.id ? updated : item)),
    );
    notify({
      title:
        status === "CONFIRMED"
          ? "Viewing confirmed"
          : status === "COMPLETED"
            ? "Marked as done"
            : "Viewing declined",
      variant: "success",
    });
  };

  // The room only opens for a confirmed virtual viewing, so the link is fetched
  // at the moment it is clicked rather than held on the page
  const openRoom = async (viewing: Viewing): Promise<void> => {
    setBusyKey(`${viewing.id}:ROOM`);
    const result = await joinViewing(viewing.id).finally(() =>
      setBusyKey(null),
    );

    if (result.data === null) {
      notify({
        title: "The room did not open",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    window.open(result.data.joinUrl, "_blank", "noopener,noreferrer");
  };

  const pending = viewings.filter((viewing) => viewing.status === "PENDING");
  const rest = viewings.filter((viewing) => viewing.status !== "PENDING");

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Your properties
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Viewings
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          People asking to see a home you let. Confirm a time and the viewing
          appears in their calendar too. Virtual ones open a video room here.
        </p>
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <CardListSkeleton count={3} label="Loading viewings" />
      ) : viewings.length === 0 ? (
        <div className="rounded-lg bg-surface-soft p-10 text-center shadow-sm">
          <CalendarClock size={26} className="mx-auto text-accent-alt" />
          <h2 className="mt-4 font-display text-3xl font-bold text-primary">
            No one has asked yet
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-base leading-7 text-muted">
            Requests to view your listings will land here.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {[
            { heading: "Waiting on you", items: pending },
            { heading: "Everything else", items: rest },
          ].map((group) =>
            group.items.length === 0 ? null : (
              <section key={group.heading}>
                <h2 className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-muted">
                  {group.heading}
                </h2>
                <div className="mt-4 grid gap-4">
                  {group.items.map((viewing) => (
                    <article
                      key={viewing.id}
                      className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-7"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge tone={STATUS_TONES[viewing.status]}>
                              {STATUS_LABELS[viewing.status]}
                            </StatusBadge>
                            <StatusBadge
                              tone="neutral"
                              icon={
                                viewing.type === "VIRTUAL" ? (
                                  <Monitor size={13} aria-hidden="true" />
                                ) : (
                                  <MapPin size={13} aria-hidden="true" />
                                )
                              }
                            >
                              {viewing.type === "VIRTUAL"
                                ? "Virtual"
                                : "In person"}
                            </StatusBadge>
                          </div>
                          <h3 className="mt-3 font-body text-lg font-bold text-primary">
                            {viewing.propertyTitle}
                          </h3>
                          <p className="mt-1 font-body text-sm text-muted">
                            {viewing.tenant?.name ?? "A tenant"} ·{" "}
                            {formatMoment(
                              viewing.scheduledStartAt ??
                                viewing.proposedStartAt,
                            )}
                          </p>
                          {viewing.note ? (
                            <p className="mt-3 max-w-xl font-body text-sm leading-6 text-primary">
                              {viewing.note}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
                        {viewing.status === "PENDING" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void decide(viewing, "CONFIRMED")}
                              disabled={
                                busyKey?.startsWith(`${viewing.id}:`) ?? false
                              }
                              aria-busy={busyKey === `${viewing.id}:CONFIRMED`}
                              className="flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                            >
                              <AsyncButtonContent
                                isPending={
                                  busyKey === `${viewing.id}:CONFIRMED`
                                }
                                pendingLabel="Confirming viewing…"
                              >
                                <Check size={15} aria-hidden="true" />
                                Confirm
                              </AsyncButtonContent>
                            </button>
                            <button
                              type="button"
                              onClick={() => void decide(viewing, "DECLINED")}
                              disabled={
                                busyKey?.startsWith(`${viewing.id}:`) ?? false
                              }
                              aria-busy={busyKey === `${viewing.id}:DECLINED`}
                              className="flex items-center gap-2 rounded px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                            >
                              <AsyncButtonContent
                                isPending={busyKey === `${viewing.id}:DECLINED`}
                                pendingLabel="Declining viewing…"
                              >
                                <X size={15} aria-hidden="true" />
                                Decline
                              </AsyncButtonContent>
                            </button>
                          </>
                        ) : null}

                        {viewing.status === "CONFIRMED" ? (
                          <>
                            {viewing.type === "VIRTUAL" ? (
                              <button
                                type="button"
                                onClick={() => void openRoom(viewing)}
                                disabled={
                                  busyKey?.startsWith(`${viewing.id}:`) ?? false
                                }
                                aria-busy={busyKey === `${viewing.id}:ROOM`}
                                className="flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                              >
                                <AsyncButtonContent
                                  isPending={busyKey === `${viewing.id}:ROOM`}
                                  pendingLabel="Opening viewing room…"
                                >
                                  <Video size={15} aria-hidden="true" />
                                  Open the room
                                </AsyncButtonContent>
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void decide(viewing, "COMPLETED")}
                              disabled={
                                busyKey?.startsWith(`${viewing.id}:`) ?? false
                              }
                              aria-busy={busyKey === `${viewing.id}:COMPLETED`}
                              className="flex items-center gap-2 rounded px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                            >
                              <AsyncButtonContent
                                isPending={
                                  busyKey === `${viewing.id}:COMPLETED`
                                }
                                pendingLabel="Completing viewing…"
                              >
                                Mark as done
                              </AsyncButtonContent>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </main>
  );
}
