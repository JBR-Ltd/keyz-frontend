"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Award,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  PenLine,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import RatingsPageSkeleton from "@/components/reviews/RatingsPageSkeleton";
import { getMyBookings, type Booking } from "@/lib/bookings";
import { getReviewsIWrote, submitReview, type Review } from "@/lib/reviews";

const PROMPTS = [
  "Was the listing accurate?",
  "How smooth was the handoff?",
  "Would you book with this host again?",
];

function formatScore(value: number): string {
  return value.toFixed(1);
}

export default function TenantRatingsPage(): ReactElement {
  const { notify } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      const [reviewResult, bookingResult] = await Promise.all([
        getReviewsIWrote(),
        getMyBookings(),
      ]);

      if (!active) {
        return;
      }

      setReviews(reviewResult.data);
      setBookings(bookingResult.data);
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const averageGiven = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    return (
      reviews.reduce((total, review) => total + review.rating, 0) /
      reviews.length
    );
  }, [reviews]);

  /** A stay is reviewable once it is complete and has not been reviewed yet. */
  const reviewableStay = useMemo(() => {
    const reviewedPropertyIds = new Set(
      reviews.map((review) => review.propertyId),
    );

    return (
      bookings.find(
        (booking) =>
          booking.status === "COMPLETED" &&
          !reviewedPropertyIds.has(booking.propertyId),
      ) ?? null
    );
  }, [bookings, reviews]);

  const handleSubmit = async (): Promise<void> => {
    if (!reviewableStay) {
      return;
    }

    setIsSending(true);
    const result = await submitReview({
      propertyId: reviewableStay.propertyId,
      rating: score,
      comment: comment.trim(),
    });
    setIsSending(false);

    if (!result.data) {
      notify({
        title: "Review not sent",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setReviews((current) => [result.data as Review, ...current]);
    setComment("");
    setScore(5);
    notify({ title: "Review sent", variant: "success" });
  };

  const pendingCount = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "COMPLETED" &&
          !reviews.some((review) => review.propertyId === booking.propertyId),
      ).length,
    [bookings, reviews],
  );

  if (isLoading) {
    return <RatingsPageSkeleton />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <section className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <aside className="rounded-lg bg-[var(--color-bg)] p-6 text-primary shadow-sm sm:p-8">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Review studio
          </p>
          <div className="mt-8 flex items-end gap-4">
            <p className="font-display text-7xl font-bold leading-none">
              {reviews.length ? formatScore(averageGiven) : "0.0"}
            </p>
            <div className="pb-2">
              <div className="flex gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    fill={
                      index < Math.round(averageGiven) ? "currentColor" : "none"
                    }
                  />
                ))}
              </div>
              <p className="mt-2 font-body text-sm text-muted">
                Average score given
              </p>
            </div>
          </div>
          <p className="mt-8 font-body text-base leading-7 text-muted">
            Your feedback improves matching, flags inaccurate listings, and
            builds trust for the next renter.
          </p>
          <div className="mt-8 grid gap-4">
            {[
              ["Reviews sent", String(reviews.length).padStart(2, "0")],
              [
                "Stays completed",
                String(
                  bookings.filter((booking) => booking.status === "COMPLETED")
                    .length,
                ).padStart(2, "0"),
              ],
              ["Pending", String(pendingCount).padStart(2, "0")],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-surface-soft p-4 shadow-sm"
              >
                <span className="font-body text-sm text-muted">{label}</span>
                <span className="font-display text-2xl font-bold text-accent">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
                Pending review
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-[0.95] text-primary sm:text-5xl">
                {isLoading
                  ? "Loading your stays."
                  : reviewableStay
                    ? `Rate your stay at ${reviewableStay.propertyTitle}.`
                    : "Nothing to review right now."}
              </h1>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-alt shadow-sm">
              <PenLine size={22} />
            </span>
          </div>

          {reviewableStay ? (
            <>
              <div className="mt-8 rounded-lg bg-surface-soft p-5 shadow-sm">
                <p className="font-body text-sm font-bold text-primary">
                  Tap a score
                </p>
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setScore(value)}
                      aria-pressed={score === value}
                      className={`rounded-lg border px-3 py-5 font-display text-3xl font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        score === value
                          ? "border-transparent bg-accent/10 text-primary shadow-sm"
                          : "border-transparent bg-[var(--color-bg)] text-primary shadow-sm hover:bg-primary/5"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {PROMPTS.map((prompt) => (
                  <div
                    key={prompt}
                    className="rounded-lg bg-[var(--color-bg)] p-5 shadow-sm"
                  >
                    <Sparkles size={18} className="text-primary" />
                    <p className="mt-4 font-body text-sm font-bold leading-6 text-primary">
                      {prompt}
                    </p>
                  </div>
                ))}
              </div>

              <label className="mt-6 block">
                <span className="font-body text-sm font-bold text-primary">
                  Your review
                </span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  placeholder="What should the next renter know?"
                  className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSending}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded bg-primary px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Submit review
              </button>
            </>
          ) : (
            <p className="mt-8 font-body text-base leading-7 text-muted">
              {isLoading
                ? "Checking which stays are ready to review."
                : "Once a stay is complete you can rate it here."}
            </p>
          )}
        </section>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {reviews.length === 0 ? (
          <p className="font-body text-sm text-muted">
            {isLoading
              ? "Loading your reviews..."
              : "Reviews you write will appear here."}
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-lg bg-[var(--color-bg)] p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <Award size={22} className="text-primary" />
                <span className="font-display text-3xl font-bold text-primary">
                  {formatScore(review.rating)}
                </span>
              </div>
              <h2 className="mt-5 font-body text-base font-bold text-primary">
                {review.propertyTitle}
              </h2>
              <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                <CheckCircle2 size={15} className="shrink-0 text-primary" />
                {review.comment ?? "No comment left"}
              </p>
              <p className="mt-4 flex items-center gap-2 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary">
                <MessageSquareText size={15} />
                {review.subject?.name ?? "Host"}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
