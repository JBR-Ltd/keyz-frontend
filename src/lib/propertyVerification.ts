"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export interface CaptureFix {
  accuracy: number;
  latitude: number;
  longitude: number;
}

export interface ProofCapture {
  capturedAt: string;
  dataUrl: string;
  fix: CaptureFix | null;
  name: string;
  type: string;
}

export interface ProofSubmissionResult {
  message: string;
  success: boolean;
}

// === Geolocation

const GEOLOCATION_TIMEOUT_MS = 20000;

/**
 * The device fix taken at the moment of capture. The backend trusts this over photo
 * EXIF, so it is read here rather than derived from the file.
 */
export function readDeviceLocation(): Promise<CaptureFix | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          accuracy: position.coords.accuracy,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(null),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: GEOLOCATION_TIMEOUT_MS,
      },
    );
  });
}

// === Submission

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error("The photo could not be prepared for upload.");
  }

  return response.blob();
}

export async function submitPropertyProof(
  propertyId: number,
  capture: ProofCapture,
): Promise<ProofSubmissionResult> {
  const token = getAccessToken();

  if (!token) {
    return {
      success: false,
      message: "Your session has expired. Log in again.",
    };
  }

  try {
    const formData = new FormData();
    formData.append("proofImage", await dataUrlToBlob(capture.dataUrl), capture.name);

    if (capture.fix) {
      formData.append("capturedLatitude", String(capture.fix.latitude));
      formData.append("capturedLongitude", String(capture.fix.longitude));
    }

    const response = await fetch(
      `/api/verification/property/verify?propertyId=${propertyId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: resolveApiError(payload, "This listing could not be verified."),
      };
    }

    return {
      success: true,
      message: "Your listing is verified and now live.",
    };
  } catch {
    return {
      success: false,
      message: "Unable to reach the verification server right now.",
    };
  }
}
