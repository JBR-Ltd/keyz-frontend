"use client";

import { apiRequest } from "@/lib/apiRequest";

import { getBrowserSessionMarker } from "@/lib/authSession";

import { resolveApiError } from "@/lib/errors";

// === Types

export type InspectionKind = "MOVE_IN" | "MOVE_OUT";
export type InspectionStatus = "DRAFT" | "SUBMITTED" | "ACKNOWLEDGED" | "CONTESTED";
export type ItemCondition = "GOOD" | "FAIR" | "POOR" | "DAMAGED" | "MISSING";

export interface InspectionItem {
  condition: ItemCondition;
  item: string;
  note: string | null;
  room: string;
}

export interface InspectionPhoto {
  caption: string | null;
  id: number;
  room: string | null;
  uploadedAt: string;
  url: string;
}

/** A move-in or move-out condition report. Frozen and hashed once submitted. */
export interface Inspection {
  authorId: number;
  authorName: string;
  authorSide: "HOST" | "TENANT";
  bookingId: number;
  contentHash: string | null;
  createdAt: string;
  id: number;
  /** Null for a draft; false means the stored report no longer matches its hash. */
  intact: boolean | null;
  items: InspectionItem[];
  kind: InspectionKind;
  mine: boolean;
  note: string | null;
  photos: InspectionPhoto[];
  respondedAt: string | null;
  responseNote: string | null;
  status: InspectionStatus;
  submittedAt: string | null;
}

export type AgreementStatus = "DRAFT" | "SENT" | "SIGNED" | "DECLINED" | "VOID";

export interface AgreementSignature {
  name: string;
  signedAt: string;
}

export interface Agreement {
  body: string;
  bookingId: number;
  /** The host may prepare or revise it. */
  canEdit: boolean;
  /** The tenant may sign or decline it now. */
  canSign: boolean;
  closedAt: string | null;
  contentHash: string | null;
  createdAt: string;
  declinedReason: string | null;
  hostClauses: string | null;
  id: number;
  intact: boolean | null;
  landlordName: string;
  landlordSignature: AgreementSignature | null;
  status: AgreementStatus;
  templateVersion: string;
  tenantName: string;
  tenantSignature: AgreementSignature | null;
  version: number;
}

export interface RecordsResult<TValue> {
  data: TValue;
  message?: string;
}

// === Helpers

function getSessionMarker(): string {
  return getBrowserSessionMarker();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isInspection(value: unknown): value is Inspection {
  return isRecord(value) && typeof value.id === "number" && typeof value.kind === "string";
}

function isAgreement(value: unknown): value is Agreement {
  return isRecord(value) && typeof value.id === "number" && typeof value.body === "string";
}

async function send(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<{ data: unknown; message?: string }> {
  const token = getSessionMarker();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await apiRequest(path, {
      ...init,
      headers: { ...(init.headers ?? {}) },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return { data: null, message: resolveApiError(payload, fallback) };
    }

    return { data: isRecord(payload) && "data" in payload ? payload.data : null };
  } catch {
    return { data: null, message: fallback };
  }
}

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function inspectionCall(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<RecordsResult<Inspection | null>> {
  const result = await send(path, init, fallback);

  return isInspection(result.data)
    ? { data: result.data }
    : { data: null, message: result.message ?? fallback };
}

async function agreementCall(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<RecordsResult<Agreement | null>> {
  const result = await send(path, init, fallback);

  return isAgreement(result.data)
    ? { data: result.data }
    : { data: null, message: result.message ?? fallback };
}

// === Condition reports

export async function getInspections(
  bookingId: number,
): Promise<RecordsResult<Inspection[]>> {
  const result = await send(
    `/api/bookings/${bookingId}/inspections`,
    {},
    "Condition reports could not be loaded.",
  );

  return {
    data: Array.isArray(result.data) ? result.data.filter(isInspection) : [],
    message: result.message,
  };
}

export function startInspection(
  bookingId: number,
  kind: InspectionKind,
): Promise<RecordsResult<Inspection | null>> {
  return inspectionCall(
    `/api/bookings/${bookingId}/inspections`,
    json("POST", { kind }),
    "That report could not be started.",
  );
}

export function saveInspectionItems(
  bookingId: number,
  inspectionId: number,
  note: string,
  items: InspectionItem[],
): Promise<RecordsResult<Inspection | null>> {
  return inspectionCall(
    `/api/bookings/${bookingId}/inspections/${inspectionId}/items`,
    json("PUT", { note, items }),
    "The report could not be saved.",
  );
}

export function addInspectionPhoto(
  bookingId: number,
  inspectionId: number,
  file: File,
  room: string,
  caption: string,
): Promise<RecordsResult<Inspection | null>> {
  const form = new FormData();
  form.append("file", file);

  if (room) {
    form.append("room", room);
  }

  if (caption) {
    form.append("caption", caption);
  }

  return inspectionCall(
    `/api/bookings/${bookingId}/inspections/${inspectionId}/photos`,
    { method: "POST", body: form },
    "That photo could not be added.",
  );
}

export function removeInspectionPhoto(
  bookingId: number,
  inspectionId: number,
  photoId: number,
): Promise<RecordsResult<Inspection | null>> {
  return inspectionCall(
    `/api/bookings/${bookingId}/inspections/${inspectionId}/photos/${photoId}`,
    { method: "DELETE" },
    "That photo could not be removed.",
  );
}

export function submitInspection(
  bookingId: number,
  inspectionId: number,
): Promise<RecordsResult<Inspection | null>> {
  return inspectionCall(
    `/api/bookings/${bookingId}/inspections/${inspectionId}/submit`,
    { method: "POST" },
    "The report could not be submitted.",
  );
}

export function respondToInspection(
  bookingId: number,
  inspectionId: number,
  agree: boolean,
  note: string,
): Promise<RecordsResult<Inspection | null>> {
  return inspectionCall(
    `/api/bookings/${bookingId}/inspections/${inspectionId}/respond`,
    json("POST", { agree, note }),
    "Your answer could not be saved.",
  );
}

// === Tenancy agreement

/** Data is null when no agreement has been prepared yet. */
export async function getAgreement(
  bookingId: number,
): Promise<RecordsResult<Agreement | null>> {
  const result = await send(
    `/api/bookings/${bookingId}/agreement`,
    {},
    "The agreement could not be loaded.",
  );

  return { data: isAgreement(result.data) ? result.data : null, message: result.message };
}

export function saveAgreementDraft(
  bookingId: number,
  clauses: string,
): Promise<RecordsResult<Agreement | null>> {
  return agreementCall(
    `/api/bookings/${bookingId}/agreement`,
    json("PUT", { clauses }),
    "The draft could not be saved.",
  );
}

export function sendAgreement(
  bookingId: number,
  fullName: string,
): Promise<RecordsResult<Agreement | null>> {
  return agreementCall(
    `/api/bookings/${bookingId}/agreement/send`,
    json("POST", { fullName, agree: true }),
    "The agreement could not be sent.",
  );
}

export function signAgreement(
  bookingId: number,
  fullName: string,
  version: number,
): Promise<RecordsResult<Agreement | null>> {
  return agreementCall(
    `/api/bookings/${bookingId}/agreement/sign`,
    json("POST", { fullName, agree: true, version }),
    "The agreement could not be signed.",
  );
}

export function declineAgreement(
  bookingId: number,
  reason: string,
): Promise<RecordsResult<Agreement | null>> {
  return agreementCall(
    `/api/bookings/${bookingId}/agreement/decline`,
    json("POST", { reason }),
    "Your answer could not be sent.",
  );
}
