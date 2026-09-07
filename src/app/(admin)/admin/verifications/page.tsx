"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Check, FileText, Loader2, ShieldCheck, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { decideKyb, getKybQueue, type KybSubmission } from "@/lib/admin";

export default function AdminVerificationsPage(): ReactElement {
  const { notify } = useToast();
  const [queue, setQueue] = useState<KybSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  /** The submission whose rejection reason is being written. */
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let active = true;

    void getKybQueue().then((result) => {
      if (!active) {
        return;
      }

      setQueue(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const decide = async (
    submission: KybSubmission,
    approved: boolean,
  ): Promise<void> => {
    setBusyId(submission.id);
    const result = await decideKyb(submission.id, approved, reason.trim());
    setBusyId(null);

    if (!result.data) {
      notify({
        title: "Decision not saved",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setQueue((current) => current.filter((item) => item.id !== submission.id));
    setRejectingId(null);
    setReason("");
    notify({
      title: approved ? "KYB approved" : "KYB rejected",
      variant: "success",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Review queue
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Verifications
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Identity checks run automatically through Dojah. Business documents
          land here because a person has to read them.
        </p>
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <p className="py-16 text-center font-body text-sm text-muted">
          Loading the queue...
        </p>
      ) : queue.length === 0 ? (
        <div className="rounded-lg bg-surface-soft p-10 text-center shadow-sm">
          <ShieldCheck size={26} className="mx-auto text-accent-alt" />
          <h2 className="mt-4 font-display text-3xl font-bold text-primary">
            Queue is clear
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-base leading-7 text-muted">
            No business documents are waiting on a decision.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {queue.map((submission) => (
            <article
              key={submission.id}
              className="grid gap-5 rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge tone="accent">Pending</StatusBadge>
                  <h2 className="font-body text-lg font-bold text-primary">
                    {submission.user?.name ?? "Unknown user"}
                  </h2>
                </div>
                <p className="mt-2 font-body text-sm text-muted">
                  {submission.user?.role ?? "Host"} · submission #
                  {submission.id}
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  {[
                    { label: "Business registration", url: submission.documentUrl },
                    { label: "Proof of address", url: submission.addressDocumentUrl },
                  ].map((document) =>
                    document.url ? (
                      <a
                        key={document.label}
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-body text-sm font-medium text-accent-alt transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <FileText size={15} />
                        {document.label}
                      </a>
                    ) : (
                      <span
                        key={document.label}
                        className="font-body text-sm text-muted"
                      >
                        {document.label}: not attached
                      </span>
                    ),
                  )}
                </div>

                {rejectingId === submission.id ? (
                  <label className="mt-5 block font-body text-sm font-bold text-primary">
                    Why is this being rejected?
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={2}
                      placeholder="The CAC certificate is expired."
                      className="mt-2 w-full rounded-lg border border-primary/15 bg-surface-soft px-4 py-3 font-body text-sm font-normal text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                    />
                    <span className="mt-1 block font-body text-xs font-normal text-muted">
                      The host sees this, so say what they need to change.
                    </span>
                  </label>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void decide(submission, true)}
                  disabled={busyId === submission.id}
                  className="flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  {busyId === submission.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (rejectingId !== submission.id) {
                      setRejectingId(submission.id);
                      setReason("");
                      return;
                    }

                    void decide(submission, false);
                  }}
                  disabled={
                    busyId === submission.id ||
                    (rejectingId === submission.id && reason.trim().length === 0)
                  }
                  className="flex items-center gap-2 rounded px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <X size={15} />
                  {rejectingId === submission.id ? "Confirm rejection" : "Reject"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
