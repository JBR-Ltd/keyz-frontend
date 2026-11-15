"use client";

import { apiRequest } from "@/lib/apiRequest";
import { resolveApiError } from "@/lib/errors";

// === Types

export type SupportStatus = "OPEN" | "ANSWERED" | "SOLVED";

export interface SupportTicket {
  reference: string;
  subject: string;
  status: SupportStatus;
  createdAt: string;
  lastMessageAt: string;
  /** Present only in the admin inbox. */
  requesterName: string | null;
  requesterEmail: string | null;
  requesterRole: string | null;
}

export interface SupportMessage {
  id: number;
  fromStaff: boolean;
  authorName: string;
  body: string;
  createdAt: string;
  attachmentName: string | null;
}

export interface SupportThread {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

export interface SupportResult<TValue> {
  data: TValue;
  message?: string;
  total?: number;
}

// === Guards

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isTicket(value: unknown): value is SupportTicket {
  return (
    isRecord(value) &&
    typeof value.reference === "string" &&
    typeof value.subject === "string" &&
    typeof value.status === "string"
  );
}

function isThread(value: unknown): value is SupportThread {
  return (
    isRecord(value) && isTicket(value.ticket) && Array.isArray(value.messages)
  );
}

// === Requests

async function call(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<{ data: unknown; message?: string; ok: boolean; total?: number }> {
  try {
    const response = await apiRequest(path, init);
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, fallback),
        ok: false,
      };
    }

    return {
      data: isRecord(payload) && "data" in payload ? payload.data : null,
      ok: true,
    };
  } catch {
    return { data: null, message: fallback, ok: false };
  }
}

/** Text plus an optional attachment, as the backend's multipart endpoints take it. */
function messageForm(
  fields: Record<string, string>,
  file: File | null,
): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => form.append(key, value));

  if (file) {
    form.append("file", file, file.name);
  }

  return form;
}

async function thread(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<SupportResult<SupportThread | null>> {
  const result = await call(path, init, fallback);

  return {
    data: result.ok && isThread(result.data) ? result.data : null,
    message: result.message,
  };
}

// === For the person

export async function getMySupportTickets(): Promise<
  SupportResult<SupportTicket[]>
> {
  const result = await call(
    "/api/support/tickets",
    {},
    "Your conversations could not be loaded.",
  );

  return {
    data: Array.isArray(result.data) ? result.data.filter(isTicket) : [],
    message: result.message,
  };
}

export function openSupportTicket(
  subject: string,
  message: string,
  file: File | null,
): Promise<SupportResult<SupportThread | null>> {
  return thread(
    "/api/support/tickets",
    { method: "POST", body: messageForm({ subject, message }, file) },
    "Your message could not be sent.",
  );
}

export function getSupportThread(
  reference: string,
): Promise<SupportResult<SupportThread | null>> {
  return thread(
    `/api/support/tickets/${encodeURIComponent(reference)}`,
    {},
    "This conversation could not be loaded.",
  );
}

export function replyToSupport(
  reference: string,
  message: string,
  file: File | null,
): Promise<SupportResult<SupportThread | null>> {
  return thread(
    `/api/support/tickets/${encodeURIComponent(reference)}/messages`,
    { method: "POST", body: messageForm({ message }, file) },
    "Your message could not be sent.",
  );
}

export function markSupportSolved(
  reference: string,
): Promise<SupportResult<SupportThread | null>> {
  return thread(
    `/api/support/tickets/${encodeURIComponent(reference)}/solve`,
    { method: "POST" },
    "That could not be updated.",
  );
}

export function supportAttachmentUrl(
  reference: string,
  messageId: number,
  asStaff: boolean,
): string {
  return `/api${asStaff ? "/admin" : ""}/support/tickets/${encodeURIComponent(reference)}/messages/${messageId}/attachment`;
}

// === For the team

export async function getSupportInbox(
  status: SupportStatus | null,
  page: number,
): Promise<SupportResult<SupportTicket[]>> {
  const query = new URLSearchParams({ page: String(page), size: "25" });

  if (status) {
    query.set("status", status);
  }

  const result = await call(
    `/api/admin/support/tickets?${query.toString()}`,
    {},
    "The support inbox could not be loaded.",
  );
  const items =
    isRecord(result.data) && Array.isArray(result.data.items)
      ? result.data.items.filter(isTicket)
      : [];
  const total =
    isRecord(result.data) && typeof result.data.totalItems === "number"
      ? result.data.totalItems
      : items.length;

  return { data: items, message: result.message, total };
}

export function getSupportThreadAsStaff(
  reference: string,
): Promise<SupportResult<SupportThread | null>> {
  return thread(
    `/api/admin/support/tickets/${encodeURIComponent(reference)}`,
    {},
    "This conversation could not be loaded.",
  );
}

export function replyAsStaff(
  reference: string,
  message: string,
  file: File | null,
): Promise<SupportResult<SupportThread | null>> {
  return thread(
    `/api/admin/support/tickets/${encodeURIComponent(reference)}/messages`,
    { method: "POST", body: messageForm({ message }, file) },
    "Your reply could not be sent.",
  );
}

export function setSupportStatus(
  reference: string,
  status: SupportStatus,
): Promise<SupportResult<SupportThread | null>> {
  return thread(
    `/api/admin/support/tickets/${encodeURIComponent(reference)}/status?status=${status}`,
    { method: "POST" },
    "The status could not be changed.",
  );
}
