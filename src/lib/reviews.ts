"use client";

import { apiRequest } from "@/lib/apiRequest";
import type { PartySummary } from "@/lib/bookings";
import { resolveApiError } from "@/lib/errors";

// === Types

export type ReviewDirection = "TENANT_TO_HOST" | "HOST_TO_TENANT";

export interface Review {
  /** The stay the review is about. Null on reviews written before reviews bound to a stay. */
  bookingId?: number | null;
  comment: string | null;
  createdAt: string | null;
  direction: ReviewDirection;
  id: number;
  /** Hidden until the other side reviews too, or the review window closes. */
  pending?: boolean;
  propertyId: number;
  propertyTitle: string;
  publishedAt?: string | null;
  rating: number;
  /** The reviewed person's one public reply. */
  reply?: string | null;
  repliedAt?: string | null;
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
    const response = await apiRequest(path, {
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

/** Published reviews on one listing, by its numeric or public id. */
export function getPropertyReviews(
  propertyId: number | string,
): Promise<ReviewResult<Review[]>> {
  return requestReviews(
    `/api/reviews/property/${encodeURIComponent(String(propertyId))}`,
    false,
  );
}

export interface NewReview {
  /** The completed stay being reviewed. */
  bookingId: number;
  comment: string;
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
    const response = await apiRequest("/api/reviews", {
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

/** The person reviewed answers once, publicly, after the review is published. */
export async function replyToReview(
  reviewId: number,
  reply: string,
): Promise<ReviewResult<Review | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(`/api/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reply }),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Your reply could not be posted."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    return { data: isReview(data) ? data : null };
  } catch {
    return { data: null, message: "Your reply could not be posted." };
  }
}
