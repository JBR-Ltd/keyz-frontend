"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { useToast } from "@/components/ui/toast";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notifications";

/** The badge refreshes on this cadence; an open panel refreshes on open. */
const UNREAD_POLL_MS = 30000;

function formatWhen(value: string, now: number): string {
  const minutes = Math.max(1, Math.round((now - new Date(value).getTime()) / 60000));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

export default function NotificationsBell(): ReactElement {
  const router = useRouter();
  const { notify } = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const sessionRef = useRef(0);
  const countVersionRef = useRef(0);
  const readingRef = useRef(false);
  const olderRequestRef = useRef<AbortController | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [olderError, setOlderError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(0);

  const refreshUnread = useCallback(async (): Promise<void> => {
    if (readingRef.current) return;
    const version = ++countVersionRef.current;
    const token = localStorage.getItem("rello_token");
    const count = await getUnreadNotificationCount();

    if (mountedRef.current && version === countVersionRef.current
        && token === localStorage.getItem("rello_token") && count !== null) {
      setUnread(count);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refreshUnread();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshUnread();
      }
    }, UNREAD_POLL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, [refreshUnread]);

  const close = useCallback((): void => {
    sessionRef.current++;
    olderRequestRef.current?.abort();
    olderRequestRef.current = null;
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const session = ++sessionRef.current;
    const controller = new AbortController();
    const token = localStorage.getItem("rello_token");

    void getNotifications("", controller.signal).then((result) => {
      if (controller.signal.aborted || session !== sessionRef.current || token !== localStorage.getItem("rello_token")) {
        return;
      }

      setNow(Date.now());
      if (!result.message) {
        setItems(Array.from(new Map(result.data.items.map((item) => [item.id, item])).values()));
        setNextCursor(result.data.nextCursor);
      }
      setError(result.message ?? "");
      setIsLoading(false);
    });

    const closeOnOutside = (event: PointerEvent): void => {
      const target = event.target;

      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        close();
      }
    };

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      controller.abort();
      olderRequestRef.current?.abort();
      olderRequestRef.current = null;
      window.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, reloadKey, close]);

  const toggle = (): void => {
    if (isOpen) {
      close();
      return;
    }

    setIsLoading(true);
    setIsLoadingMore(false);
    setError("");
    setOlderError("");
    setIsOpen(true);
  };

  const loadOlder = async (): Promise<void> => {
    if (!nextCursor || isLoading || readingRef.current || olderRequestRef.current) {
      return;
    }

    const session = sessionRef.current;
    const token = localStorage.getItem("rello_token");
    const controller = new AbortController();
    olderRequestRef.current = controller;
    setIsLoadingMore(true);
    setOlderError("");
    const result = await getNotifications(nextCursor, controller.signal);

    if (controller.signal.aborted || !mountedRef.current
        || session !== sessionRef.current || token !== localStorage.getItem("rello_token")) return;
    olderRequestRef.current = null;
    setIsLoadingMore(false);
    if (result.message) {
      setOlderError(result.message);
      return;
    }
    setItems((current) => {
      const merged = new Map(current.map((item) => [item.id, item]));
      for (const item of result.data.items) {
        if (!merged.has(item.id)) merged.set(item.id, item);
      }
      return Array.from(merged.values());
    });
    setNextCursor(result.data.nextCursor);
  };

  const open = async (notification: AppNotification): Promise<void> => {
    if (readingRef.current || olderRequestRef.current) return;
    const session = sessionRef.current;
    const token = localStorage.getItem("rello_token");
    if (!notification.read) {
      readingRef.current = true;
      countVersionRef.current++;
      setIsReading(true);
      const saved = await markNotificationRead(notification.id);
      if (!mountedRef.current) return;
      readingRef.current = false;
      setIsReading(false);
      if (token !== localStorage.getItem("rello_token")) return;
      if (saved) {
        setUnread((count) => Math.max(0, count - 1));
        if (session === sessionRef.current) {
          setItems((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
        }
      } else {
        notify({ title: "Could not mark notification read", description: "It remains unread. Please try again.", variant: "error" });
      }
      void refreshUnread();
    }

    if (session === sessionRef.current && notification.link?.startsWith("/")) {
      close();
      router.push(notification.link);
    }
  };

  const readAll = async (): Promise<void> => {
    if (isLoading || readingRef.current || olderRequestRef.current) return;
    const session = sessionRef.current;
    const token = localStorage.getItem("rello_token");
    readingRef.current = true;
    countVersionRef.current++;
    setIsReading(true);
    const saved = await markAllNotificationsRead();
    if (!mountedRef.current) return;
    readingRef.current = false;
    setIsReading(false);
    if (token !== localStorage.getItem("rello_token")) return;
    if (saved) {
      setUnread(0);
      if (session === sessionRef.current) {
        setItems((current) => current.map((item) => ({ ...item, read: true })));
      }
    } else {
      notify({ title: "Could not mark notifications read", description: "They remain unread. Please try again.", variant: "error" });
    }
    void refreshUnread();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-body text-[11px] font-bold leading-none text-primary">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 z-[110] isolate w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-bg shadow-xl"
          role="region"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="font-body text-sm font-semibold text-primary">
              Notifications
            </h2>
            {!isLoading && !error && items.some((item) => !item.read) ? (
              <button
                type="button"
                onClick={() => void readAll()}
                disabled={isReading || isLoadingMore}
                className="inline-flex items-center gap-1.5 rounded font-body text-xs font-bold text-accent-alt hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
              >
                {isReading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <CheckCheck size={14} aria-hidden="true" />}
                Mark all read
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex justify-center px-5 py-10" role="status">
              <Loader2 size={18} className="animate-spin text-muted" />
              <span className="sr-only">Loading notifications</span>
            </div>
          ) : error ? (
            <div className="px-5 py-10 text-center" role="alert">
              <p className="font-body text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setReloadKey((current) => current + 1);
                }}
                className="mt-3 rounded px-3 py-2 font-body text-xs font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-5 py-10 text-center font-body text-sm text-muted">
              Nothing yet. Booking updates, payments and reminders show up here.
            </p>
          ) : (
            <div className="max-h-[26rem] overflow-y-auto">
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void open(item)}
                      disabled={isReading || isLoadingMore}
                      className="grid w-full grid-cols-[0.5rem_minmax(0,1fr)_auto] gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:opacity-60"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 rounded-full ${item.read ? "bg-transparent" : "bg-accent"}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span
                          className={`block font-body text-sm text-primary ${item.read ? "font-medium" : "font-bold"}`}
                        >
                          {item.title}
                        </span>
                        {item.body ? (
                          <span className="mt-1 line-clamp-2 block font-body text-xs leading-5 text-muted">
                            {item.body}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-body text-[11px] font-bold text-muted">
                        {now ? formatWhen(item.createdAt, now) : ""}
                        {item.read ? null : <span className="sr-only"> unread</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {olderError ? <p role="alert" className="px-4 py-3 font-body text-xs text-red-700">{olderError}</p> : null}
              {nextCursor ? (
                <button
                  type="button"
                  onClick={() => void loadOlder()}
                  disabled={isLoadingMore || isReading}
                  className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 font-body text-xs font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:opacity-60"
                >
                  {isLoadingMore ? <Loader2 size={13} className="animate-spin" /> : null}
                  {olderError ? "Retry loading older" : "Load older"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
