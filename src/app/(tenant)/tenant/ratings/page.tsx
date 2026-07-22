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

const PROMPTS = [
  "Was the listing accurate?",
  "How smooth was the handoff?",
  "Would you book with this host again?",
];

const HISTORY = [
  { property: "Harbour View Residence", score: "5.0", note: "Clear handoff" },
  { property: "Maitama Courtyard", score: "4.6", note: "Fast documents" },
  { property: "Ikoyi Studio Loft", score: "4.8", note: "Great support" },
];

export default function TenantRatingsPage(): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <section className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <aside className="rounded-lg bg-[var(--color-bg)] p-6 text-primary shadow-sm sm:p-8">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Review studio
          </p>
          <div className="mt-8 flex items-end gap-4">
            <p className="font-display text-7xl font-bold leading-none">4.8</p>
            <div className="pb-2">
              <div className="flex gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={18} fill="currentColor" />
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
              ["Reviews sent", "09"],
              ["Host replies", "06"],
              ["Pending", "01"],
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
                Rate The Glass House experience.
              </h1>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-alt shadow-sm">
              <PenLine size={22} />
            </span>
          </div>

          <div className="mt-8 rounded-lg bg-surface-soft p-5 shadow-sm">
            <p className="font-body text-sm font-bold text-primary">
              Tap a score
            </p>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  className={`rounded-lg border px-3 py-5 font-display text-3xl font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    score === 5
                      ? "border-transparent bg-accent/10 text-primary shadow-sm"
                      : "border-transparent bg-[var(--color-bg)] text-primary shadow-sm hover:bg-primary/5"
                  }`}
                >
                  {score}
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

          <button
            type="button"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded bg-primary px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Send size={16} />
            Submit review
          </button>
        </section>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {HISTORY.map((item) => (
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
            <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
              <CheckCircle2 size={15} className="text-primary" />
              {item.note}
            </p>
            <p className="mt-4 flex items-center gap-2 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary">
              <MessageSquareText size={15} />
              Host replied
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
