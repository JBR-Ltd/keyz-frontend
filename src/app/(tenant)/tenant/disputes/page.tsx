import type { ReactElement } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileImage,
  FileText,
  MessageSquareText,
  Scale,
} from "lucide-react";

const LANES = [
  {
    title: "Needs Action",
    tone: "bg-accent/10 text-primary shadow-sm",
    cases: [
      {
        id: "DSP-1042",
        title: "Fixture condition",
        meta: "Add inspection photos",
      },
      {
        id: "DSP-1019",
        title: "Viewing access delay",
        meta: "Confirm preferred outcome",
      },
    ],
  },
  {
    title: "Mediator Review",
    tone: "bg-primary/5 text-primary shadow-sm",
    cases: [
      {
        id: "DSP-1007",
        title: "Payment release hold",
        meta: "Mediator assigned",
      },
    ],
  },
  {
    title: "Resolved",
    tone: "bg-bg text-primary shadow-sm",
    cases: [
      { id: "DSP-0988", title: "Refund clarification", meta: "Closed Jun 22" },
    ],
  },
];

const EVIDENCE = [
  { label: "Inspection photos", value: "8 files", icon: FileImage },
  { label: "Lease agreement", value: "Signed PDF", icon: FileText },
  { label: "Host thread", value: "14 messages", icon: MessageSquareText },
];

export default function TenantDisputesPage(): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <header className="flex flex-col gap-6 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Resolution board
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
            Disputes
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
            A case board for tracking evidence, host responses, and mediator
            decisions across disputed bookings.
          </p>
        </div>
        <div className="rounded-lg bg-accent/10 p-5 shadow-sm">
          <p className="flex items-center gap-2 font-body text-sm font-bold text-primary">
            <AlertTriangle size={17} className="text-primary" />
            One case needs tenant evidence today
          </p>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[1fr_21rem]">
        <div className="grid gap-5 lg:grid-cols-3">
          {LANES.map((lane) => (
            <section
              key={lane.title}
              className="rounded-lg bg-surface-soft p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-bold text-primary">
                  {lane.title}
                </h2>
                <span
                  className={`rounded-full px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] ${lane.tone}`}
                >
                  {lane.cases.length}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {lane.cases.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg bg-[var(--color-bg)] p-5 shadow-sm"
                  >
                    <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      {item.id}
                    </p>
                    <h3 className="mt-3 font-body text-base font-bold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-3 font-body text-sm leading-6 text-muted">
                      {item.meta}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-primary/10 pt-4">
                      <span className="flex items-center gap-2 font-body text-sm text-muted">
                        <Clock3 size={15} className="text-primary" />
                        Active
                      </span>
                      <Scale size={17} className="text-primary" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="rounded-lg bg-[var(--color-bg)] p-6 text-primary shadow-sm">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
            Evidence drawer
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold">DSP-1042</h2>
          <p className="mt-3 font-body text-sm leading-6 text-muted">
            Fixture condition review for The Glass House. Attach final photo set
            before mediator assessment begins.
          </p>
          <div className="mt-7 space-y-4">
            {EVIDENCE.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-lg bg-surface-soft p-4 shadow-sm"
              >
                <span className="flex items-center gap-3 font-body text-sm font-bold">
                  <Icon size={18} className="text-accent" />
                  {label}
                </span>
                <span className="font-body text-sm text-muted">{value}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded bg-accent px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary transition-all duration-200 ease-in-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <CheckCircle2 size={16} />
            Submit evidence
          </button>
        </aside>
      </section>
    </main>
  );
}
