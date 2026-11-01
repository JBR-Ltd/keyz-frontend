// src/lib/api/tours/publicTour.ts
//
// The anonymous read. Resolves by the opaque public id, not the numeric one.
// A listing that is not live, or whose tour was never published, gets a 404
// and this function throws. Callers that want "no tour, no error" should
// catch and render nothing.

import type { PublicTour } from "@/lib/types/tour";
import { tourRequest } from "./utils";

export async function getPublicTour(publicId: string): Promise<PublicTour> {
  return tourRequest<PublicTour>(
    `/api/tours/public/${encodeURIComponent(publicId)}`,
  );
}
