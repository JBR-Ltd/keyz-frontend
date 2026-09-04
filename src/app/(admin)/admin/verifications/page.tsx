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
    const result = await decideKyb(submission.id, approved);
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
                {submission.documentUrl ? (
                  <a
                    href={submission.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 font-body text-sm font-medium text-accent-alt transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <FileText size={15} />
                    Open the document
                  </a>
                ) : (
                  <p className="mt-4 font-body text-sm text-muted">
                    No document attached.
                  </p>
                )}
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
                  onClick={() => void decide(submission, false)}
                  disabled={busyId === submission.id}
                  className="flex items-center gap-2 rounded px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  <X size={15} />
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
