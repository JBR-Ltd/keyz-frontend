"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export type ReportReason =
  | "FAKE_LISTING"
  | "WRONG_PRICE"
  | "OFF_PLATFORM_PAYMENT"
  | "EXTRA_FEES"
  | "DISCRIMINATION"
  | "HARASSMENT"
  | "SCAM"
  | "UNSAFE"
  | "OTHER";

export type ReportTarget =
  | { listingId: string; type: "LISTING" }
  | { type: "USER"; userId: string };

export interface AdminReport {
  createdAt: string;
  detail: string | null;
  id: number;
  listingId: number | null;
  listingPublicId: string | null;
  listingTitle: string | null;
  reason: ReportReason;
  reportedUserId: number | null;
  reportedUserName: string | null;
  reporterId: number;
  reporterName: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  status: "OPEN" | "ACTIONED" | "DISMISSED";
  targetType: "LISTING" | "USER";
}

export interface SavedSearch {
  alerts: boolean;
  city: string | null;
  createdAt: string;
  id: number;
  lastAlertedAt: string | null;
  maxPrice: number | null;
  minBedrooms: number | null;
  minPrice: number | null;
  name: string;
  query: string | null;
}

export interface SavedSearchInput {
  alerts: boolean;
  city?: string;
  maxPrice?: number;
  minBedrooms?: number;
  minPrice?: number;
  name?: string;
  query?: string;
}

export type MandateStatus = "INVITED" | "ACTIVE" | "DECLINED" | "ENDED";

export interface Mandate {
  acceptedAt: string | null;
  agentFeePercent: number;
  agentId: number;
  agentName: string;
  createdAt: string;
  endReason: string | null;
  endedAt: string | null;
  id: number;
  landlordEmail: string;
  landlordId: number | null;
  landlordName: string | null;
  note: string | null;
  propertyCount: number;
  status: MandateStatus;
  viewerRole: "AGENT" | "LANDLORD" | "ADMIN";
}

export interface MandateOverview {
  agentFees: { amount: number; bookingId: number; id: number; paidAt: string | null; status: string }[];
  bookings: {
    createdAt: string;
    id: number;
    propertyId: number;
    propertyTitle: string;
    status: string;
    tenantName: string;
    totalPrice: number;
  }[];
  mandate: Mandate;
  properties: {
    address: string;
    id: number;
    publicId: string;
    status: string;
    title: string;
    verified: boolean;
  }[];
}

export interface MarketResult<TValue> {
  data: TValue;
  message?: string;
}

// === Helpers

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

async function send(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<{ data: unknown; message?: string; ok: boolean }> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Log in first.", ok: false };
  }

  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return { data: null, message: resolveApiError(payload, fallback), ok: false };
    }

    return { data: isRecord(payload) && "data" in payload ? payload.data : null, ok: true };
  } catch {
    return { data: null, message: fallback, ok: false };
  }
}

function listOf<T>(value: unknown, key: string): T[] {
  return Array.isArray(value) ? (value.filter((item) => isRecord(item) && key in item) as T[]) : [];
}

function oneOf<T>(value: unknown, key: string): T | null {
  return isRecord(value) && key in value ? (value as T) : null;
}

// === Reports

export async function submitReport(
  target: ReportTarget,
  reason: ReportReason,
  detail: string,
): Promise<MarketResult<boolean>> {
  const result = await send(
    "/api/reports",
    {
      method: "POST",
      body: JSON.stringify({
        targetType: target.type,
        listingId: target.type === "LISTING" ? target.listingId : undefined,
        userId: target.type === "USER" ? target.userId : undefined,
        reason,
        detail,
      }),
    },
    "Your report could not be sent.",
  );

  return { data: result.ok, message: result.message };
}

export async function getAdminReports(
  status?: AdminReport["status"],
): Promise<MarketResult<AdminReport[]>> {
  const result = await send(
    `/api/admin/reports${status ? `?status=${status}` : ""}`,
    {},
    "Reports could not be loaded.",
  );

  return { data: listOf<AdminReport>(result.data, "reason"), message: result.message };
}

