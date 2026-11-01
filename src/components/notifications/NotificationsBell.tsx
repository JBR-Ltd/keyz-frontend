"use client";

import { getBrowserSessionMarker } from "@/lib/authSession";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
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
  const minutes = Math.max(
    1,
    Math.round((now - new Date(value).getTime()) / 60000),
  );

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

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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
  const [readingId, setReadingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(0);

  const refreshUnread = useCallback(async (): Promise<void> => {
    if (readingRef.current) return;
    const version = ++countVersionRef.current;
    const token = getBrowserSessionMarker();
    const count = await getUnreadNotificationCount();

    if (
      mountedRef.current &&
      version === countVersionRef.current &&
      token === getBrowserSessionMarker() &&
      count !== null
    ) {
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
    const token = getBrowserSessionMarker();

    void getNotifications("", controller.signal).then((result) => {
      if (
        controller.signal.aborted ||
        session !== sessionRef.current ||
        token !== getBrowserSessionMarker()
      ) {
        return;
      }

      setNow(Date.now());
      if (!result.message) {
        setItems(
          Array.from(
            new Map(result.data.items.map((item) => [item.id, item])).values(),
          ),
        );
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
    if (
      !nextCursor ||
      isLoading ||
      readingRef.current ||
      olderRequestRef.current
    ) {
      return;
    }

    const session = sessionRef.current;
    const token = getBrowserSessionMarker();
    const controller = new AbortController();
    olderRequestRef.current = controller;
    setIsLoadingMore(true);
    setOlderError("");
    const result = await getNotifications(nextCursor, controller.signal);

    if (
      controller.signal.aborted ||
      !mountedRef.current ||
      session !== sessionRef.current ||
      token !== getBrowserSessionMarker()
    )
      return;
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
    const token = getBrowserSessionMarker();
    if (!notification.read) {
      readingRef.current = true;
      countVersionRef.current++;
      setIsReading(true);
      setReadingId(notification.id);
      const saved = await markNotificationRead(notification.id);
      if (!mountedRef.current) return;
      readingRef.current = false;
      setIsReading(false);
      setReadingId(null);
      if (token !== getBrowserSessionMarker()) return;
      if (saved) {
        setUnread((count) => Math.max(0, count - 1));
        if (session === sessionRef.current) {
          setItems((current) =>
            current.map((item) =>
              item.id === notification.id ? { ...item, read: true } : item,
            ),
          );
        }
      } else {
        notify({
          title: "Could not mark notification read",
          description: "It remains unread. Please try again.",
          variant: "error",
        });
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
    const token = getBrowserSessionMarker();
    readingRef.current = true;
    countVersionRef.current++;
    setIsReading(true);
    const saved = await markAllNotificationsRead();
    if (!mountedRef.current) return;
    readingRef.current = false;
    setIsReading(false);
    if (token !== getBrowserSessionMarker()) return;
    if (saved) {
      setUnread(0);
      if (session === sessionRef.current) {
        setItems((current) => current.map((item) => ({ ...item, read: true })));
      }
    } else {
      notify({
        title: "Could not mark notifications read",
        description: "They remain unread. Please try again.",
        variant: "error",
      });
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
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
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
          className="absolute right-0 top-12 z-[110] isolate w-[26rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border/70 bg-bg shadow-2xl"
          role="region"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <h2 className="font-body text-base font-bold text-primary">
                Notifications
              </h2>
              {unread > 0 ? (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 font-body text-[11px] font-bold text-primary">
                  {unread} new
                </span>
              ) : null}
            </div>
            {!isLoading && !error && items.some((item) => !item.read) ? (
              <button
                type="button"
                onClick={() => void readAll()}
                disabled={isReading || isLoadingMore}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-body text-xs font-bold text-accent-alt transition-colors hover:bg-accent/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                aria-busy={isReading}
              >
                <AsyncButtonContent
                  isPending={isReading}
                  pendingLabel="Marking all read…"
                >
                  <CheckCheck size={14} aria-hidden="true" />
                  Mark all read
                </AsyncButtonContent>
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
                      aria-busy={readingId === item.id}
                      className={`grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-5 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60 ${
                        item.read
                          ? "bg-bg hover:bg-surface-soft/70"
                          : "bg-accent/[0.07] hover:bg-accent/[0.12]"
                      }`}
                    >
                      {readingId === item.id ? (
                        <Loader2
                          size={12}
                          className="mt-1 animate-spin text-accent-alt"
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.read ? "bg-border" : "bg-accent"}`}
                          aria-hidden="true"
                        />
                      )}
                      {readingId === item.id ? (
                        <span className="sr-only">Opening notification…</span>
                      ) : null}
                      <span className="min-w-0 pr-1">
                        <span
                          className={`line-clamp-2 block font-body text-sm leading-5 text-primary ${item.read ? "font-semibold" : "font-bold"}`}
                        >
                          {item.title}
                        </span>
                        {item.body ? (
                          <span className="mt-1.5 line-clamp-3 block font-body text-xs leading-5 text-muted">
                            {item.body}
                          </span>
                        ) : null}
                      </span>
                      <span className="whitespace-nowrap pt-0.5 font-body text-[11px] font-semibold text-muted">
                        {now ? formatWhen(item.createdAt, now) : ""}
                        {item.read ? null : (
                          <span className="sr-only"> unread</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {olderError ? (
                <p
                  role="alert"
                  className="px-4 py-3 font-body text-xs text-red-700"
                >
                  {olderError}
                </p>
              ) : null}
              {nextCursor ? (
                <button
                  type="button"
                  onClick={() => void loadOlder()}
                  disabled={isLoadingMore || isReading}
                  aria-busy={isLoadingMore}
                  className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 font-body text-xs font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:opacity-60"
                >
                  <AsyncButtonContent
                    isPending={isLoadingMore}
                    pendingLabel="Loading older notifications…"
                  >
                    {olderError
                      ? "Retry loading older notifications"
                      : "Load older notifications"}
                  </AsyncButtonContent>
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
