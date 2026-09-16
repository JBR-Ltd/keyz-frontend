"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactElement } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;

    const refresh = async (): Promise<void> => {
      const count = await getUnreadNotificationCount();

      if (active) {
        setUnread(count);
      }
    };

    void refresh();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, UNREAD_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;

    void getNotifications().then((result) => {
      if (!active) {
        return;
      }

      setNow(Date.now());
      setItems(result.data.items);
      setNextCursor(result.data.nextCursor);
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
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      active = false;
      window.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const toggle = (): void => {
    if (!isOpen) {
      setIsLoading(true);
    }

    setIsOpen((current) => !current);
  };

  const loadOlder = async (): Promise<void> => {
    if (!nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    const result = await getNotifications(nextCursor);
    setIsLoadingMore(false);
    setItems((current) => [...current, ...result.data.items]);
    setNextCursor(result.data.nextCursor);
  };

  const open = async (notification: AppNotification): Promise<void> => {
    if (!notification.read) {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
      setUnread((count) => Math.max(0, count - 1));
      void markNotificationRead(notification.id);
    }

    if (notification.link?.startsWith("/")) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  const readAll = async (): Promise<void> => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnread(0);
    await markAllNotificationsRead();
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
            {items.some((item) => !item.read) ? (
              <button
                type="button"
                onClick={() => void readAll()}
                className="inline-flex items-center gap-1.5 rounded font-body text-xs font-bold text-accent-alt hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <CheckCheck size={14} aria-hidden="true" />
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
            <p className="px-5 py-10 text-center font-body text-sm text-red-700">
              {error}
            </p>
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
                      className="grid w-full grid-cols-[0.5rem_minmax(0,1fr)_auto] gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
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
              {nextCursor ? (
                <button
                  type="button"
                  onClick={() => void loadOlder()}
                  disabled={isLoadingMore}
                  className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 font-body text-xs font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:opacity-60"
                >
                  {isLoadingMore ? <Loader2 size={13} className="animate-spin" /> : null}
                  Load older
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
