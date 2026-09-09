"use client";

import type { PartySummary } from "@/lib/bookings";
import { resolveApiError } from "@/lib/errors";

// === Types

export type CallStatus =
  | "INITIATED"
  | "ACCEPTED"
  | "REJECTED"
  | "MISSED"
  | "ENDED";

export interface CallSession {
  caller: PartySummary | null;
  createdAt: string | null;
  id: number;
  joinUrl: string | null;
  propertyId: number | null;
  receiver: PartySummary | null;
  roomName: string | null;
  status: CallStatus;
  /** Room credentials. Only ever issued to the two people on the call. */
  token: string | null;
}

export interface CallResult<TValue> {
  data: TValue;
  message?: string;
}

// === Helpers

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function isCallSession(value: unknown): value is CallSession {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "status" in value &&
    typeof value.status === "string"
  );
}

async function request(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; payload: unknown }> {
  const token = getAccessToken();

  if (!token) {
    return { ok: false, payload: null };
  }

  const response = await fetch(path, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });

  return { ok: response.ok, payload: await response.json().catch(() => null) };
}

async function callAction(
  path: string,
  failure: string,
  method: "GET" | "POST" = "POST",
): Promise<CallResult<CallSession | null>> {
  try {
    const { ok, payload } = await request(path, { method });

    if (!ok) {
      return { data: null, message: resolveApiError(payload, failure) };
    }

    const data = unwrap(payload);

    return isCallSession(data) ? { data } : { data: null };
  } catch {
    return { data: null, message: failure };
  }
}

// === Requests

export function startCall(
  receiverId: number,
  propertyId: number,
): Promise<CallResult<CallSession | null>> {
  const params = new URLSearchParams({
    receiverId: String(receiverId),
    propertyId: String(propertyId),
  });

  return callAction(
    `/api/calls/initiate?${params.toString()}`,
    "That call could not be started.",
  );
}

export function acceptCall(callId: number): Promise<CallResult<CallSession | null>> {
  return callAction(`/api/calls/${callId}/accept`, "That call could not be answered.");
}

export function rejectCall(callId: number): Promise<CallResult<CallSession | null>> {
  return callAction(`/api/calls/${callId}/reject`, "That call could not be declined.");
}

export function endCall(callId: number): Promise<CallResult<CallSession | null>> {
  return callAction(`/api/calls/${callId}/end`, "That call could not be ended.");
}

/** Null means nothing is ringing, which is the ordinary answer. */
export function getIncomingCall(): Promise<CallResult<CallSession | null>> {
  return callAction("/api/calls/incoming", "", "GET");
}

export function getCallStatus(
  callId: number,
): Promise<CallResult<CallSession | null>> {
  return callAction(`/api/calls/${callId}/status`, "", "GET");
}
