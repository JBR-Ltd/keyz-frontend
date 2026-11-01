import Link from "next/link";
import type { ReactElement } from "react";
import { POLICIES, POLICY_UPDATED } from "@/lib/policies";

export const metadata = {
  title: "Policies | Rello",
  description:
    "How Rello handles money, deposits, cancellations, disputes, verification and your data.",
};

export default function PoliciesPage(): ReactElement {
  return (
    <main className="min-h-screen bg-surface-soft px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
          The rules we run on
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
          Policies
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Every figure below is a setting the platform actually runs on: the
          window to pay, the day the host is paid, the deposit clock and the fee.
          If the product and this page ever disagree, the product is wrong and we
          want to hear about it.
        </p>
        <p className="mt-2 font-body text-sm text-muted">
          Last updated {POLICY_UPDATED}
        </p>

        <ul className="mt-10 grid gap-4">
          {POLICIES.map((policy) => (
            <li key={policy.slug}>
              <Link
                href={`/policies/${policy.slug}`}
                className="block rounded-2xl border border-border bg-bg p-6 transition-colors hover:border-primary/30 hover:bg-bg/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <h2 className="font-display text-2xl font-bold text-primary">
                  {policy.title}
                </h2>
                <p className="mt-2 font-body text-sm leading-6 text-muted">
                  {policy.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
