"use client";

import { apiRequest } from "@/lib/apiRequest";

import { getBrowserSessionMarker } from "@/lib/authSession";

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

function getSessionMarker(): string {
  return getBrowserSessionMarker();
}

// === Requests

export async function getNotifications(
  cursor = "",
  signal?: AbortSignal,
): Promise<NotificationResult<NotificationPage>> {
  const token = getSessionMarker();
  const empty = { items: [], nextCursor: null };

  if (!token) {
    return { data: empty, message: "Log in to see your notifications." };
  }

  try {
    const response = await apiRequest(
      `/api/notifications?size=20&cursor=${encodeURIComponent(cursor)}`,
      { headers: {}, signal },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: empty,
        message: resolveApiError(payload, "Notifications could not be loaded."),
      };
    }

    const data = unwrap(payload);

    if (!Array.isArray(data)) {
      return { data: empty, message: "Notifications could not be loaded." };
    }

    return {
      data: {
        items: data.filter(isNotification),
        nextCursor: response.headers.get("X-Next-Cursor"),
      },
    };
  } catch {
    return { data: empty, message: "Notifications could not be loaded." };
  }
}

export async function getUnreadNotificationCount(): Promise<number | null> {
  const token = getSessionMarker();

  if (!token) {
    return null;
  }

  try {
    const response = await apiRequest("/api/notifications/unread-count", {
      headers: {},
    });

    if (!response.ok) {
      return null;
    }

    const data = unwrap(await response.json().catch(() => null));

    return data !== null &&
      typeof data === "object" &&
      "count" in data &&
      typeof data.count === "number" &&
      Number.isSafeInteger(data.count) &&
      data.count >= 0
      ? data.count
      : null;
  } catch {
    return null;
  }
}

async function post(path: string): Promise<boolean> {
  const token = getSessionMarker();

  if (!token) {
    return false;
  }

  try {
    const response = await apiRequest(path, {
      method: "POST",
      headers: {},
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
