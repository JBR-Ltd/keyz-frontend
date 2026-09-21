"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  getAdminReports,
  reviewReport,
  type AdminReport,
  type ReportReason,
} from "@/lib/marketplace";

const REASON_LABELS: Record<ReportReason, string> = {
  FAKE_LISTING: "Fake or not theirs",
  WRONG_PRICE: "Wrong price or details",
  OFF_PLATFORM_PAYMENT: "Asked to pay outside Rello",
  EXTRA_FEES: "Hidden fees",
  DISCRIMINATION: "Discrimination",
  HARASSMENT: "Harassment",
  SCAM: "Scam",
  UNSAFE: "Unsafe home",
  OTHER: "Other",
};

const FILTERS: { id: AdminReport["status"] | "ALL"; label: string }[] = [
  { id: "OPEN", label: "Open" },
  { id: "ACTIONED", label: "Actioned" },
  { id: "DISMISSED", label: "Dismissed" },
  { id: "ALL", label: "All" },
];

/** Reports from tenants and hosts. The reporter is never revealed to the person reported. */
export default function AdminReportsPage(): ReactElement {
  const { notify } = useToast();
  const [filter, setFilter] = useState<AdminReport["status"] | "ALL">("OPEN");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const requestKey = `${filter}:${page}:${reloadKey}`;
  const isLoading = loadedRequestKey !== requestKey;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    void getAdminReports(
      filter === "ALL" ? undefined : filter,
      controller.signal,
      page,
      pageSize,
    )
      .then((result) => {
        if (!active) {
          return;
        }

        setReports(result.data);
        if (!result.message) {
          setTotal(result.total ?? result.data.length);
          const lastPage = Math.max(
            0,
            Math.ceil((result.total ?? result.data.length) / pageSize) - 1,
          );
          if (page > lastPage) setPage(lastPage);
        }
        setError(result.message ?? "");
        setLoadedRequestKey(requestKey);
      })
      .catch(() => {
        if (active) {
          setError("Reports could not be loaded.");
          setLoadedRequestKey(requestKey);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [filter, page, requestKey]);

  const decide = async (
    report: AdminReport,
    status: "ACTIONED" | "DISMISSED",
  ): Promise<void> => {
    const note = (notes[report.id] ?? "").trim();

    if (note.length < 5) {
      notify({
        title: "Write what you found",
        description: "The note is the record of the decision.",
        variant: "error",
      });
      return;
    }

    setBusyId(report.id);
    const result = await reviewReport(report.id, status, note);
    setBusyId(null);

    if (!result.data) {
      notify({
        title: "Not saved",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    notify({
      title: status === "ACTIONED" ? "Marked as actioned" : "Dismissed",
      variant: "success",
    });
    setReloadKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
        Trust and safety
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold text-primary">
        Reports
      </h1>
      <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
        Listings and people reported by users. Three open reports against the
        same target also raise a risk flag. Unpublish a listing from the
        listings admin; this page records what was decided and why.
      </p>

      <div
        className="mt-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Report status"
      >
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => {
              if (filter !== item.id) {
                setFilter(item.id);
                setPage(0);
                setReloadKey((current) => current + 1);
              }
            }}
            className={`min-h-10 rounded-full px-4 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              filter === item.id
                ? "bg-primary text-white"
                : "bg-bg text-primary shadow-sm hover:bg-primary/5"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-10 flex justify-center" role="status">
          <Loader2 size={22} className="animate-spin text-muted" />
          <span className="sr-only">Loading reports</span>
        </div>
      ) : error ? (
        <div className="mt-8" role="alert">
          <p className="font-body text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-3 min-h-10 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Try again
          </button>
        </div>
      ) : reports.length === 0 ? (
        <p className="mt-8 rounded-lg bg-surface-soft p-8 text-center font-body text-sm text-muted">
          No reports here.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {reports.map((report) => (
            <li key={report.id} className="rounded-lg bg-bg p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-base font-bold text-primary">
                    {REASON_LABELS[report.reason]}
                  </p>
                  <p className="mt-1 font-body text-sm text-muted">
                    {report.targetType === "LISTING" ? (
                      <>
                        Listing:{" "}
                        {report.listingPublicId ? (
                          <Link
                            href={`/property/${report.listingPublicId}`}
                            className="font-bold text-primary underline-offset-4 hover:underline"
                          >
                            {report.listingTitle}
                          </Link>
                        ) : (
                          report.listingTitle
                        )}
                      </>
                    ) : (
                      <>Person: {report.reportedUserName}</>
                    )}
                    {" · "}reported by {report.reporterName} on{" "}
                    {new Date(report.createdAt).toLocaleDateString("en-NG", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
                <StatusBadge
                  tone={report.status === "OPEN" ? "accent" : "neutral"}
                >
                  {report.status.toLowerCase()}
                </StatusBadge>
              </div>
              {report.detail ? (
                <p className="mt-3 rounded-lg bg-surface-soft p-3 font-body text-sm leading-6 text-primary">
                  {report.detail}
                </p>
              ) : null}
              {report.status === "OPEN" ? (
                <div className="mt-4 grid gap-3">
                  <label
                    htmlFor={`report-note-${report.id}`}
                    className="sr-only"
                  >
                    Decision note
                  </label>
                  <textarea
                    id={`report-note-${report.id}`}
                    rows={2}
                    maxLength={500}
                    value={notes[report.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [report.id]: event.target.value,
                      }))
                    }
                    placeholder="What you checked and what you did"
                    className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-primary outline-none focus:border-accent"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void decide(report, "ACTIONED")}
                      disabled={busyId === report.id}
                      className="min-h-10 rounded-full bg-primary px-4 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                    >
                      Actioned
                    </button>
                    <button
                      type="button"
                      onClick={() => void decide(report, "DISMISSED")}
                      disabled={busyId === report.id}
                      className="min-h-10 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : report.reviewNote ? (
                <p className="mt-3 font-body text-sm text-muted">
                  <span className="font-bold text-primary">Decision: </span>
                  {report.reviewNote}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {!isLoading && !error && total > pageSize ? (
        <nav
          aria-label="Reports pagination"
          className="mt-6 flex items-center justify-between gap-4 font-body text-sm text-primary"
        >
          <button
            type="button"
            disabled={page === 0}
            onClick={() => {
              setPage((current) => current - 1);
              setReloadKey((current) => current + 1);
            }}
            className="min-h-10 rounded-full border border-border px-4 font-bold disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent"
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {Math.ceil(total / pageSize)} · {total} reports
          </span>
          <button
            type="button"
            disabled={(page + 1) * pageSize >= total}
            onClick={() => {
              setPage((current) => current + 1);
              setReloadKey((current) => current + 1);
            }}
            className="min-h-10 rounded-full border border-border px-4 font-bold disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent"
          >
            Next
          </button>
        </nav>
      ) : null}
    </main>
  );
}
