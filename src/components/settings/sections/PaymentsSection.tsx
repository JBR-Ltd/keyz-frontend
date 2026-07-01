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
    <section className="overflow-hidden rounded-lg border border-primary/25 bg-[var(--color-bg)] shadow-sm">
      <div className="border-b border-primary bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Money and methods
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Payments
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Review your saved payment methods and previous transactions.
        </p>
      </div>

      <div className="p-5 sm:p-7">
        <div>
          <div className="flex items-center justify-between gap-5 border-b border-primary pb-5">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
                Saved methods
              </h2>
              <p className="mt-2 hidden font-body text-xs font-medium uppercase tracking-[0.14em] text-muted sm:block">
                Scroll to explore
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                notify({
                  title: "Payment method",
                  description: "Adding payment methods is simulated here.",
                  variant: "success",
                })
              }
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-accent-alt hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Add payment method"
            >
              <Plus size={22} />
            </button>
          </div>

          <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 py-7 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
            {PAYMENT_METHODS.map((method) => (
              <article
                key={method.number}
                className={`min-w-[17rem] snap-start rounded border border-primary p-6 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md sm:min-w-[21rem] ${method.tone}`}
              >
                <div className="flex items-start justify-between">
                  <CreditCard size={28} />
                  <p className="font-body text-xs font-medium uppercase tracking-[0.14em]">
                    {method.brand}
                  </p>
                </div>
                <p className="mt-14 font-display text-3xl font-bold">
                  {method.number}
                </p>
                <p className="mt-3 font-body text-xs font-medium uppercase tracking-[0.14em]">
                  Expires {method.expiry}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
            Billing history
          </h2>
          <div className="mt-6 overflow-x-auto border-t border-primary">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-primary">
                  {["Date", "Description", "Amount", "Status"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-3 py-4 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted first:pl-0"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {BILLING_HISTORY.map((entry) => (
                  <tr
                    key={`${entry.date}-${entry.description}`}
                    className="border-b border-primary/20 transition-all duration-200 ease-in-out hover:bg-surface-soft"
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
                    <td className="px-3 py-5">
                      <span className="inline-flex items-center rounded-full bg-accent px-3 py-1.5 font-body text-xs font-medium text-white">
                        {entry.status}
                      </span>
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
