"use client";

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Check, FileText, Loader2, MapPin, ShieldCheck, X } from "lucide-react";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  decideKyb,
  decidePropertyVerification,
  getKybQueue,
  getPropertyVerificationQueue,
  type KybSubmission,
  type PropertyVerificationSubmission,
} from "@/lib/admin";

// === Types

/** Both queues share the review controls, so a row is addressed by kind and id. */
type ReviewKind = "kyb" | "property";

interface DecisionState {
  busyKey: string | null;
  reason: string;
  rejectingKey: string | null;
}

function rowKey(kind: ReviewKind, id: number): string {
  return `${kind}-${id}`;
}

export default function AdminVerificationsPage(): ReactElement {
  const { notify } = useToast();
  const [kybQueue, setKybQueue] = useState<KybSubmission[]>([]);
  const [propertyQueue, setPropertyQueue] = useState<
    PropertyVerificationSubmission[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [decision, setDecision] = useState<DecisionState>({
    busyKey: null,
    reason: "",
    rejectingKey: null,
  });

  useEffect(() => {
    let active = true;

    void Promise.all([getKybQueue(), getPropertyVerificationQueue()]).then(
      ([kyb, property]) => {
        if (!active) {
          return;
        }

        setKybQueue(kyb.data);
        setPropertyQueue(property.data);
        setLoadError(kyb.message ?? property.message ?? "");
        setIsLoading(false);
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const decide = async (
    kind: ReviewKind,
    id: number,
    approved: boolean,
  ): Promise<void> => {
    const key = rowKey(kind, id);
    const reason = decision.reason.trim();

    setDecision((current) => ({ ...current, busyKey: key }));

    const result =
      kind === "kyb"
        ? await decideKyb(id, approved, reason)
        : await decidePropertyVerification(id, approved, reason);

    setDecision((current) => ({ ...current, busyKey: null }));

    if (!result.data) {
      notify({
        title: "Decision not saved",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    if (kind === "kyb") {
      setKybQueue((current) => current.filter((item) => item.id !== id));
    } else {
      setPropertyQueue((current) => current.filter((item) => item.id !== id));
    }

    setDecision({ busyKey: null, reason: "", rejectingKey: null });
    notify({
      title: approved ? "Approved" : "Rejected",
      variant: "success",
    });
  };

  // === Shared review controls

  const renderRejectionField = (
    key: string,
    placeholder: string,
  ): ReactElement | null => {
    if (decision.rejectingKey !== key) {
      return null;
    }

    return (
      <label className="mt-5 block font-body text-sm font-bold text-primary">
        Why is this being rejected?
        <textarea
          value={decision.reason}
          onChange={(event) =>
            setDecision((current) => ({
              ...current,
              reason: event.target.value,
            }))
          }
          rows={2}
          placeholder={placeholder}
          className="mt-2 w-full rounded-lg border border-primary/15 bg-surface-soft px-4 py-3 font-body text-sm font-normal text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
        />
        <span className="mt-1 block font-body text-xs font-normal text-muted">
          The host sees this, so say what they need to change.
        </span>
      </label>
    );
  };

  const renderActions = (kind: ReviewKind, id: number): ReactElement => {
    const key = rowKey(kind, id);
    const isBusy = decision.busyKey === key;
    const isRejecting = decision.rejectingKey === key;

    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void decide(kind, id, true)}
          disabled={isBusy}
          className="flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
        >
          {isBusy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Check size={15} />
          )}
          Approve
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isRejecting) {
              setDecision({ busyKey: null, reason: "", rejectingKey: key });
              return;
            }

            void decide(kind, id, false);
          }}
          disabled={
            isBusy || (isRejecting && decision.reason.trim().length === 0)
          }
          className="flex items-center gap-2 rounded px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
        >
          <X size={15} />
          {isRejecting ? "Confirm rejection" : "Reject"}
        </button>
      </div>
    );
  };

  const renderSection = (
    title: string,
    description: string,
    emptyMessage: string,
    rows: ReactNode,
    isEmpty: boolean,
  ): ReactElement => (
    <section className="mt-12 first:mt-0">
      <h2 className="font-display text-2xl font-bold text-primary">{title}</h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
        {description}
      </p>

      {isEmpty ? (
        <div className="mt-5 rounded-lg bg-surface-soft p-10 text-center shadow-sm">
          <ShieldCheck size={26} className="mx-auto text-accent-alt" />
          <p className="mx-auto mt-3 max-w-md font-body text-base leading-7 text-muted">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5">{rows}</div>
      )}
    </section>
  );

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
          and listings the automated checks could not settle land here because a
          person has to read them.
        </p>
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <CardListSkeleton count={4} label="Loading verification queue" />
      ) : (
        <>
          {renderSection(
            "Business documents",
            "Agents submit a registration document and a proof of address.",
            "No business documents are waiting on a decision.",
            kybQueue.map((submission) => (
              <article
                key={submission.id}
                className="grid gap-5 rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone="accent">Pending</StatusBadge>
                    <h3 className="font-body text-lg font-bold text-primary">
                      {submission.user?.name ?? "Unknown user"}
                    </h3>
                  </div>
                  <p className="mt-2 font-body text-sm text-muted">
                    {submission.user?.role ?? "Host"} · submission #
                    {submission.id}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    {[
                      {
                        label: "Business registration",
                        url: submission.documentUrl,
                      },
                      {
                        label: "Proof of address",
                        url: submission.addressDocumentUrl,
                      },
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

                  {renderRejectionField(
                    rowKey("kyb", submission.id),
                    "The CAC certificate is expired.",
                  )}
                </div>

                {renderActions("kyb", submission.id)}
              </article>
            )),
            kybQueue.length === 0,
          )}

          {renderSection(
            "Property verification",
            "Listings whose geotagged photo or utility bill could not be matched automatically. A bill in a spouse's or a company's name is the usual reason.",
            "No listings are waiting on a decision.",
            propertyQueue.map((submission) => (
              <article
                key={submission.id}
                className="grid gap-5 rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone="accent">Pending</StatusBadge>
                    <h3 className="font-body text-lg font-bold text-primary">
                      {submission.propertyTitle ?? "Untitled listing"}
                    </h3>
                  </div>
                  <p className="mt-2 font-body text-sm text-muted">
                    {submission.owner?.name ?? "Unknown owner"} ·{" "}
                    {submission.owner?.role ?? "Host"} · listing #
                    {submission.propertyId ?? "unknown"}
                  </p>
                  {submission.propertyAddress ? (
                    <p className="mt-1 font-body text-sm text-muted">
                      {submission.propertyAddress}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-4">
                    {submission.proofOfOwnershipUrl ? (
                      <a
                        href={submission.proofOfOwnershipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-body text-sm font-medium text-accent-alt transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <FileText size={15} />
                        Proof of ownership
                      </a>
                    ) : (
                      <span className="font-body text-sm text-muted">
                        Proof of ownership: not attached
                      </span>
                    )}
                    {submission.latitude !== null &&
                    submission.longitude !== null ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${submission.latitude},${submission.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-body text-sm font-medium text-accent-alt transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <MapPin size={15} />
                        Where the photo was taken
                      </a>
                    ) : (
                      <span className="font-body text-sm text-muted">
                        No location on the photo
                      </span>
                    )}
                  </div>

                  {renderRejectionField(
                    rowKey("property", submission.id),
                    "The bill is for a different address than the listing.",
                  )}
                </div>

                {renderActions("property", submission.id)}
              </article>
            )),
            propertyQueue.length === 0,
          )}
        </>
      )}
    </main>
  );
}