export async function reviewReport(
  reportId: number,
  status: "ACTIONED" | "DISMISSED",
  note: string,
): Promise<MarketResult<AdminReport | null>> {
  const result = await send(
    `/api/admin/reports/${reportId}/review`,
    { method: "POST", body: JSON.stringify({ status, note }) },
    "The review could not be saved.",
  );

  return { data: oneOf<AdminReport>(result.data, "reason"), message: result.message };
}

// === Saved searches

export async function getSavedSearches(): Promise<MarketResult<SavedSearch[]>> {
  const result = await send("/api/saved-searches", {}, "Saved searches could not be loaded.");

  return { data: listOf<SavedSearch>(result.data, "name"), message: result.message };
}

export async function createSavedSearch(
  input: SavedSearchInput,
): Promise<MarketResult<SavedSearch | null>> {
  const result = await send(
    "/api/saved-searches",
    { method: "POST", body: JSON.stringify(input) },
    "This search could not be saved.",
  );

  return { data: oneOf<SavedSearch>(result.data, "name"), message: result.message };
}

export async function updateSavedSearch(
  id: number,
  changes: { alerts?: boolean; name?: string },
): Promise<MarketResult<SavedSearch | null>> {
  const result = await send(
    `/api/saved-searches/${id}`,
    { method: "PATCH", body: JSON.stringify(changes) },
    "This search could not be updated.",
  );

  return { data: oneOf<SavedSearch>(result.data, "name"), message: result.message };
}

export async function deleteSavedSearch(id: number): Promise<MarketResult<boolean>> {
  const result = await send(`/api/saved-searches/${id}`, { method: "DELETE" }, "This search could not be deleted.");

  return { data: result.ok, message: result.message };
}

// === Mandates

export async function getMandates(): Promise<MarketResult<Mandate[]>> {
  const result = await send("/api/mandates", {}, "Mandates could not be loaded.");

  return { data: listOf<Mandate>(result.data, "agentFeePercent"), message: result.message };
}

export async function getMandateOverview(id: number): Promise<MarketResult<MandateOverview | null>> {
  const result = await send(`/api/mandates/${id}`, {}, "This mandate could not be loaded.");

  return { data: oneOf<MandateOverview>(result.data, "mandate"), message: result.message };
}

async function mandateCall(
  path: string,
  body: unknown,
  fallback: string,
  method = "POST",
): Promise<MarketResult<Mandate | null>> {
  const result = await send(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }, fallback);

  return { data: oneOf<Mandate>(result.data, "agentFeePercent"), message: result.message };
}

export function inviteLandlord(
  landlordEmail: string,
  agentFeePercent: number,
  note: string,
): Promise<MarketResult<Mandate | null>> {
  return mandateCall("/api/mandates", { landlordEmail, agentFeePercent, note }, "The invitation could not be sent.");
}

export function acceptMandate(id: number): Promise<MarketResult<Mandate | null>> {
  return mandateCall(`/api/mandates/${id}/accept`, undefined, "The mandate could not be accepted.");
}

export function declineMandate(id: number, reason: string): Promise<MarketResult<Mandate | null>> {
  return mandateCall(`/api/mandates/${id}/decline`, { reason }, "The mandate could not be declined.");
}

export function endMandate(id: number, reason: string): Promise<MarketResult<Mandate | null>> {
  return mandateCall(`/api/mandates/${id}/end`, { reason }, "The mandate could not be ended.");
}

export function attachListing(id: number, propertyId: string): Promise<MarketResult<Mandate | null>> {
  return mandateCall(`/api/mandates/${id}/properties`, { propertyId }, "That listing could not be added.");
}

export function detachListing(id: number, propertyId: string): Promise<MarketResult<Mandate | null>> {
  return mandateCall(
    `/api/mandates/${id}/properties/${encodeURIComponent(propertyId)}`,
    undefined,
    "That listing could not be removed.",
    "DELETE",
  );
}
