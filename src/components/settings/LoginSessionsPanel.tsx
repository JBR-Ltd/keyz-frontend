"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  endOtherSessions,
  endSession,
  getSessions,
  type LoginSession,
} from "@/lib/account";

function formatMoment(value: string): string {
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LoginSessionsPanel(): ReactElement {
  const { notify } = useToast();
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isEndingOthers, setIsEndingOthers] = useState(false);

  useEffect(() => {
    let active = true;

    void getSessions().then((result) => {
      if (active) {
        setSessions(result);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const end = async (session: LoginSession): Promise<void> => {
    setBusyId(session.id);
    const result = await endSession(session.id);
    setBusyId(null);

    if (!result.success) {
      notify({
        title: "Not signed out",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setSessions((current) => current.filter((item) => item.id !== session.id));
    notify({ title: "That device has been signed out", variant: "success" });
  };

  const endOthers = async (): Promise<void> => {
    setIsEndingOthers(true);
    const result = await endOtherSessions();
    setIsEndingOthers(false);

    if (!result.success) {
      notify({
        title: "Not signed out",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setSessions((current) => current.filter((session) => session.current));
    notify({ title: result.message, variant: "success" });
  };

  const others = sessions.filter((session) => !session.current);

  return (
    <div className="grid gap-5 border-b border-border py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="font-body text-xl font-bold text-primary">
            Where you are signed in
          </h2>
          <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
            Signing a device out stops the session it holds working straight
            away. Do it for anything you do not recognise, then change your
            password.
          </p>
        </div>
        {others.length > 0 ? (
          <button
            type="button"
            onClick={() => void endOthers()}
            disabled={isEndingOthers}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/30 px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
          >
            {isEndingOthers ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            Sign out the others
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-3" role="status" aria-label="Loading sessions">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={`loading-session-${index + 1}`}
              className="flex items-center justify-between gap-4 rounded-lg bg-surface-soft px-5 py-4"
              aria-hidden="true"
            >
              <div className="flex flex-1 items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-44 max-w-full" />
                  <Skeleton className="mt-2 h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          ))}
          <span className="sr-only">Loading sessions</span>
        </div>
      ) : sessions.length === 0 ? (
        <p className="font-body text-sm text-muted">
          Nothing to show. Sessions started before this feature existed are not
          listed, and they expire on their own within a day.
        </p>
      ) : (
        <ul className="grid gap-3">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-soft px-5 py-4"
            >
              <div className="flex min-w-0 gap-3">
                <MonitorSmartphone
                  size={18}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-accent-alt"
                />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-body text-sm font-bold text-primary">
                    <span className="truncate">{session.deviceName}</span>
                    {session.current ? (
                      <StatusBadge tone="accent" size="sm">
                        This device
                      </StatusBadge>
                    ) : null}
                  </p>
                  <p className="mt-1 font-body text-xs text-muted">
                    Signed in {formatMoment(session.createdAt)}
                    {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                  </p>
                </div>
              </div>

              {session.current ? null : (
                <button
                  type="button"
                  onClick={() => void end(session)}
                  disabled={busyId === session.id}
                  className="shrink-0 font-body text-xs font-bold text-accent-alt transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                >
                  {busyId === session.id ? "Signing out..." : "Sign out"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
