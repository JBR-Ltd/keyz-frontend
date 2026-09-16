"use client";

import { Download, Loader2, ScanSearch } from "lucide-react";
import { useState, type ReactElement } from "react";
import { useToast } from "@/components/ui/toast";

type ExportName = "large-payments" | "risk-flags" | "screenings";

const EXPORTS: { description: string; id: ExportName; label: string; ranged: boolean }[] = [
  {
    id: "large-payments",
    label: "Large payments",
    description: "Payments and instalments at or above the reporting threshold, with the payer's due diligence and screening status. For cash transaction reporting.",
    ranged: true,
  },
  {
    id: "risk-flags",
    label: "Risk flags",
    description: "Every flag raised in the range, with what the reviewing admin decided and why. The working file for suspicious transaction reports.",
    ranged: true,
  },
  {
    id: "screenings",
    label: "Screening exceptions",
    description: "People whose last sanctions and PEP screening was a possible match or did not run.",
    ranged: false,
  },
];

function isoDay(offsetDays: number): string {
  const day = new Date();
  day.setDate(day.getDate() + offsetDays);

  return day.toISOString().slice(0, 10);
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

/** Exports for SCUML and the NFIU, and screening on demand. Every export is audited on the server. */
export default function AdminCompliancePage(): ReactElement {
  const { notify } = useToast();
  const [from, setFrom] = useState(() => isoDay(-30));
  const [to, setTo] = useState(() => isoDay(0));
  const [busy, setBusy] = useState<ExportName | null>(null);
  const [userId, setUserId] = useState("");
  const [isScreening, setIsScreening] = useState(false);
  const [screening, setScreening] = useState("");

  const download = async (name: ExportName, ranged: boolean): Promise<void> => {
    setBusy(name);

    try {
      const query = ranged ? `?from=${from}&to=${to}` : "";
      const response = await fetch(`/api/admin/compliance/exports/${name}.csv${query}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const message =
          payload !== null && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "The export could not be created.";
        notify({ title: "Export failed", description: message, variant: "error" });
        return;
      }

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `rello-${name}-${ranged ? `${from}-to-${to}` : isoDay(0)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notify({ title: "Export failed", description: "Try again in a moment.", variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const screen = async (): Promise<void> => {
    if (!/^\d+$/.test(userId.trim())) {
      notify({ title: "Enter a user id", description: "Use the numeric id from the users admin.", variant: "error" });
      return;
    }

    setIsScreening(true);
    setScreening("");

    try {
      const response = await fetch(`/api/admin/compliance/screenings/${userId.trim()}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      const payload: unknown = await response.json().catch(() => null);
      const data =
        payload !== null && typeof payload === "object" && "data" in payload && payload.data !== null && typeof payload.data === "object"
          ? (payload.data as { status?: string })
          : null;

      if (!response.ok || !data?.status) {
        notify({ title: "Screening did not run", description: "Check the user id and try again.", variant: "error" });
        return;
      }

      setScreening(data.status);
    } catch {
      notify({ title: "Screening did not run", description: "Try again in a moment.", variant: "error" });
    } finally {
      setIsScreening(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">Compliance</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-primary">Reporting and screening</h1>
      <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
        Exports hold personal data. Download only what a report needs, store it where the compliance programme says,
        and never tell a customer they were flagged or screened.
      </p>

      <section className="mt-8 flex flex-wrap items-end gap-3">
        <label htmlFor="compliance-from" className="grid gap-1 font-body text-xs font-bold uppercase tracking-[0.12em] text-muted">
          From
          <input id="compliance-from" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="min-h-11 rounded-lg border border-border bg-bg px-3 font-body text-sm normal-case tracking-normal text-primary" />
        </label>
        <label htmlFor="compliance-to" className="grid gap-1 font-body text-xs font-bold uppercase tracking-[0.12em] text-muted">
          To
          <input id="compliance-to" type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="min-h-11 rounded-lg border border-border bg-bg px-3 font-body text-sm normal-case tracking-normal text-primary" />
        </label>
        <p className="font-body text-xs text-muted">Up to a year per file.</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {EXPORTS.map((item) => (
          <article key={item.id} className="flex flex-col rounded-lg bg-bg p-5 shadow-sm">
            <h2 className="font-body text-lg font-bold text-primary">{item.label}</h2>
            <p className="mt-2 flex-1 font-body text-sm leading-6 text-muted">{item.description}</p>
            <button
              type="button"
              onClick={() => void download(item.id, item.ranged)}
              disabled={busy !== null}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              {busy === item.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} aria-hidden="true" />}
              Download CSV
            </button>
          </article>
        ))}
      </section>

      <section className="mt-10 max-w-xl rounded-lg bg-bg p-5 shadow-sm">
        <h2 className="font-body text-lg font-bold text-primary">Screen a person now</h2>
        <p className="mt-2 font-body text-sm leading-6 text-muted">
          Runs sanctions, PEP and adverse media screening through Dojah. A possible match raises a risk flag for review.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <label htmlFor="compliance-user" className="sr-only">
            User id
          </label>
          <input
            id="compliance-user"
            inputMode="numeric"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="User id"
            className="min-h-11 flex-1 rounded-lg border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void screen()}
            disabled={isScreening}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          >
            {isScreening ? <Loader2 size={15} className="animate-spin" /> : <ScanSearch size={15} aria-hidden="true" />}
            Screen
          </button>
        </div>
        {screening ? (
          <p className="mt-3 font-body text-sm text-primary" role="status">
            Result: <span className="font-bold">{screening.replace(/_/g, " ").toLowerCase()}</span>
          </p>
        ) : null}
      </section>
    </main>
  );
}
