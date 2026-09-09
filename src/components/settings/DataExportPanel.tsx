"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Download, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  getDataExports,
  requestDataExport,
  type DataExport,
  type DataExportStatus,
} from "@/lib/account";

const STATUS_LABELS: Record<DataExportStatus, string> = {
  QUEUED: "Waiting to start",
  PROCESSING: "Being prepared",
  READY: "Ready",
  FAILED: "Did not finish",
  EXPIRED: "Link expired",
};

const STATUS_TONES: Record<
  DataExportStatus,
  "accent" | "danger" | "neutral" | "primary"
> = {
  QUEUED: "accent",
  PROCESSING: "accent",
  READY: "primary",
  FAILED: "danger",
  EXPIRED: "neutral",
};

function formatMoment(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DataExportPanel(): ReactElement {
  const { notify } = useToast();
  const [exports, setExports] = useState<DataExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const load = (): void => {
    void getDataExports().then((result) => {
      setExports(result);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let active = true;

    void getDataExports().then((result) => {
      if (active) {
        setExports(result);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const request = async (): Promise<void> => {
    setIsRequesting(true);
    const result = await requestDataExport();
    setIsRequesting(false);

    if (!result.success) {
      notify({
        title: "Not requested",
        description: result.message,
        variant: "error",
      });
      return;
    }

    load();
    notify({
      title: "Being prepared",
      description:
        "It takes a minute or two. Come back to this page for the download.",
      variant: "success",
    });
  };

  const pending = exports.some(
    (item) => item.status === "QUEUED" || item.status === "PROCESSING",
  );

  return (
    <div className="grid gap-5 px-5 py-7 sm:px-7">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="font-body text-lg font-bold text-primary">
            Download your data
          </h2>
          <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
            A JSON file with your profile, tenancies, payments, reviews, disputes,
            viewings and repair reports. The link lasts 48 hours, because the file
            is your whole account in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pending ? (
            <button
              type="button"
              onClick={load}
              className="font-body text-xs font-bold text-accent-alt transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Refresh
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void request()}
            disabled={isRequesting || pending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/30 px-5 py-2.5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRequesting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}
            {pending ? "Being prepared" : "Request a copy"}
          </button>
        </div>
      </div>

      {isLoading ? null : exports.length === 0 ? null : (
        <ul className="grid gap-3">
          {exports.slice(0, 4).map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-soft px-5 py-4"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-body text-sm font-bold text-primary">
                  <StatusBadge tone={STATUS_TONES[item.status]} size="sm">
                    {STATUS_LABELS[item.status]}
                  </StatusBadge>
                  <span className="font-normal text-muted">
                    asked for {formatMoment(item.requestedAt)}
                  </span>
                </p>
                {item.status === "READY" && item.expiresAt ? (
                  <p className="mt-1 font-body text-xs text-muted">
                    Link works until {formatMoment(item.expiresAt)}
                  </p>
                ) : null}
                {item.failureReason ? (
                  <p className="mt-1 font-body text-xs text-red-700">
                    {item.failureReason}
                  </p>
                ) : null}
              </div>

              {item.status === "READY" && item.downloadUrl ? (
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-body text-xs font-bold text-accent-alt transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Download
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
