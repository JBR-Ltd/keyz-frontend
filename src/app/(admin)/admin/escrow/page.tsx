"use client";

import { useCallback, type ReactElement } from "react";
import { ArrowRight } from "lucide-react";
import AdminQueueShell from "@/components/admin/AdminQueueShell";
import PropertyPrice from "@/components/property/PropertyPrice";
import { StatusBadge } from "@/components/ui/status-badge";
import { searchEscrow } from "@/lib/admin";
import type { EscrowEntry, EscrowStatus } from "@/lib/escrow";
import { useAdminSearch } from "@/lib/adminSearch";

const STATUS_OPTIONS = [
  { label: "Every status", value: "all" },
  { label: "Awaiting payment", value: "AWAITING_PAYMENT" },
  { label: "Held", value: "HELD" },
  { label: "Disputed", value: "DISPUTED" },
  { label: "On its way", value: "RELEASING" },
  { label: "Paid out", value: "RELEASED" },
  { label: "Refunded", value: "REFUNDED" },
  { label: "Failed", value: "FAILED" },
];

const STATUS_LABELS: Record<EscrowStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  HELD: "Held",
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

function formatMoment(value: string | null): string {
  if (!value) {
    return "Not yet";
  }

  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminEscrowPage(): ReactElement {
  const search = useAdminSearch<EscrowEntry>(searchEscrow);
  const { setStatus } = search;
  const onStatusChange = useCallback(
    (next: string) => setStatus(next === "all" ? "" : next),
    [setStatus],
  );

  return (
    <AdminQueueShell
      eyebrow="Admin portal"
      title="Escrow"
      intro="Money Rello is holding, and where each payment got to. Search by payment reference, listing or either party."
      searchLabel="Search payments"
      searchPlaceholder="Reference, listing or a person's name"
      statusOptions={STATUS_OPTIONS}
      status={search.status || "all"}
      onStatusChange={onStatusChange}
      query={search.query}
      onQueryChange={search.setQuery}
      page={search.page}
      totalPages={search.totalPages}
      totalItems={search.totalItems}
      onPageChange={search.goToPage}
      isLoading={search.isLoading}
      isSearching={search.isSearching}
      isEmpty={search.items.length === 0}
      emptyMessage="No payment matches that."
      error={search.error}
    >
      {search.items.map((entry) => (
        <article
          key={entry.id}
          className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={STATUS_TONES[entry.status]}>
                  {STATUS_LABELS[entry.status]}
                </StatusBadge>
                <span className="font-body text-xs text-muted">
                  booking #{entry.bookingId}
                </span>
              </div>
              <h2 className="mt-3 font-body text-lg font-bold text-primary">
                {entry.propertyTitle}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 font-body text-sm text-muted">
                {entry.tenant?.name ?? "Unknown tenant"}
                <ArrowRight size={13} aria-hidden="true" />
                {entry.host?.name ?? "Unknown host"}
              </p>
            </div>

            <p className="font-display text-2xl font-bold text-primary">
              <PropertyPrice value={entry.amount} />
            </p>
          </div>

          <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div>
              <dt className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Paid in
              </dt>
              <dd className="mt-1 font-body text-sm text-primary">
                {formatMoment(entry.heldAt)}
              </dd>
            </div>
            <div>
              <dt className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Paid out
              </dt>
              <dd className="mt-1 font-body text-sm text-primary">
                {formatMoment(entry.releasedAt)}
              </dd>
            </div>
            <div>
              <dt className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Opened
              </dt>
              <dd className="mt-1 font-body text-sm text-primary">
                {formatMoment(entry.createdAt)}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </AdminQueueShell>
  );
}
