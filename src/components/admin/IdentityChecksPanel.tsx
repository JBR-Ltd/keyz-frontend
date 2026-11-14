"use client";

import { CircleCheck, CircleX, ExternalLink, Fingerprint } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getIdentityChecks,
  identityCheckSelfieUrl,
  type IdentityCheck,
  type IdentityCheckType,
} from "@/lib/adminRisk";

const TYPE_LABELS: Record<IdentityCheckType, string> = {
  NIN: "NIN",
  BVN: "BVN",
  SELFIE: "Selfie liveness",
  FACE_MATCH: "Face against NIN photo",
};

const FAILURE_LABELS: Record<string, string> = {
  NIN_CHECK_FAILED: "NIN not found or lookup failed",
  BVN_CHECK_FAILED: "BVN not found or lookup failed",
  IDENTITY_NAME_MISMATCH: "Name on the record does not match the account",
  UNDERAGE: "Under 18",
  SELFIE_CHECK_FAILED: "Did not pass liveness",
  FACE_MATCH_FAILED: "Face does not match the NIN photo",
};

const moment = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function percent(value: number | null, scale: 1 | 100): string | null {
  return value === null ? null : `${Math.round(value * (100 / scale))}%`;
}

/** A user's identity checks for review: every attempt, newest first, with the number masked. */
export default function IdentityChecksPanel({
  userId,
}: {
  userId: number;
}): ReactElement {
  const [checks, setChecks] = useState<IdentityCheck[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void getIdentityChecks(userId).then((result) => {
      if (!active) return;
      setChecks(result.data);
      setError(result.message ?? "");
    });

    return () => {
      active = false;
    };
  }, [userId]);

  if (checks === null) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <p className="font-body text-sm text-red-700">{error}</p>;
  }

  if (checks.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/20 px-4 py-4">
        <Fingerprint
          size={20}
          strokeWidth={1.6}
          className="shrink-0 text-muted"
          aria-hidden="true"
        />
        <p className="font-body text-sm text-muted">
          No identity checks on record. Checks from before this log started only
          show as verified or not.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {checks.map((check) => {
        const details = [
          check.returnedName,
          check.returnedDateOfBirth
            ? `born ${check.returnedDateOfBirth}`
            : null,
          check.numberLast4 ? `ending ${check.numberLast4}` : null,
          check.livenessScore !== null
            ? `liveness ${percent(check.livenessScore, 1)}`
            : null,
          check.faceMatchConfidence !== null
            ? `match ${percent(check.faceMatchConfidence, 100)}`
            : null,
        ].filter(Boolean);

        return (
          <li
            key={check.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-bg px-4 py-3"
          >
            {check.passed ? (
              <CircleCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-600"
                aria-label="Passed"
              />
            ) : (
              <CircleX
                size={18}
                className="mt-0.5 shrink-0 text-red-700"
                aria-label="Failed"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-bold text-primary">
                {TYPE_LABELS[check.type]}
                {check.passed ? null : (
                  <span className="font-medium text-red-700">
                    {" "}
                    ·{" "}
                    {FAILURE_LABELS[check.failureReason ?? ""] ??
                      check.failureReason}
                  </span>
                )}
              </p>
              {details.length > 0 ? (
                <p className="mt-0.5 break-words font-body text-xs text-muted">
                  {details.join(" · ")}
                </p>
              ) : null}
              <p className="mt-0.5 font-body text-xs text-muted">
                {moment.format(new Date(check.checkedAt))}
                {check.retainUntil
                  ? ` · account closed, kept until ${moment.format(new Date(check.retainUntil))}`
                  : ""}
              </p>
            </div>
            {check.hasSelfie ? (
              <a
                href={identityCheckSelfieUrl(check.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary/20 px-3 font-body text-xs font-bold text-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Selfie
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
