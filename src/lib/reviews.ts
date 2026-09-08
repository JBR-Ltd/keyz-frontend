"use client";

import type { PartySummary } from "@/lib/bookings";
import { resolveApiError } from "@/lib/errors";

// === Types

export type ReviewDirection = "TENANT_TO_HOST" | "HOST_TO_TENANT";

export interface Review {
  comment: string | null;
  createdAt: string | null;
  direction: ReviewDirection;
  id: number;
  propertyId: number;
  propertyTitle: string;
  rating: number;
  reviewer: PartySummary | null;
  subject: PartySummary | null;
}

export interface ReviewResult<TValue> {
  data: TValue;
  message?: string;
}

// === Guards

function isReview(value: unknown): value is Review {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "rating" in value &&
    typeof value.rating === "number" &&
    "propertyId" in value &&
    typeof value.propertyId === "number" &&
    "direction" in value &&
    (value.direction === "TENANT_TO_HOST" ||
      value.direction === "HOST_TO_TENANT")
  );
}

// === Requests

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

async function requestReviews(
  path: string,
  requireAuth: boolean,
): Promise<ReviewResult<Review[]>> {
  const token = getAccessToken();

  if (requireAuth && !token) {
    return { data: [], message: "Log in to see your reviews." };
  }

  try {
    const response = await fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Reviews could not be loaded."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    if (!Array.isArray(data) || !data.every(isReview)) {
      return { data: [], message: "Reviews could not be loaded." };
    }

    return { data };
  } catch {
    return { data: [], message: "Reviews could not be loaded." };
  }
}

/** Reviews this person wrote. */
export function getReviewsIWrote(): Promise<ReviewResult<Review[]>> {
  return requestReviews("/api/reviews/mine", true);
}

/** Reviews written about this person, in either direction. */
export function getReviewsAboutMe(): Promise<ReviewResult<Review[]>> {
  return requestReviews("/api/reviews/received", true);
}

/** Public reviews on one listing. */
export function getPropertyReviews(
  propertyId: number,
): Promise<ReviewResult<Review[]>> {
  return requestReviews(`/api/reviews/property/${propertyId}`, false);
}

export interface NewReview {
  comment: string;
  propertyId: number;
  rating: number;
}

/**
 * The backend decides the direction from who is asking, so a host reviewing a tenant
 * and a tenant reviewing a host both post here.
 */
export async function submitReview(
  review: NewReview,
): Promise<ReviewResult<Review | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(review),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "This review could not be sent."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    return { data: isReview(data) ? data : null };
  } catch {
    return { data: null, message: "This review could not be sent." };
  }
}
