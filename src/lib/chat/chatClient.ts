"use client";

import { getBrowserSessionMarker } from "@/lib/authSession";

import { apiRequest } from "@/lib/apiRequest";
import { resolveApiError } from "@/lib/errors";

// === Types

export type ChatPartyRole = "ADMIN" | "AGENT" | "LANDLORD" | "TENANT";

export type ChatAttachmentType = "PROPERTY" | "TOUR" | "FLOOR_PLAN";

/** A shared listing, tour or floor plan, as the server copied it when it was sent. */
export interface ChatAttachment {
  /** The listing for PROPERTY and TOUR, the floor for FLOOR_PLAN. */
  id: number;
  imageUrl: string | null;
  /** The listing the card links to, whatever was shared. */
  propertyId: number;
  subtitle: string | null;
  title: string;
  type: ChatAttachmentType;
}

export interface ServerChatMessage {
  attachment?: ChatAttachment | null;
  content: string;
  id: number;
  read: boolean;
  receiverId: number;
  receiverName: string;
  senderId: number;
  senderName: string;
  timestamp: string;
}

export interface ChatThread {
  lastMessage: string | null;
  lastMessageRead: boolean;
  lastMessageTimestamp: string | null;
  otherUserId: number;
  otherUserName: string;
  otherUserRole: ChatPartyRole;
}

export interface ChatResult<TValue> {
  data: TValue;
  message?: string;
}

// === Guards

function isServerChatMessage(value: unknown): value is ServerChatMessage {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "content" in value &&
    typeof value.content === "string" &&
    "senderId" in value &&
    typeof value.senderId === "number"
  );
}

function isChatThread(value: unknown): value is ChatThread {
  return (
    value !== null &&
    typeof value === "object" &&
    "otherUserId" in value &&
    typeof value.otherUserId === "number"
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

async function request(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; payload: unknown }> {
  const token = getSessionMarker();

  if (!token) {
    return { ok: false, payload: null };
  }

  const response = await apiRequest(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  return { ok: response.ok, payload: await response.json().catch(() => null) };
}

// === Requests

/** One entry per person the signed-in user has exchanged messages with. */
export async function getChatThreads(): Promise<ChatResult<ChatThread[]>> {
  try {
    const { ok, payload } = await request("/api/chat/threads");

    if (!ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Messages could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data) && data.every(isChatThread)
      ? { data }
      : { data: [], message: "Messages could not be loaded." };
  } catch {
    return { data: [], message: "Messages could not be loaded." };
  }
}

/**
 * The full exchange with one person, oldest first.
 * Loading it marks their messages read, so there is no separate call to forget.
 */
export async function getConversation(
  withUserId: number,
  propertyId?: number,
): Promise<ChatResult<ServerChatMessage[]>> {
  try {
    const query = new URLSearchParams({ withUserId: String(withUserId) });

    if (propertyId !== undefined) {
      query.set("propertyId", String(propertyId));
    }

    const { ok, payload } = await request(
      `/api/chat/conversation?${query.toString()}`,
    );

    if (!ok) {
      return {
        data: [],
        message: resolveApiError(payload, "That conversation could not load."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data) && data.every(isServerChatMessage)
      ? { data }
      : { data: [], message: "That conversation could not load." };
  } catch {
    return { data: [], message: "That conversation could not load." };
  }
}

/**
 * Sends words, a share, or both. A share may go with no words: the server writes
 * a line for the thread list and builds the card from the listing.
 */
export async function sendChatMessage(
  receiverId: number,
  content: string,
  propertyId?: number,
  attachment?: { id: number; type: ChatAttachmentType },
): Promise<ChatResult<ServerChatMessage | null>> {
  try {
    const { ok, payload } = await request("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId,
        content,
        propertyId,
        attachmentType: attachment?.type,
        attachmentId: attachment?.id,
      }),
    });

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That message was not sent."),
      };
    }

    const data = unwrap(payload);

    return isServerChatMessage(data)
      ? { data }
      : { data: null, message: "That message was not sent." };
  } catch {
    return { data: null, message: "That message was not sent." };
  }
}

/** Unread count across every thread, for the badge. */
export async function getUnreadCount(): Promise<ChatResult<number>> {
  try {
    const { ok, payload } = await request("/api/chat/pending");
    const data = unwrap(payload);

    return ok && typeof data === "number" ? { data } : { data: 0 };
  } catch {
    return { data: 0 };
  }
}
