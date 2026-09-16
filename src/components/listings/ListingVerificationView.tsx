"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { propertyPath } from "@/lib/publicIds";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuthenticatedUser } from "@/lib/account";
import {
  getBackendPropertyById,
  type BackendProperty,
} from "@/lib/hostListings";
import {
  submitUtilityBill,
  UTILITY_BILL_MAX_BYTES,
  UTILITY_BILL_TYPES,
  type ProofSubmissionResult,
} from "@/lib/propertyVerification";

interface ListingVerificationViewProps {
  propertyId: string;
  role: "agent" | "landlord";
}

function describeSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Verifies a listing from a utility bill.
 *
 * The location check needs the host standing at the property with a working GPS
 * fix, and some homes will not give one: a basement flat, a dense block, a phone
 * that refuses. The endpoint for this has existed all along with no screen, which
 * left those hosts no way to go live.
 */
export default function ListingVerificationView({
  propertyId,
  role,
}: ListingVerificationViewProps): ReactElement {
  const { notify } = useToast();
  const { user } = useAuthenticatedUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [bill, setBill] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ProofSubmissionResult | null>(null);

  useEffect(() => {
    let active = true;

    void getBackendPropertyById(propertyId).then((response) => {
      if (!active) {
        return;
      }

      setProperty(response.data);
      setLoadError(response.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [propertyId]);

  const chooseFile = (file: File | null): void => {
    setResult(null);

    if (!file) {
      setBill(null);
      setFileError("");
      return;
    }

    if (!UTILITY_BILL_TYPES.includes(file.type)) {
      setBill(null);
      setFileError("Use a JPEG, PNG or PDF of the bill.");
      return;
    }

    if (file.size > UTILITY_BILL_MAX_BYTES) {
      setBill(null);
      setFileError(
        `Keep the file under ${describeSize(UTILITY_BILL_MAX_BYTES)}. A clear phone photo of the page is plenty.`,
      );
      return;
    }

    setFileError("");
    setBill(file);
  };

  const submit = async (): Promise<void> => {
    if (!bill) {
      return;
    }

    setIsSubmitting(true);
    const outcome = await submitUtilityBill(Number(propertyId), bill);
    setIsSubmitting(false);
    setResult(outcome);

    if (outcome.success) {
      setProperty((current) =>
        current ? { ...current, verified: true } : current,
      );
      notify({
        title: "Listing verified",
        description: outcome.message,
        variant: "success",
      });
    }
  };

  const hostName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const manageHref = `/${role}/listings/${propertyId}`;
  const alreadyVerified = property?.verified === true && !result?.success;

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <Link
        href={manageHref}
        className="inline-flex items-center gap-2 font-body text-sm font-medium text-muted transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the listing
      </Link>

      <header className="max-w-2xl pb-10 pt-6">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Verification
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Verify with a utility bill
        </h1>
        <p className="mt-4 font-body text-base leading-7 text-muted">
          For when the location check will not work at the property. Upload a
          bill for the home, and the listing goes live as soon as it matches.
        </p>
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <div
          className="h-64 max-w-2xl animate-pulse rounded-lg bg-primary/5 motion-reduce:animate-none"
          aria-busy="true"
          aria-label="Loading the listing"
        />
      ) : !property ? null : alreadyVerified ? (
        <section className="max-w-2xl rounded-lg bg-surface-soft p-8 shadow-sm">
          <ShieldCheck size={26} className="text-accent-alt" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-bold text-primary">
            This listing is already verified
          </h2>
          <p className="mt-2 font-body text-sm leading-6 text-muted">
            {property.title} is live. There is nothing more to upload.
          </p>
          <Link
            href={propertyPath(property)}
            className="mt-5 inline-flex font-body text-sm font-bold text-accent-alt transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View the public page
          </Link>
        </section>
      ) : result?.success ? (
        <section
          className="max-w-2xl rounded-lg bg-surface-soft p-8 shadow-sm"
          aria-live="polite"
        >
          <CheckCircle2 size={28} className="text-accent-alt" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-bold text-primary">
            Verified and live
          </h2>
          <p className="mt-2 font-body text-sm leading-6 text-muted">
            The bill matched, so {property.title} now shows to tenants.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={propertyPath(property)}
              className="inline-flex min-h-11 items-center rounded bg-primary px-5 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              See it live
            </Link>
            <Link
              href={manageHref}
              className="inline-flex min-h-11 items-center rounded px-5 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Manage the listing
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-lg bg-surface-soft p-6 shadow-sm sm:p-7">
            <h2 className="font-body text-lg font-bold text-primary">
              The bill has to show
            </h2>
            <dl className="mt-5 grid gap-4">
              <div>
                <dt className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Your name, as verified
                </dt>
                <dd className="mt-1 font-body text-base font-bold text-primary">
                  {hostName || "The name on your verified account"}
                </dd>
              </div>
              <div>
                <dt className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  This address
                </dt>
                <dd className="mt-1 font-body text-base font-bold text-primary">
                  {property.address}
                </dd>
              </div>
            </dl>
            <p className="mt-5 font-body text-sm leading-6 text-muted">
              An electricity, water, waste or internet bill all work. Both must
              be readable on the page: a bill in someone else&apos;s name, or for a
              different address, will not verify this listing.
            </p>
          </section>

          <section className="rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-7">
            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ease-in-out focus-within:ring-2 focus-within:ring-accent ${
                bill
                  ? "border-accent bg-accent/5"
                  : "border-primary/15 hover:border-accent hover:bg-surface-soft"
              }`}
            >
              {bill ? (
                <FileText size={28} className="text-accent-alt" aria-hidden="true" />
              ) : (
                <UploadCloud size={28} className="text-accent-alt" aria-hidden="true" />
              )}
              <span className="font-body text-sm font-bold text-primary">
                {bill ? bill.name : "Choose the bill"}
              </span>
              <span className="font-body text-xs text-muted">
                {bill
                  ? `${describeSize(bill.size)} · choose a different file`
                  : `JPEG, PNG or PDF, under ${describeSize(UTILITY_BILL_MAX_BYTES)}`}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept={UTILITY_BILL_TYPES.join(",")}
                disabled={isSubmitting}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>

            {fileError ? (
              <p className="mt-3 font-body text-sm text-red-700" role="alert">
                {fileError}
              </p>
            ) : null}

            {result && !result.success ? (
              <div
                className="mt-4 flex gap-3 rounded-lg bg-red-700/5 p-4"
                role="alert"
              >
                <CircleAlert size={18} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
                <div>
                  <p className="font-body text-sm font-bold text-red-700">
                    {result.message}
                  </p>
                  <p className="mt-1 font-body text-sm leading-6 text-muted">
                    Check the name matches your verified name and the address
                    matches the listing, then try a clearer copy. Or go back and
                    verify with a photo taken at the property.
                  </p>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={!bill || isSubmitting}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded bg-primary px-5 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck size={15} aria-hidden="true" />
              )}
              {isSubmitting ? "Reading the bill" : "Verify listing"}
            </button>
            {isSubmitting ? (
              <p className="mt-3 text-center font-body text-xs text-muted" aria-live="polite">
                This can take up to a minute.
              </p>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}
