"use client";

import { CreditCard, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PropertyPrice from "@/components/property/PropertyPrice";
import { useToast } from "@/components/ui/toast";

const PAYMENT_METHODS = [
  {
    brand: "Visa",
    number: "•••• 4821",
    expiry: "08 / 28",
    tone: "bg-primary/5 text-primary shadow-sm",
  },
  {
    brand: "Mastercard",
    number: "•••• 1094",
    expiry: "03 / 27",
    tone: "bg-accent/10 text-primary shadow-sm",
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

const LANDLORD_PAYMENT_METHODS = [
  {
    brand: "GTBank",
    number: "•••• 4821",
    expiry: "Verified",
    tone: "bg-primary/5 text-primary shadow-sm",
  },
  {
    brand: "Access Bank",
    number: "•••• 1094",
    expiry: "Verified",
    tone: "bg-accent/10 text-primary shadow-sm",
  },
];

const LANDLORD_BILLING_HISTORY = [
  {
    date: "July 08, 2026",
    description: "Ikoyi Waterfront Flat payout",
    amount: "₦1,200,000",
    status: "Released",
  },
  {
    date: "June 22, 2026",
    description: "Lekki Garden Maisonette payout",
    amount: "₦750,000",
    status: "Released",
  },
  {
    date: "June 04, 2026",
    description: "Maitama Serviced Duplex payout",
    amount: "₦950,000",
    status: "Released",
  },
];

export default function PaymentsSection() {
  const pathname = usePathname();
  const isLandlord = pathname.startsWith("/landlord");
  const paymentMethods = isLandlord
    ? LANDLORD_PAYMENT_METHODS
    : PAYMENT_METHODS;
  const billingHistory = isLandlord
    ? LANDLORD_BILLING_HISTORY
    : BILLING_HISTORY;
  const { notify } = useToast();

  return (
    <section className="overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">
      <div className="border-b border-border bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Money and methods
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Payments
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          {isLandlord
            ? "Review your payout accounts and previous property settlements."
            : "Review your saved payment methods and previous transactions."}
        </p>
      </div>

      <div className="p-5 sm:p-7">
        <div>
          <div className="flex items-center justify-between gap-5 border-b border-border pb-5">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
                {isLandlord ? "Payout accounts" : "Saved methods"}
              </h2>
              <p className="mt-2 hidden font-body text-xs font-medium uppercase tracking-[0.14em] text-muted sm:block">
                Scroll to explore
              </p>
            </div>
            {isLandlord ? (
              <Link
                href="/landlord/verify/payout"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Add payout account"
              >
                <Plus size={22} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() =>
                  notify({
                    title: "Payment method",
                    description:
                      "Cards are added when you pay for a booking, not here.",
                    variant: "success",
                  })
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Add payment method"
              >
                <Plus size={22} />
              </button>
            )}
          </div>

          <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 py-7 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
            {paymentMethods.map((method) => (
              <article
                key={method.number}
                className={`min-w-[17rem] snap-start rounded p-6 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md sm:min-w-[21rem] ${method.tone}`}
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
                  {isLandlord ? "Status" : "Expires"} {method.expiry}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
            {isLandlord ? "Payout history" : "Billing history"}
          </h2>
          <div className="mt-6 overflow-x-auto border-t border-border">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
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
                {billingHistory.map((entry) => (
                  <tr
                    key={`${entry.date}-${entry.description}`}
                    className="border-b border-border transition-all duration-200 ease-in-out hover:bg-surface-soft"
                  >
                    <td className="px-3 py-5 pl-0 font-body text-sm text-primary">
                      {entry.date}
                    </td>
                    <td className="px-3 py-5 font-body text-sm font-bold text-primary">
                      {entry.description}
                    </td>
                    <td className="px-3 py-5 font-body text-sm text-primary">
                      <PropertyPrice value={entry.amount} />
                    </td>
                    <td className="px-3 py-5">
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1.5 shadow-sm font-body text-xs font-medium text-primary">
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
