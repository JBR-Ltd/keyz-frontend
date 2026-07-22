import type { ReactElement } from "react";
import {
  Award,
  CheckCircle2,
  MessageSquareText,
  PenLine,
  Send,
  Sparkles,
  Star,
} from "lucide-react";

const RESPONSE_PROMPTS = [
  "Thank the tenant for their feedback",
  "Address the handover experience",
  "Share what will improve next time",
];

const REVIEW_HISTORY = [
  {
    tenant: "Ada Nwosu",
    property: "Lekki Garden Maisonette",
    score: "5.0",
    note: "Responsive host and smooth handover",
  },
  {
    tenant: "Femi Balogun",
    property: "Ikoyi Waterfront Flat",
    score: "4.7",
    note: "Accurate listing and clear communication",
  },
  {
    tenant: "Zainab Musa",
    property: "Maitama Serviced Duplex",
    score: "4.8",
    note: "Fast support throughout the stay",
  },
];

export default function LandlordRatingsPage(): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <section className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <aside className="rounded-lg bg-[var(--color-bg)] p-6 text-primary shadow-sm sm:p-8">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Host reputation
          </p>
          <div className="mt-8 flex items-end gap-4">
            <p className="font-display text-7xl font-bold leading-none">4.9</p>
            <div className="pb-2">
              <div className="flex gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={18} fill="currentColor" />
                ))}
              </div>
              <p className="mt-2 font-body text-sm text-muted">
                Average host rating
              </p>
            </div>
          </div>
          <p className="mt-8 font-body text-base leading-7 text-muted">
            Tenant feedback reflects listing accuracy, communication, and the
            quality of every property handover.
          </p>
          <div className="mt-8 grid gap-4">
            {[
              ["Reviews received", "24"],
              ["Replies sent", "19"],
              ["Awaiting reply", "02"],
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
                Reply requested
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-[0.95] text-primary sm:text-5xl">
                Respond to Ada&apos;s review.
              </h1>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-alt shadow-sm">
              <PenLine size={22} />
            </span>
          </div>

          <div className="mt-8 rounded-lg bg-surface-soft p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-body text-sm font-bold text-primary">
                  Lekki Garden Maisonette
                </p>
                <p className="mt-2 font-body text-sm text-muted">
                  “The home matched the photos and the key handover was easy.”
                </p>
              </div>
              <div className="flex items-center gap-2 font-display text-3xl font-bold text-primary">
                <Star size={22} className="text-accent" fill="currentColor" />
                5.0
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {RESPONSE_PROMPTS.map((prompt) => (
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

          <div className="mt-6 rounded-lg bg-surface-soft p-5 shadow-sm">
            <label
              htmlFor="landlord-review-response"
              className="font-body text-sm font-bold text-primary"
            >
              Public response
            </label>
            <textarea
              id="landlord-review-response"
              rows={4}
              placeholder="Write a thoughtful response to the tenant..."
              className="mt-3 w-full resize-none rounded-lg border border-border bg-bg px-4 py-3 font-body text-sm text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <button
            type="button"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded bg-primary px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Send size={16} />
            Publish response
          </button>
        </section>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {REVIEW_HISTORY.map((item) => (
          <article
            key={item.property}
            className="rounded-lg bg-[var(--color-bg)] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <Award size={22} className="text-primary" />
              <span className="font-display text-3xl font-bold text-primary">
                {item.score}
              </span>
            </div>
            <h2 className="mt-5 font-body text-base font-bold text-primary">
              {item.property}
            </h2>
            <p className="mt-2 font-body text-sm text-muted">{item.tenant}</p>
            <p className="mt-3 flex items-start gap-2 font-body text-sm leading-6 text-muted">
              <CheckCircle2 size={15} className="mt-1 shrink-0 text-primary" />
              {item.note}
            </p>
            <p className="mt-4 flex items-center gap-2 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary">
              <MessageSquareText size={15} />
              Response published
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
