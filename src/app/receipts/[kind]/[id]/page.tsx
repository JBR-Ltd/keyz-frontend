"use client";

import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import {
  getInstalmentReceipt,
  getPaymentReceipt,
  type Receipt,
} from "@/lib/instalments";

interface ReceiptPageProps {
  params: Promise<{ id: string; kind: string }>;
}

function formatMoment(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/** A receipt people can print or save as PDF for an employer, an embassy or the next landlord. */
export default function ReceiptPage({ params }: ReceiptPageProps): ReactElement {
  const { id, kind } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const numericId = Number(id);
    const load =
      kind === "instalment" ? getInstalmentReceipt(numericId) : getPaymentReceipt(numericId);

    void load.then((result) => {
      if (!active) {
        return;
      }

      setReceipt(result.data);
      setError(result.data ? "" : result.message ?? "This receipt could not be loaded.");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, kind]);

  return (
    <main className="min-h-screen bg-surface-soft px-5 py-10 print:bg-white print:p-0 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 font-body text-sm font-bold text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
          {receipt ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Printer size={15} aria-hidden="true" />
              Print or save as PDF
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex justify-center rounded-2xl bg-bg py-24" role="status">
            <Loader2 size={22} className="animate-spin text-muted" />
            <span className="sr-only">Loading receipt</span>
          </div>
        ) : !receipt ? (
          <p className="rounded-2xl bg-bg p-8 text-center font-body text-sm text-red-700">{error}</p>
        ) : (
          <article className="rounded-2xl bg-bg p-8 shadow-sm print:rounded-none print:shadow-none sm:p-10">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
              <div>
                <p className="font-display text-3xl font-bold text-primary">Rello</p>
                <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-muted">Payment receipt</p>
              </div>
              <dl className="text-right font-body text-sm">
                <dt className="text-xs uppercase tracking-[0.12em] text-muted">Receipt</dt>
                <dd className="font-bold text-primary">{receipt.receiptNumber}</dd>
                <dt className="mt-2 text-xs uppercase tracking-[0.12em] text-muted">Paid</dt>
                <dd className="text-primary">{formatMoment(receipt.paidAt)}</dd>
              </dl>
            </header>

            <section className="grid gap-6 border-b border-border py-6 font-body text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Paid by</p>
                <p className="mt-1 font-bold text-primary">{receipt.payerName}</p>
                {receipt.payerEmail ? <p className="text-muted">{receipt.payerEmail}</p> : null}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Paid to</p>
                <p className="mt-1 font-bold text-primary">{receipt.hostName}</p>
                <p className="text-muted">Held and paid through Rello escrow</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Home</p>
                <p className="mt-1 font-bold text-primary">{receipt.propertyTitle}</p>
                <p className="text-muted">{receipt.propertyAddress}</p>
                <p className="text-muted">{receipt.period}</p>
              </div>
            </section>

            <table className="mt-6 w-full font-body text-sm">
              <tbody>
                {receipt.lines.map((line) => (
                  <tr key={line.label} className="border-b border-border">
                    <td className="py-3 text-primary">{line.label}</td>
                    <td className="py-3 text-right tabular-nums text-primary">
                      <PropertyPrice value={line.amount} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-4 font-bold text-primary">Total paid</td>
                  <td className="pt-4 text-right font-display text-2xl font-bold tabular-nums text-primary">
                    <PropertyPrice value={receipt.total} />
                  </td>
                </tr>
                {receipt.commission !== null ? (
                  <>
                    <tr>
                      <td className="pt-3 text-muted">Rello fee</td>
                      <td className="pt-3 text-right tabular-nums text-muted">
                        <PropertyPrice value={receipt.commission} />
                      </td>
                    </tr>
                    {receipt.hostAmount !== null ? (
                      <tr>
                        <td className="pt-1 text-muted">Paid out to the host</td>
                        <td className="pt-1 text-right tabular-nums text-muted">
                          <PropertyPrice value={receipt.hostAmount} />
                        </td>
                      </tr>
                    ) : null}
                  </>
                ) : null}
              </tbody>
            </table>

            <footer className="mt-8 grid gap-1 border-t border-border pt-5 font-body text-xs leading-5 text-muted">
              <p>Reference {receipt.reference} · Status {receipt.status.toLowerCase().replace(/_/g, " ")}</p>
              {receipt.refundedAt ? <p>Refunded {formatMoment(receipt.refundedAt)}</p> : null}
              <p>The refundable deposit is held by Rello for the tenant and is not income to the host.</p>
            </footer>
          </article>
        )}
      </div>
    </main>
  );
}
