"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export type TenancyDocumentType =
  | "INVENTORY_REPORT"
  | "LEASE_AGREEMENT"
  | "MOVE_IN_REPORT"
  | "MOVE_OUT_REPORT"
  | "OTHER"
  | "RECEIPT";

export interface TenancyParty {
  id: number;
  identityVerified: boolean;
  name: string;
  role: "ADMIN" | "AGENT" | "LANDLORD" | "TENANT";
}

export interface TenancyDocument {
  createdAt: string;
  downloadUrl: string;
  id: number;
  name: string;
  type: TenancyDocumentType;
  uploadedBy: TenancyParty | null;
}

export type MaintenanceCategory =
  | "APPLIANCE"
  | "ELECTRICAL"
  | "OTHER"
  | "PLUMBING"
  | "SECURITY"
  | "STRUCTURAL";

export type MaintenancePriority = "EMERGENCY" | "LOW" | "NORMAL" | "URGENT";

export type MaintenanceStatus =
  | "ACKNOWLEDGED"
  | "CANCELLED"
  | "CLOSED"
  | "IN_PROGRESS"
  | "OPEN"
  | "RESOLVED";

export interface MaintenanceRequest {
  attachmentUrls: string[];
  bookingId: number;
  category: MaintenanceCategory;
  createdAt: string;
  description: string | null;
  /** The host's reply, so the tenant knows what is happening. */
  hostNote: string | null;
  id: number;
  priority: MaintenancePriority;
  propertyId: number;
  propertyTitle: string;
  status: MaintenanceStatus;
  tenant: TenancyParty | null;
  title: string;
  updatedAt: string;
}

export interface TenancyResult<TValue> {
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

function hasNumericId(value: unknown): value is { id: number } {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number"
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

// === Documents

/** The paperwork on one tenancy. Both parties may read it; only the host adds to it. */
export async function getTenancyDocuments(
  bookingId: number,
): Promise<TenancyResult<TenancyDocument[]>> {
  try {
    const { ok, payload } = await request(`/api/bookings/${bookingId}/documents`);

    if (!ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Documents could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data) && data.every(hasNumericId)
      ? { data: data as TenancyDocument[] }
      : { data: [], message: "Documents could not be loaded." };
  } catch {
    return { data: [], message: "Documents could not be loaded." };
  }
}

export async function uploadTenancyDocument(
  bookingId: number,
  file: Blob,
  name: string,
  type: TenancyDocumentType,
): Promise<TenancyResult<TenancyDocument | null>> {
  try {
    const formData = new FormData();
    formData.append("file", file, name);
    formData.append("type", type);
    formData.append("name", name);

    const { ok, payload } = await request(`/api/bookings/${bookingId}/documents`, {
      method: "POST",
      body: formData,
    });

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That document could not be added."),
      };
    }

    const data = unwrap(payload);

    return hasNumericId(data)
      ? { data: data as TenancyDocument }
      : { data: null, message: "That document could not be added." };
  } catch {
    return { data: null, message: "That document could not be added." };
  }
}

// === Maintenance

export async function getMyMaintenanceRequests(
  bookingId?: number,
): Promise<TenancyResult<MaintenanceRequest[]>> {
  try {
    const query = bookingId === undefined ? "" : `?bookingId=${bookingId}`;
    const { ok, payload } = await request(`/api/maintenance-requests/mine${query}`);

    if (!ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Repair reports could not be loaded."),
      };
    }

    const data = unwrap(payload);
    const items =
      data !== null && typeof data === "object" && "items" in data
        ? data.items
        : null;

    return Array.isArray(items) && items.every(hasNumericId)
      ? { data: items as MaintenanceRequest[] }
      : { data: [], message: "Repair reports could not be loaded." };
  } catch {
    return { data: [], message: "Repair reports could not be loaded." };
  }
}

/** Reports a problem with a home the tenant currently holds. */
export async function raiseMaintenanceRequest(
  bookingId: number,
  title: string,
  category: MaintenanceCategory,
  priority: MaintenancePriority,
  description?: string,
): Promise<TenancyResult<MaintenanceRequest | null>> {
  try {
    const { ok, payload } = await request("/api/maintenance-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        title,
        category,
        priority,
        description,
      }),
    });

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That report could not be sent."),
      };
    }

    const data = unwrap(payload);

    return hasNumericId(data)
      ? { data: data as MaintenanceRequest }
      : { data: null, message: "That report could not be sent." };
  } catch {
    return { data: null, message: "That report could not be sent." };
  }
}

/** A tenant may only cancel their own report; hosts move it along. */
export async function cancelMaintenanceRequest(
  requestId: number,
): Promise<TenancyResult<boolean>> {
  try {
    const { ok, payload } = await request(`/api/maintenance-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });

    return ok
      ? { data: true }
      : {
          data: false,
          message: resolveApiError(payload, "That report could not be withdrawn."),
        };
  } catch {
    return { data: false, message: "That report could not be withdrawn." };
  }
}
