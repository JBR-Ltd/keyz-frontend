"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

/** Everything Rello emails a person also lands here. */
export interface AppNotification {
  body: string | null;
  createdAt: string;
  id: number;
  /** An in-app path such as /tenant/bookings, or null when there is nowhere to go. */
  link: string | null;
  read: boolean;
  title: string;
  type: string;
}

export interface NotificationPage {
  items: AppNotification[];
  /** Pass back to load older ones. Null on the last page. */
  nextCursor: string | null;
}

export interface NotificationResult<TValue> {
  data: TValue;
  message?: string;
}

// === Guards

function isNotification(value: unknown): value is AppNotification {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "title" in value &&
    typeof value.title === "string" &&
    "read" in value &&
    typeof value.read === "boolean"
  );
}

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

// === Requests

export async function getNotifications(
  cursor = "",
): Promise<NotificationResult<NotificationPage>> {
  const token = getAccessToken();
  const empty = { items: [], nextCursor: null };

  if (!token) {
    return { data: empty, message: "Log in to see your notifications." };
  }

  try {
    const response = await fetch(
      `/api/notifications?size=20&cursor=${encodeURIComponent(cursor)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: empty,
        message: resolveApiError(payload, "Notifications could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return {
      data: {
        items: Array.isArray(data) ? data.filter(isNotification) : [],
        nextCursor: response.headers.get("X-Next-Cursor"),
      },
    };
  } catch {
    return { data: empty, message: "Notifications could not be loaded." };
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const token = getAccessToken();

  if (!token) {
    return 0;
  }

  try {
    const response = await fetch("/api/notifications/unread-count", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return 0;
    }

    const data = unwrap(await response.json().catch(() => null));

    return data !== null &&
      typeof data === "object" &&
      "count" in data &&
      typeof data.count === "number"
      ? data.count
      : 0;
  } catch {
    return 0;
  }
}

async function post(path: string): Promise<boolean> {
  const token = getAccessToken();

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function markNotificationRead(id: number): Promise<boolean> {
  return post(`/api/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<boolean> {
  return post("/api/notifications/read-all");
}
