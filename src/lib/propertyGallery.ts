"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export interface GalleryImage {
  caption: string | null;
  /** Position zero. The cover is what the whole platform shows for the listing. */
  cover: boolean;
  id: number;
  position: number;
  url: string;
}

export interface GalleryResult<TValue> {
  data: TValue;
  message?: string;
}

// === Guards

function isGalleryImage(value: unknown): value is GalleryImage {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "url" in value &&
    typeof value.url === "string"
  );
}

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

// === Requests

export async function getGallery(
  propertyId: number,
): Promise<GalleryResult<GalleryImage[]>> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/images`);
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "The photos could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data)
      ? { data: data.filter(isGalleryImage) }
      : { data: [], message: "The photos could not be loaded." };
  } catch {
    return { data: [], message: "The photos could not be loaded." };
  }
}

export async function addGalleryImage(
  propertyId: number,
  file: File,
): Promise<GalleryResult<GalleryImage | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Log in again to add photos." };
  }

  try {
    const body = new FormData();
    body.append("image", file, file.name);

    const response = await fetch(`/api/properties/${propertyId}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That photo was not added."),
      };
    }

    const data = unwrap(payload);

    return isGalleryImage(data)
      ? { data }
      : { data: null, message: "That photo was not added." };
  } catch {
    return { data: null, message: "That photo was not added." };
  }
}

export async function deleteGalleryImage(
  propertyId: number,
  imageId: number,
): Promise<GalleryResult<boolean>> {
  const token = getAccessToken();

  if (!token) {
    return { data: false, message: "Log in again to remove photos." };
  }

  try {
    const response = await fetch(
      `/api/properties/${propertyId}/images/${imageId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);

      return {
        data: false,
        message: resolveApiError(payload, "That photo was not removed."),
      };
    }

    return { data: true };
  } catch {
    return { data: false, message: "That photo was not removed." };
  }
}

/** The first id given becomes the cover. */
export async function reorderGallery(
  propertyId: number,
  imageIds: number[],
): Promise<GalleryResult<GalleryImage[]>> {
  const token = getAccessToken();

  if (!token) {
    return { data: [], message: "Log in again to reorder photos." };
  }

  try {
    const response = await fetch(
      `/api/properties/${propertyId}/images/order`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageIds),
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "The order was not saved."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data)
      ? { data: data.filter(isGalleryImage) }
      : { data: [], message: "The order was not saved." };
  } catch {
    return { data: [], message: "The order was not saved." };
  }
}
