"use client";

import { useCallback, useState, type ReactElement } from "react";
import { EyeOff, Loader2, RotateCcw, Star, Trash2 } from "lucide-react";
import AdminQueueShell from "@/components/admin/AdminQueueShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  moderateReview,
  searchReviews,
  type ModeratedReview,
  type ReviewModerationStatus,
} from "@/lib/admin";
import { useAdminSearch } from "@/lib/adminSearch";

const STATUS_OPTIONS = [
  { label: "Every review", value: "all" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Hidden", value: "HIDDEN" },
  { label: "Flagged", value: "FLAGGED" },
  { label: "Removed", value: "REMOVED" },
];

const STATUS_LABELS: Record<ReviewModerationStatus, string> = {
  PUBLISHED: "Published",
  HIDDEN: "Hidden",
  FLAGGED: "Flagged",
  REMOVED: "Removed",
};

const STATUS_TONES: Record<
  ReviewModerationStatus,
  "accent" | "danger" | "neutral" | "primary"
> = {
  PUBLISHED: "primary",
  HIDDEN: "neutral",
  FLAGGED: "accent",
  REMOVED: "danger",
};

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminRatingsPage(): ReactElement {
  const { notify } = useToast();
  const search = useAdminSearch<ModeratedReview>(searchReviews);
  const { replaceItem, setStatus } = search;
  const [busyId, setBusyId] = useState<number | null>(null);
  /** The review whose takedown reason is being written, and what to do with it. */
  const [pending, setPending] = useState<{
    id: number;
    status: ReviewModerationStatus;
  } | null>(null);
  const [reason, setReason] = useState("");

  const onStatusChange = useCallback(
    (next: string) => setStatus(next === "all" ? "" : next),
    [setStatus],
  );

  const decide = async (
    review: ModeratedReview,
    status: ReviewModerationStatus,
  ): Promise<void> => {
    setBusyId(review.id);
    const result = await moderateReview(review.id, status, reason.trim());
    setBusyId(null);

    if (result.data === null) {
      notify({
        title: "Decision not saved",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    replaceItem((item) => item.id === review.id, result.data);
    setPending(null);
    setReason("");
    notify({
      title:
        status === "PUBLISHED"
          ? "Review is back on the listing"
          : "Review taken off the listing",
      variant: "success",
    });
  };

  /** Two clicks for a takedown: the first opens the reason, the second commits it. */
  const takeDown = (
    review: ModeratedReview,
    status: ReviewModerationStatus,
  ): void => {
    if (pending?.id !== review.id || pending.status !== status) {
      setPending({ id: review.id, status });
      setReason("");
      return;
    }

    void decide(review, status);
  };

  return (
    <AdminQueueShell
      eyebrow="Admin portal"
      title="Ratings"
      intro="Reviews people have left. Hiding one takes it off the listing and off the score without deleting what was written, so a decision can be undone."
      searchLabel="Search reviews"
      searchPlaceholder="Words in the review, listing or reviewer"
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
      emptyMessage="No review matches that."
      error={search.error}
    >
      {search.items.map((review) => {
        const isPublished = review.status === "PUBLISHED";
        const isBusy = busyId === review.id;
        const awaitingReason = pending?.id === review.id;

        return (
          <article
            key={review.id}
            className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge tone={STATUS_TONES[review.status]}>
                    {STATUS_LABELS[review.status]}
                  </StatusBadge>
                  <span
                    className="flex items-center gap-1"
                    aria-label={`${review.rating} out of 5`}
                  >
                    {[1, 2, 3, 4, 5].map((step) => (
                      <Star
                        key={step}
                        size={14}
                        aria-hidden="true"
                        className={
                          step <= review.rating
                            ? "fill-accent text-accent"
                            : "text-primary/20"
                        }
                      />
                    ))}
                  </span>
                  <span className="font-body text-xs text-muted">
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                <p className="mt-3 max-w-2xl font-body text-base leading-7 text-primary">
                  {review.comment ?? "No words, only a rating."}
                </p>

                <p className="mt-3 font-body text-sm text-muted">
                  {review.reviewer?.name ?? "Unknown"} on{" "}
                  {review.subject?.name ?? "unknown"} · {review.propertyTitle}
                </p>

                {review.moderationReason ? (
                  <p className="mt-3 font-body text-sm text-muted">
                    Taken down because: {review.moderationReason}
                  </p>
                ) : null}

                {awaitingReason ? (
                  <label className="mt-5 block max-w-xl font-body text-sm font-bold text-primary">
                    Why is this coming down?
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={2}
                      placeholder="Names a phone number and asks to deal off the platform."
                      className="mt-2 w-full rounded-lg border border-primary/15 bg-surface-soft px-4 py-3 font-body text-sm font-normal text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                    />
                    <span className="mt-1 block font-body text-xs font-normal text-muted">
                      Kept on the record. Neither party sees it.
                    </span>
                  </label>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
              {isPublished ? (
                <>
                  <button
                    type="button"
                    onClick={() => takeDown(review, "HIDDEN")}
                    disabled={
                      isBusy ||
                      (pending?.id === review.id &&
                        pending.status === "HIDDEN" &&
                        reason.trim().length === 0)
                    }
                    className="flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isBusy ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <EyeOff size={15} aria-hidden="true" />
                    )}
                    {pending?.id === review.id && pending.status === "HIDDEN"
                      ? "Confirm hide"
                      : "Hide"}
                  </button>
                  <button
                    type="button"
                    onClick={() => takeDown(review, "REMOVED")}
                    disabled={
                      isBusy ||
                      (pending?.id === review.id &&
                        pending.status === "REMOVED" &&
                        reason.trim().length === 0)
                    }
                    className="flex items-center gap-2 rounded px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-red-700 shadow-sm transition-all duration-200 ease-in-out hover:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    {pending?.id === review.id && pending.status === "REMOVED"
                      ? "Confirm removal"
                      : "Remove"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void decide(review, "PUBLISHED")}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  {isBusy ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <RotateCcw size={15} aria-hidden="true" />
                  )}
                  Put it back
                </button>
              )}
            </div>
          </article>
        );
      })}
    </AdminQueueShell>
  );
}
