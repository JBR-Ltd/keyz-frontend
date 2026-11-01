// src/lib/api/tours/floors.ts

import type { Floor, SizeBucket } from "@/lib/types/tour";
import { tourRequest } from "./utils";

export interface CreateFloorInput {
  floorNumber: number;
  name: string;
}

export interface UpdateFloorInput {
  name?: string;
  floorNumber?: number;
}

export async function createFloor(
  propertyId: number,
  payload: CreateFloorInput,
): Promise<Floor> {
  return tourRequest<Floor>(`/api/tours/properties/${propertyId}/floors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getFloorsForProperty(
  propertyId: number,
): Promise<Floor[]> {
  return tourRequest<Floor[]>(`/api/tours/properties/${propertyId}/floors`);
}

export async function getFloor(floorId: number): Promise<Floor> {
  return tourRequest<Floor>(`/api/tours/floors/${floorId}`);
}

export async function updateFloor(
  floorId: number,
  payload: UpdateFloorInput,
): Promise<Floor> {
  return tourRequest<Floor>(`/api/tours/floors/${floorId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteFloor(floorId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/floors/${floorId}`, {
    method: "DELETE",
  });
}

// Re-export the size bucket type so callers that pull from the floors module
// still type-check while the wizard migrates.
export type { SizeBucket };
