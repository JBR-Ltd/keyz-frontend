"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export type ViewingType = "IN_PERSON" | "VIRTUAL";

export type ViewingStatus =
  | "CANCELLED"
  | "COMPLETED"
  | "CONFIRMED"
  | "DECLINED"
  | "PENDING";

export interface ViewingParty {
  id: number;
  identityVerified: boolean;
  name: string;
  rating: number | null;
  role: "ADMIN" | "AGENT" | "LANDLORD" | "TENANT";
}

export interface Viewing {
  host: ViewingParty | null;
  id: number;
  note: string | null;
  propertyAddress: string;
  propertyId: number;
  propertyImageUrl: string | null;
  propertyTitle: string;
  proposedStartAt: string;
  responseNote: string | null;
  /** Set once the host confirms. May differ from what was proposed. */
  scheduledStartAt: string | null;
  status: ViewingStatus;
  tenant: ViewingParty | null;
  type: ViewingType;
}

export interface ViewingRoom {
  joinUrl: string;
  roomName: string;
  token: string;
}

export interface ViewingResult<TValue> {
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

function isViewing(value: unknown): value is Viewing {
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
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  return { ok: response.ok, payload: await response.json().catch(() => null) };
}

async function listViewings(path: string): Promise<ViewingResult<Viewing[]>> {
  try {
    const { ok, payload } = await request(path);

    if (!ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Viewings could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data) && data.every(isViewing)
      ? { data }
      : { data: [], message: "Viewings could not be loaded." };
  } catch {
    return { data: [], message: "Viewings could not be loaded." };
  }
}

// === Requests

/** Asks the host to show the property. Holds no dates and costs nothing. */
export async function requestViewing(
  propertyId: number,
  type: ViewingType,
  proposedStartAt: string,
  note?: string,
): Promise<ViewingResult<Viewing | null>> {
  try {
    const { ok, payload } = await request("/api/viewings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, type, proposedStartAt, note }),
    });

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That viewing could not be requested."),
      };
    }

    const data = unwrap(payload);

    return isViewing(data)
      ? { data }
      : { data: null, message: "That viewing could not be requested." };
  } catch {
    return { data: null, message: "That viewing could not be requested." };
  }
}

export function getMyViewings(): Promise<ViewingResult<Viewing[]>> {
  return listViewings("/api/viewings/mine");
}

export function getHostViewings(
  status?: ViewingStatus,
): Promise<ViewingResult<Viewing[]>> {
  return listViewings(
    status ? `/api/viewings/host?status=${status}` : "/api/viewings/host",
  );
}

/** Hosts confirm, decline and complete. Tenants may only cancel. */
export async function decideViewing(
  viewingId: number,
  status: ViewingStatus,
  scheduledStartAt?: string,
  responseNote?: string,
): Promise<ViewingResult<Viewing | null>> {
  try {
    const { ok, payload } = await request(`/api/viewings/${viewingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, scheduledStartAt, responseNote }),
    });

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That viewing could not be updated."),
      };
    }

    const data = unwrap(payload);

    return isViewing(data)
      ? { data }
      : { data: null, message: "That viewing could not be updated." };
  } catch {
    return { data: null, message: "That viewing could not be updated." };
  }
}

/** Room credentials, which the server only issues for a confirmed virtual viewing. */
export async function joinViewing(
  viewingId: number,
): Promise<ViewingResult<ViewingRoom | null>> {
  try {
    const { ok, payload } = await request(`/api/viewings/${viewingId}/join`, {
      method: "POST",
    });

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That room could not be opened."),
      };
    }

    const data = unwrap(payload);

    return data !== null && typeof data === "object"
      ? { data: data as ViewingRoom }
      : { data: null, message: "That room could not be opened." };
  } catch {
    return { data: null, message: "That room could not be opened." };
  }
}
