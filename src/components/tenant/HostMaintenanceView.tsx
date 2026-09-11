"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Loader2, Wrench } from "lucide-react";
import { Select } from "@/components/ui/select";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  getHostMaintenanceRequests,
  updateMaintenanceRequest,
  type MaintenancePriority,
  type MaintenanceRequest,
  type MaintenanceStatus,
} from "@/lib/tenancy";

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  OPEN: "Reported",
  ACKNOWLEDGED: "Seen",
  IN_PROGRESS: "Being fixed",
  RESOLVED: "Fixed",
  CLOSED: "Closed",
  CANCELLED: "Withdrawn",
};

const STATUS_TONES: Record<
  MaintenanceStatus,
  "accent" | "danger" | "neutral" | "primary"
> = {
  OPEN: "accent",
  ACKNOWLEDGED: "primary",
  IN_PROGRESS: "primary",
  RESOLVED: "neutral",
  CLOSED: "neutral",
  CANCELLED: "neutral",
};

const PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  EMERGENCY: "Emergency",
  URGENT: "Urgent",
  NORMAL: "Normal",
  LOW: "Low",
};

/** What a host can move a live report to. Withdrawing belongs to the tenant. */
const NEXT_STEPS = [
  { label: "Mark as seen", value: "ACKNOWLEDGED" },
  { label: "Being fixed", value: "IN_PROGRESS" },
  { label: "Fixed", value: "RESOLVED" },
  { label: "Close it", value: "CLOSED" },
];

function formatMoment(value: string): string {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HostMaintenanceView(): ReactElement {
  const { notify } = useToast();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;

    void getHostMaintenanceRequests().then((result) => {
      if (!active) {
        return;
      }

      setRequests(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const moveTo = async (
    request: MaintenanceRequest,
    status: string,
  ): Promise<void> => {
    setBusyId(request.id);
    const result = await updateMaintenanceRequest(
      request.id,
      status as MaintenanceStatus,
      notes[request.id]?.trim() || undefined,
    );
    setBusyId(null);

    if (result.data === null) {
      notify({
        title: "Not saved",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    const updated = result.data;

    setRequests((current) =>
      current.map((item) => (item.id === request.id ? updated : item)),
    );
    notify({ title: "Tenant has been told", variant: "success" });
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Your properties
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Repairs
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          What tenants have reported. Every change you make here, and any note
          you leave, is what they see.
        </p>
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <CardListSkeleton count={3} label="Loading repair requests" />
      ) : requests.length === 0 ? (
        <div className="rounded-lg bg-surface-soft p-10 text-center shadow-sm">
          <Wrench size={26} className="mx-auto text-accent-alt" />
          <h2 className="mt-4 font-display text-3xl font-bold text-primary">
            Nothing is broken
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-base leading-7 text-muted">
            Repairs your tenants report will land here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => {
            const isLive =
              request.status !== "CLOSED" && request.status !== "CANCELLED";

            return (
              <article
                key={request.id}
                className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge tone={STATUS_TONES[request.status]}>
                    {STATUS_LABELS[request.status]}
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      request.priority === "EMERGENCY" ? "danger" : "neutral"
                    }
                  >
                    {PRIORITY_LABELS[request.priority]}
                  </StatusBadge>
                  <span className="font-body text-xs text-muted">
                    {formatMoment(request.createdAt)}
                  </span>
                </div>

                <h2 className="mt-3 font-body text-lg font-bold text-primary">
                  {request.title}
                </h2>
                <p className="mt-1 font-body text-sm text-muted">
                  {request.propertyTitle} · {request.tenant?.name ?? "Tenant"}
                </p>

                {request.description ? (
                  <p className="mt-3 max-w-2xl font-body text-base leading-7 text-primary">
                    {request.description}
                  </p>
                ) : null}

                {request.attachmentUrls.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {request.attachmentUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body text-sm font-medium text-accent-alt transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Photo
                      </a>
                    ))}
                  </div>
                ) : null}

                {request.hostNote ? (
                  <p className="mt-3 font-body text-sm text-muted">
                    Your last note: {request.hostNote}
                  </p>
                ) : null}

                {isLive ? (
                  <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
                    <label className="block font-body text-sm font-bold text-primary">
                      A note for the tenant
                      <input
                        type="text"
                        value={notes[request.id] ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        placeholder="Plumber comes Thursday morning."
                        className="mt-2 min-h-12 w-full rounded-lg border border-primary/15 bg-surface-soft px-4 font-body text-sm font-normal text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                      />
                    </label>

                    <div className="flex items-center gap-3">
                      {busyId === request.id ? (
                        <Loader2
                          size={16}
                          aria-hidden="true"
                          className="animate-spin text-muted"
                        />
                      ) : null}
                      <Select
                        ariaLabel="Move this repair along"
                        placeholder="Move it along"
                        options={NEXT_STEPS}
                        disabled={busyId === request.id}
                        onValueChange={(next) => void moveTo(request, next)}
                        className="min-h-12 sm:w-56"
                      />
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
