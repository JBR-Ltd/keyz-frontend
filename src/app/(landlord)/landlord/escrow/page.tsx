import type { ReactElement } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Landmark,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";

const PAYOUT_LEDGER = [
  {
    property: "Lekki Garden Maisonette",
    amount: "₦750,000",
    state: "Held",
    tone: "bg-primary/5 text-primary shadow-sm",
  },
  {
    property: "Maitama Serviced Duplex",
    amount: "₦950,000",
    state: "Inspection",
    tone: "bg-accent/10 text-primary shadow-sm",
  },
  {
    property: "Ikoyi Waterfront Flat",
    amount: "₦1,200,000",
    state: "Released",
    tone: "bg-bg text-primary shadow-sm",
  },
];

const RELEASE_CONTROLS = [
  "Landlord identity verified",
  "Tenant move-in confirmed",
  "Inspection window active",
];

export default function LandlordEscrowPage(): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg bg-[var(--color-bg)] p-6 text-primary shadow-sm sm:p-8 lg:p-10">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
            Payout command
          </p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[0.9] sm:text-6xl">
            <PropertyPrice value="₦1.7m" /> secured in escrow.
          </h1>
          <p className="mt-5 max-w-xl font-body text-base leading-7 text-muted">
            Booking funds remain protected until move-in confirmation and the
            tenant inspection window are complete.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-primary/5 p-5 shadow-sm">
              <ArrowDownLeft size={22} className="text-accent" />
              <p className="mt-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Pending release
              </p>
              <p className="mt-2 font-display text-3xl font-bold">
                <PropertyPrice value="₦950k" />
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 p-5 shadow-sm">
              <ArrowUpRight size={22} className="text-accent" />
              <p className="mt-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Released this month
              </p>
              <p className="mt-2 font-display text-3xl font-bold">
                <PropertyPrice value="₦4.8m" />
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
                Release controls
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary">
                Maitama payout gate
              </h2>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 text-accent-alt shadow-sm">
              <LockKeyhole size={22} />
            </span>
          </div>

          <div className="mt-8 space-y-4">
            {RELEASE_CONTROLS.map((control, index) => (
              <div
                key={control}
                className="flex items-center justify-between gap-4 rounded-lg bg-surface-soft p-4 shadow-sm"
              >
                <span className="flex items-center gap-3 font-body text-sm font-bold text-primary">
                  <CheckCircle2 size={18} className="text-accent-alt" />
                  {control}
                </span>
                <span className="font-accent text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  {index === RELEASE_CONTROLS.length - 1
                    ? "In progress"
                    : "Passed"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg bg-accent/10 p-5 shadow-sm">
            <p className="font-body text-sm font-bold text-primary">
              Tenant inspection remains open for 31 hours.
            </p>
            <p className="mt-2 font-body text-sm leading-6 text-muted">
              Your payout will be queued when the window closes or the tenant
              approves the property early.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="grid border-b border-primary/15 bg-surface-soft px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted sm:grid-cols-[1fr_10rem_10rem] sm:px-6">
          <span>Property payout</span>
          <span className="hidden sm:block">Amount</span>
          <span className="hidden sm:block">State</span>
        </div>
        {PAYOUT_LEDGER.map((item) => (
          <article
            key={item.property}
            className="grid gap-4 border-b border-primary/10 p-5 last:border-b-0 sm:grid-cols-[1fr_10rem_10rem] sm:items-center sm:p-6"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5 text-accent-alt shadow-sm">
                {item.state === "Released" ? (
                  <ReceiptText size={20} />
                ) : (
                  <Landmark size={20} />
                )}
              </span>
              <div>
                <p className="font-body text-lg font-bold text-primary">
                  {item.property}
                </p>
                <p className="mt-1 font-body text-sm text-muted">
                  Landlord payout account
                </p>
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-primary">
              <PropertyPrice value={item.amount} />
            </p>
            <span
              className={`w-fit rounded-full px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] ${item.tone}`}
            >
              {item.state}
            </span>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          ["Protected income", "Every funded booking is held securely"],
          ["Automatic release", "Payouts queue after tenant approval"],
          ["Complete records", "Receipts are stored for every transfer"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg bg-surface-soft p-5 shadow-sm">
            <ShieldCheck size={22} className="text-accent-alt" />
            <p className="mt-4 font-body text-base font-bold text-primary">
              {title}
            </p>
            <p className="mt-2 font-body text-sm leading-6 text-muted">
              {text}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
