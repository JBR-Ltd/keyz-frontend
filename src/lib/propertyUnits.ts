"use client";

import { getBrowserSessionMarker } from "@/lib/authSession";

import { apiRequest } from "@/lib/apiRequest";
import { resolveApiError } from "@/lib/errors";

export type PropertyUnitStatus = "AVAILABLE" | "OCCUPIED" | "UNAVAILABLE";

export interface PropertyUnit {
  label: string;
  ordinal: number;
  publicId: string;
  status: PropertyUnitStatus;
}

export interface PropertyUnitResult<TValue> {
  data: TValue;
  message?: string;
}

function getSessionMarker(): string {
  return getBrowserSessionMarker();
}

function isPropertyUnit(value: unknown): value is PropertyUnit {
  return (
    value !== null &&
    typeof value === "object" &&
    "publicId" in value &&
    typeof value.publicId === "string" &&
    "label" in value &&
    typeof value.label === "string" &&
    "status" in value &&
    typeof value.status === "string"
  );
}

async function request(
  propertyId: number,
  path = "",
  init?: RequestInit,
): Promise<PropertyUnitResult<unknown>> {
  const token = getSessionMarker();

  if (!token) {
    return { data: null, message: "Log in to manage units." };
  }

  try {
    const response = await apiRequest(
      `/api/properties/${propertyId}/units${path}`,
      {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
        },
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Units could not be loaded."),
      };
    }

    return {
      data:
        payload !== null && typeof payload === "object" && "data" in payload
          ? payload.data
          : null,
    };
  } catch {
    return { data: null, message: "Units could not be loaded." };
  }
}

export async function getPropertyUnits(
  propertyId: number,
): Promise<PropertyUnitResult<PropertyUnit[]>> {
  const result = await request(propertyId);

  return Array.isArray(result.data) && result.data.every(isPropertyUnit)
    ? { data: result.data }
    : { data: [], message: result.message ?? "Units could not be loaded." };
}

export async function updatePropertyUnitStatus(
  propertyId: number,
  publicId: string,
  status: Exclude<PropertyUnitStatus, "OCCUPIED">,
): Promise<PropertyUnitResult<PropertyUnit | null>> {
  const result = await request(propertyId, `/${encodeURIComponent(publicId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  return isPropertyUnit(result.data)
    ? { data: result.data }
    : { data: null, message: result.message ?? "That unit could not be updated." };
}
