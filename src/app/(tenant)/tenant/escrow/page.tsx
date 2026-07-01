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

const LEDGER = [
  { property: "The Glass House", amount: "₦480,000", state: "Held", tone: "bg-primary text-white" },
  { property: "Maitama Courtyard", amount: "₦620,000", state: "Docs review", tone: "bg-accent text-primary" },
  { property: "Harbour View", amount: "₦710,000", state: "Released", tone: "border border-primary text-primary" },
];

const CONTROLS = ["Identity verified", "Inspection window active", "Host payout locked"];

export default function TenantEscrowPage(): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg bg-primary p-6 text-white shadow-sm sm:p-8 lg:p-10">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Escrow command
          </p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[0.9] sm:text-6xl">
            ₦1.2m protected right now.
          </h1>
          <p className="mt-5 max-w-xl font-body text-base leading-7 text-white/70">
            Funds stay locked until move-in proof, host confirmation, and tenant
            inspection all line up.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/15 bg-white/[0.08] p-5">
              <ArrowDownLeft size={22} className="text-accent" />
              <p className="mt-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Incoming holds
              </p>
              <p className="mt-2 font-display text-3xl font-bold">₦620k</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/[0.08] p-5">
              <ArrowUpRight size={22} className="text-accent" />
              <p className="mt-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Ready soon
              </p>
              <p className="mt-2 font-display text-3xl font-bold">₦480k</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-primary/15 bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
                Release controls
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary">
                The Glass House payout gate
              </h2>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-accent">
              <LockKeyhole size={22} />
            </span>
          </div>

          <div className="mt-8 space-y-4">
            {CONTROLS.map((control) => (
              <div key={control} className="flex items-center justify-between gap-4 rounded-lg border border-primary/10 bg-surface-soft p-4">
                <span className="flex items-center gap-3 font-body text-sm font-bold text-primary">
                  <CheckCircle2 size={18} className="text-accent-alt" />
                  {control}
                </span>
                <span className="font-accent text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  Passed
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-accent bg-accent/10 p-5">
            <p className="font-body text-sm font-bold text-primary">
              Tenant inspection remains open for 31 hours.
            </p>
            <p className="mt-2 font-body text-sm leading-6 text-muted">
              Release will remain paused until the inspection window closes or
              the tenant approves early.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-primary/15 bg-[var(--color-bg)] shadow-sm">
        <div className="grid border-b border-primary/15 bg-surface-soft px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.18em] text-muted sm:grid-cols-[1fr_10rem_10rem] sm:px-6">
          <span>Protected booking</span>
          <span className="hidden sm:block">Amount</span>
          <span className="hidden sm:block">State</span>
        </div>
        {LEDGER.map((item) => (
          <article key={item.property} className="grid gap-4 border-b border-primary/10 p-5 last:border-b-0 sm:grid-cols-[1fr_10rem_10rem] sm:items-center sm:p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-accent">
                {item.state === "Released" ? <ReceiptText size={20} /> : <Landmark size={20} />}
              </span>
              <div>
                <p className="font-body text-lg font-bold text-primary">{item.property}</p>
                <p className="mt-1 font-body text-sm text-muted">Tenant escrow account</p>
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-primary">{item.amount}</p>
            <span className={`w-fit rounded-full px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] ${item.tone}`}>
              {item.state}
            </span>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          ["Dispute shield", "Active on every funded booking"],
          ["Refund window", "48 hours after move-in"],
          ["Audit trail", "Receipts stored automatically"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg border border-primary/15 bg-surface-soft p-5">
            <ShieldCheck size={22} className="text-accent-alt" />
            <p className="mt-4 font-body text-base font-bold text-primary">{title}</p>
            <p className="mt-2 font-body text-sm leading-6 text-muted">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
