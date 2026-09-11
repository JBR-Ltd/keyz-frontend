"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  activityHeadline,
  activityHref,
  getMyActivity,
  type ActivityEvent,
} from "@/lib/activity";

interface ActivityFeedProps {
  /** How many to show. The rest sit behind the link in the header. */
  limit?: number;
  role: "agent" | "admin" | "landlord" | "tenant";
  title?: string;
}

function formatMoment(value: string | null): string {
  if (!value) {
    return "";
  }

  const when = new Date(value);
  const minutes = Math.round((Date.now() - when.getTime()) / 60000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (minutes < 60 * 24) {
    return `${Math.round(minutes / 60)}h ago`;
  }

  return when.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function amountOf(event: ActivityEvent): string | null {
  const amount = event.metadata?.amount;

  if (typeof amount !== "number") {
    return null;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ActivityFeed({
  limit = 6,
  role,
  title = "Recent activity",
}: ActivityFeedProps): ReactElement | null {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;

    void getMyActivity(undefined, Math.max(limit * 2, 20)).then((result) => {
      if (!active) {
        return;
      }

      setEvents(result.data.items.slice(0, limit));
      setTotal(result.data.items.length);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [limit]);

  // Nothing has happened yet, so an empty panel would be noise on the screen
  if (!isLoading && events.length === 0) {
    return null;
  }

  return (
    <section className="mt-8" aria-labelledby="activity-heading">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2
          id="activity-heading"
          className="font-body text-xs font-bold uppercase tracking-[0.18em] text-muted"
        >
          {title}
        </h2>
        {total > limit ? (
          <Link
            href={`/${role}/bookings`}
            className="font-body text-xs font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            See everything
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div
          className="grid gap-3 animate-pulse motion-reduce:animate-none lg:grid-cols-3"
          aria-busy="true"
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 rounded-lg bg-skeleton" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-3">
          {events.map((event) => {
            const amount = amountOf(event);

            return (
              <li key={event.id}>
                <Link
                  href={activityHref(event, role)}
                  className="group grid min-w-0 gap-2 rounded-lg bg-bg p-4 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-surface-soft hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex items-center justify-between gap-3">
                    <StatusBadge tone="primary" size="sm">
                      {activityHeadline(event.type)}
                    </StatusBadge>
                    <span className="shrink-0 font-body text-xs text-muted">
                      {formatMoment(event.occurredAt)}
                    </span>
                  </span>
                  <span className="block truncate font-body text-sm font-bold text-primary">
                    {event.propertyTitle ?? "Your account"}
                  </span>
                  {amount ? (
                    <span className="font-body text-xs text-muted">{amount}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
