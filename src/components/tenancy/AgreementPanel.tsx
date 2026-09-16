"use client";

import { FileSignature, Loader2, Printer } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { useToast } from "@/components/ui/toast";
import {
  declineAgreement,
  getAgreement,
  saveAgreementDraft,
  sendAgreement,
  signAgreement,
  type Agreement,
  type AgreementStatus,
} from "@/lib/tenancyRecords";

interface AgreementPanelProps {
  bookingId: number;
  viewer: "tenant" | "host";
}

const STATUS_COPY: Record<AgreementStatus, string> = {
  DRAFT: "Draft, not sent",
  SENT: "Waiting for the tenant",
  SIGNED: "Signed by both",
  DECLINED: "Declined by the tenant",
  VOID: "Replaced by a newer version",
};

function formatStamp(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Opens the agreement text in a plain window the browser can print or save as PDF. */
function printAgreement(agreement: Agreement): void {
  const printable = window.open("", "_blank", "width=820,height=1000");

  if (!printable) {
    return;
  }

  const escape = (text: string): string =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const signatures = [
    agreement.landlordSignature
      ? `Landlord: ${agreement.landlordSignature.name}, ${formatStamp(agreement.landlordSignature.signedAt)}`
      : "Landlord: not signed",
    agreement.tenantSignature
      ? `Tenant: ${agreement.tenantSignature.name}, ${formatStamp(agreement.tenantSignature.signedAt)}`
      : "Tenant: not signed",
  ];

  printable.document.write(
    `<title>Tenancy agreement v${agreement.version}</title>` +
      `<pre style="font:13px/1.55 Georgia,serif;white-space:pre-wrap;max-width:720px;margin:32px auto">${escape(agreement.body)}\n\nSIGNATURES\n\n${escape(signatures.join("\n"))}\n\nFingerprint: ${escape(agreement.contentHash ?? "")}</pre>`,
  );
  printable.document.close();
  printable.focus();
  printable.print();
}

export default function AgreementPanel({
  bookingId,
  viewer,
}: AgreementPanelProps): ReactElement {
  const { notify } = useToast();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [clauses, setClauses] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);
  const [busy, setBusy] = useState<"" | "draft" | "send" | "sign" | "decline">("");

  useEffect(() => {
    let active = true;

    void getAgreement(bookingId).then((result) => {
      if (!active) {
        return;
      }

      setAgreement(result.data);
      setClauses(result.data?.hostClauses ?? "");
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [bookingId]);

  const apply = (next: Agreement | null, message: string | undefined, success: string): void => {
    if (!next) {
      notify({ title: "That did not work", description: message ?? "Try again in a moment.", variant: "error" });
      return;
    }

    setAgreement(next);
    setClauses(next.hostClauses ?? "");
    setFullName("");
    setAgreed(false);
    setIsDeclining(false);
    setDeclineReason("");
    notify({ title: success, variant: "success" });
  };

  const saveDraft = async (): Promise<void> => {
    setBusy("draft");
    const result = await saveAgreementDraft(bookingId, clauses);
    setBusy("");
    apply(result.data, result.message, "Draft saved");
  };

  const signAndSend = async (): Promise<void> => {
    setBusy("send");
    // Clauses typed since the last save go into the version being signed
    if (agreement?.status === "DRAFT" && clauses !== (agreement.hostClauses ?? "")) {
      const saved = await saveAgreementDraft(bookingId, clauses);

      if (!saved.data) {
        setBusy("");
        apply(null, saved.message, "");
        return;
      }
    }

    const result = await sendAgreement(bookingId, fullName.trim());
    setBusy("");
    apply(result.data, result.message, "Signed and sent to your tenant");
  };

  const sign = async (): Promise<void> => {
    if (!agreement) {
      return;
    }

    setBusy("sign");
    const result = await signAgreement(bookingId, fullName.trim(), agreement.version);
    setBusy("");
    apply(result.data, result.message, "Agreement signed");
  };

  const decline = async (): Promise<void> => {
    setBusy("decline");
    const result = await declineAgreement(bookingId, declineReason.trim());
    setBusy("");
    apply(result.data, result.message, "Your host has been told what to change");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status">
        <Loader2 size={20} className="animate-spin text-muted" />
        <span className="sr-only">Loading the agreement</span>
      </div>
    );
  }

  if (loadError) {
    return <p className="py-6 font-body text-sm text-red-700">{loadError}</p>;
  }

  const hostCanEdit = viewer === "host" && (agreement === null || agreement.canEdit);
  const isDraft = agreement === null || agreement.status === "DRAFT";
  const signatureReady = fullName.trim().split(/\s+/).length >= 2 && agreed;
  const signatureFields = (
    <div className="grid gap-3 rounded-xl bg-surface-soft p-4">
      <label htmlFor={`agreement-name-${bookingId}`} className="font-body text-sm font-bold text-primary">
        Type your full name to sign
      </label>
      <input
        id={`agreement-name-${bookingId}`}
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        autoComplete="name"
        placeholder="First and last name"
        className="min-h-11 rounded-lg border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
      />
      <label className="flex items-start gap-2 font-body text-sm leading-6 text-muted">
        <input
          id={`agreement-agree-${bookingId}`}
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
        />
        I have read every clause and agree to be bound by this agreement. My typed
        name, the time, and my device are recorded as my signature.
      </label>
    </div>
  );

  return (
    <div className="grid gap-5">
      {agreement ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-sm font-bold text-primary">
              Version {agreement.version} · {STATUS_COPY[agreement.status]}
            </p>
            {agreement.intact === false ? (
              <p className="mt-1 font-body text-xs font-bold text-red-700">
                This text no longer matches what was signed. Contact Rello support.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => printAgreement(agreement)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 px-4 font-body text-xs font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Printer size={14} aria-hidden="true" />
            Print or save as PDF
          </button>
        </div>
      ) : (
        <p className="rounded-xl bg-surface-soft p-4 font-body text-sm leading-6 text-muted">
          {viewer === "host"
            ? "Prepare the tenancy agreement from this booking. Rello fills in the parties, the home, the rent, the deposit and the dates; add any terms of your own below."
            : "Your host has not sent a tenancy agreement yet. You will be told as soon as there is one to sign."}
        </p>
      )}

      {agreement ? (
        <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-bg p-4 font-body text-[13px] leading-6 text-primary">
          {agreement.body}
        </pre>
      ) : null}

      {agreement && (agreement.landlordSignature || agreement.tenantSignature) ? (
        <dl className="grid gap-2 font-body text-sm sm:grid-cols-2">
          {[
            ["Landlord", agreement.landlordSignature],
            ["Tenant", agreement.tenantSignature],
          ].map(([label, signature]) => (
            <div key={String(label)} className="rounded-lg bg-surface-soft p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{String(label)}</dt>
              <dd className="mt-1 text-primary">
                {signature && typeof signature === "object"
                  ? `${signature.name}, ${formatStamp(signature.signedAt)}`
                  : "Not signed yet"}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {agreement?.declinedReason ? (
        <p className="rounded-xl border-l-2 border-accent bg-accent/10 p-4 font-body text-sm leading-6 text-primary">
          <span className="font-bold">Why it was declined: </span>
          {agreement.declinedReason}
        </p>
      ) : null}

      {hostCanEdit ? (
        <div className="grid gap-4">
          <label htmlFor={`agreement-clauses-${bookingId}`} className="font-body text-sm font-bold text-primary">
            Your additional terms
            <span className="block font-normal text-muted">
              House rules, service charge, pets. They cannot override the deposit or payment clauses.
            </span>
          </label>
          <textarea
            id={`agreement-clauses-${bookingId}`}
            rows={5}
            maxLength={5000}
            value={clauses}
            onChange={(event) => setClauses(event.target.value)}
            className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={busy !== ""}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              {busy === "draft" ? <Loader2 size={15} className="animate-spin" /> : null}
              {agreement && !isDraft ? "Start a new version" : "Save draft"}
            </button>
          </div>

          {agreement?.status === "DRAFT" ? (
            <>
              {signatureFields}
              <button
                type="button"
                onClick={() => void signAndSend()}
                disabled={busy !== "" || !signatureReady}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
              >
                {busy === "send" ? <Loader2 size={15} className="animate-spin" /> : <FileSignature size={16} aria-hidden="true" />}
                Sign and send to the tenant
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {viewer === "tenant" && agreement?.canSign ? (
        <div className="grid gap-4">
          {signatureFields}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void sign()}
              disabled={busy !== "" || !signatureReady}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              {busy === "sign" ? <Loader2 size={15} className="animate-spin" /> : <FileSignature size={16} aria-hidden="true" />}
              Sign the agreement
            </button>
            <button
              type="button"
              onClick={() => setIsDeclining((current) => !current)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Something needs changing
            </button>
          </div>
          {isDeclining ? (
            <div className="grid gap-3">
              <label htmlFor={`agreement-decline-${bookingId}`} className="font-body text-sm font-bold text-primary">
                Tell your host what to change
              </label>
              <textarea
                id={`agreement-decline-${bookingId}`}
                rows={3}
                maxLength={1000}
                value={declineReason}
                onChange={(event) => setDeclineReason(event.target.value)}
                className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="button"
                onClick={() => void decline()}
                disabled={busy !== "" || !declineReason.trim()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-700 px-5 font-body text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
              >
                {busy === "decline" ? <Loader2 size={15} className="animate-spin" /> : null}
                Decline this version
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
