// src/lib/api/tours/publish.ts

import type { PublicTour, TourSummary } from "@/lib/types/tour";
import { tourRequest } from "./utils";

export type { TourSummary } from "@/lib/types/tour";

export async function getTourSummary(propertyId: number): Promise<TourSummary> {
  return tourRequest<TourSummary>(
    `/api/tours/properties/${propertyId}/tour-summary`,
  );
}

/**
 * Owner preview bundle. Includes drafts and unconfirmed floors so the wizard
 * can show progress. Ownership is enforced server-side; a stranger gets 404.
 */
export async function getTourPreview(propertyId: number): Promise<PublicTour> {
  return tourRequest<PublicTour>(
    `/api/tours/properties/${propertyId}/full-tour`,
  );
}

/** Publish. The server refuses with TOUR_NOT_PUBLISHABLE if the gate fails. */
export async function publishTour(propertyId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/properties/${propertyId}/publish`, {
    method: "POST",
  });
}

export async function unpublishTour(propertyId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/properties/${propertyId}/publish`, {
    method: "DELETE",
  });
}
