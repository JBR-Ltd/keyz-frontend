"use client";

import { CreditCard, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const PAYMENT_METHODS = [
  {
    brand: "Visa",
    number: "•••• 4821",
    expiry: "08 / 28",
    tone: "bg-primary text-white",
  },
  {
    brand: "Mastercard",
    number: "•••• 1094",
    expiry: "03 / 27",
    tone: "bg-accent text-primary",
  },
];

const BILLING_HISTORY = [
  {
    date: "May 18, 2026",
    description: "Featured viewing deposit",
    amount: "₦25,000",
    status: "Paid",
  },
  {
    date: "April 02, 2026",
    description: "Property reservation",
    amount: "₦150,000",
    status: "Paid",
  },
  {
    date: "March 11, 2026",
    description: "Virtual tour access",
    amount: "₦8,500",
    status: "Paid",
  },
];

export default function PaymentsSection() {
  const { notify } = useToast();

  return (
    <section className="border border-primary">
      <div className="border-b border-primary bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Money and methods
        </p>
        <h2 className="mt-3 font-display text-4xl font-bold leading-none text-primary">
          Payments
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Review your saved payment methods and previous transactions.
        </p>
      </div>

      <div className="p-5 sm:p-7">
        <div>
          <div className="flex items-end justify-between gap-5 border-b border-primary pb-5">
            <h2 className="font-display text-4xl font-bold text-primary">
              Saved methods
            </h2>
            <p className="hidden font-accent text-xs font-bold uppercase tracking-[0.22em] text-muted sm:block">
              Scroll to explore
            </p>
          </div>

          <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 py-7 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
            {PAYMENT_METHODS.map((method) => (
              <article
                key={method.number}
                className={`min-w-[17rem] snap-start border border-primary p-6 sm:min-w-[21rem] ${method.tone}`}
              >
                <div className="flex items-start justify-between">
                  <CreditCard size={28} />
                  <p className="font-accent text-xs font-bold uppercase tracking-[0.25em]">
                    {method.brand}
                  </p>
                </div>
                <p className="mt-14 font-display text-3xl font-bold">
                  {method.number}
                </p>
                <p className="mt-3 font-accent text-xs font-bold uppercase tracking-[0.2em]">
                  Expires {method.expiry}
                </p>
              </article>
            ))}

            <button
              type="button"
              onClick={() =>
                notify({
                  title: "Payment method",
                  description: "Adding payment methods is simulated here.",
                  variant: "success",
                })
              }
              className="flex min-w-[15rem] snap-start flex-col items-center justify-center border border-primary bg-[var(--color-bg)] p-6 text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Plus size={32} />
              <span className="mt-4 font-body text-sm font-bold">
                Add payment method
              </span>
            </button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-4xl font-bold text-primary sm:text-5xl">
            Billing history
          </h2>
          <div className="mt-6 overflow-x-auto border-t border-primary">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-primary">
                  {["Date", "Description", "Amount", "Status"].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 py-4 font-accent text-xs font-bold uppercase tracking-[0.22em] text-muted first:pl-0"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BILLING_HISTORY.map((entry) => (
                  <tr
                    key={`${entry.date}-${entry.description}`}
                    className="border-b border-primary"
                  >
                    <td className="px-3 py-5 pl-0 font-body text-sm text-primary">
                      {entry.date}
                    </td>
                    <td className="px-3 py-5 font-body text-sm font-bold text-primary">
                      {entry.description}
                    </td>
                    <td className="px-3 py-5 font-body text-sm text-primary">
                      {entry.amount}
                    </td>
                    <td className="px-3 py-5 font-accent text-xs font-bold uppercase tracking-[0.18em] text-accent-alt">
                      {entry.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
