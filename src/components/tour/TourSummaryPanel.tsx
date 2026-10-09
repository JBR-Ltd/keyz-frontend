"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Compass,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTourSummary } from "@/lib/api/tours/publish";
import type { TourSummary } from "@/lib/types/tour";

interface TourSummaryPanelProps {
  propertyId: number;
  publicId?: string | null;
  role: "agent" | "landlord";
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: TourSummary };

export default function TourSummaryPanel({
  propertyId,
  publicId,
  role,
}: TourSummaryPanelProps): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async (): Promise<void> => {
    setState({ status: "loading" });

    try {
      const summary = await getTourSummary(propertyId);
      setState({ status: "ready", summary });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not load the tour summary.",
      });
    }
  }, [propertyId]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  return (
    <section aria-labelledby="virtual-tour-heading">
      <div>
        <h2
          id="virtual-tour-heading"
          className="font-display text-2xl font-bold text-primary"
        >
          Virtual tour
        </h2>
        <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
          Build a walkable tour with floors, rooms, and 360° panoramas.
        </p>
      </div>

      {state.status === "loading" ? (
        <div
          className="mt-6 flex min-h-48 items-center justify-center border-y border-border font-body text-sm text-muted"
          role="status"
        >
          <Loader2
            size={18}
            className="mr-2 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Loading tour status...
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-6 border-l-2 border-red-700 pl-4" role="alert">
          <p className="font-body text-sm text-red-700">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex min-h-11 items-center font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Retry tour status
          </button>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <ReadyState
          summary={state.summary}
          tourHref={`/${role}/listings/${propertyId}/tour`}
          roomsHref={`/${role}/listings/${propertyId}/rooms`}
          publicTourHref={`/tours/${publicId ?? propertyId}`}
        />
      ) : null}
    </section>
  );
}

interface ReadyStateProps {
  publicTourHref: string;
  roomsHref: string;
  summary: TourSummary;
  tourHref: string;
}

function ReadyState({
  publicTourHref,
  roomsHref,
  summary,
  tourHref,
}: ReadyStateProps): ReactElement {
  const isStarted = summary.roomCount > 0;
  const blockers: string[] = [];

  if (summary.notReadyCount > 0) {
    blockers.push(
      `${summary.notReadyCount} room${summary.notReadyCount === 1 ? "" : "s"} not ready`,
    );
  }
  if (summary.unplacedCount > 0) {
    blockers.push(
      `${summary.unplacedCount} room${summary.unplacedCount === 1 ? "" : "s"} not placed`,
    );
  }
  if (summary.unconfirmedFloorCount > 0) {
    blockers.push(
      `${summary.unconfirmedFloorCount} floor${summary.unconfirmedFloorCount === 1 ? "" : "s"} not confirmed`,
    );
  }
  if (summary.panoramaCount === 0) {
    blockers.push("No panoramas yet");
  }

  const primaryLabel = !isStarted
    ? "Start tour"
    : summary.isPublished
      ? "Manage tour"
      : "Continue tour";

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-5 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
        <StatusBadge
          tone={summary.isPublished ? "primary" : "neutral"}
          icon={
            summary.isPublished ? (
              <CheckCircle2 size={13} aria-hidden="true" />
            ) : undefined
          }
        >
          {summary.isPublished ? "Live" : "Draft"}
        </StatusBadge>

        <dl className="grid flex-1 grid-cols-3 gap-4 sm:max-w-xl">
          <Stat
            icon={<LayoutGrid size={17} aria-hidden="true" />}
            label="Floors"
            value={String(summary.floorCount)}
          />
          <Stat
            icon={<Compass size={17} aria-hidden="true" />}
            label="Rooms"
            value={String(summary.roomCount)}
          />
          <Stat
            icon={<Camera size={17} aria-hidden="true" />}
            label="Panoramas"
            value={String(summary.panoramaCount)}
          />
        </dl>
      </div>

      <p className="mt-5 max-w-2xl font-body text-sm leading-6 text-muted">
        {!isStarted
          ? "Create a floor, add its rooms, then capture a panorama for each room."
          : summary.isPublished
            ? "Your tour is live. Manage it here when rooms or panoramas change."
            : summary.isPublishable
              ? "Your tour is ready to review and publish."
              : "Continue the setup and resolve the remaining items below."}
      </p>

      {!summary.isPublished && blockers.length > 0 ? (
        <ul className="mt-3 space-y-1 font-body text-sm text-muted">
          {blockers.map((blocker) => (
            <li key={blocker} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {blocker}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={tourHref}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {primaryLabel}
        </Link>

        {isStarted && !summary.isPublished ? (
          <Link
            href={roomsHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Manage rooms
          </Link>
        ) : null}

        {summary.isPublished ? (
          <Link
            href={publicTourHref}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View live tour
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

interface StatProps {
  icon: ReactElement;
  label: string;
  value: string;
}

function Stat({ icon, label, value }: StatProps): ReactElement {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </dt>
        <dd className="font-display text-lg font-bold text-primary">{value}</dd>
      </div>
    </div>
  );
}
