// src/lib/api/tours/floorPlans.ts
//
// The browser owns the layout. It reads the plan, PUTs the whole set of
// placements, and confirms when ready.

import type { FloorPlanResponse, PutFloorPlanRequest } from "@/lib/types/tour";
import { tourRequest } from "./utils";

export async function getFloorPlan(
  floorId: number,
): Promise<FloorPlanResponse> {
  return tourRequest<FloorPlanResponse>(
    `/api/tours/floors/${floorId}/floor-plan`,
  );
}

export async function putFloorPlan(
  floorId: number,
  payload: PutFloorPlanRequest,
): Promise<FloorPlanResponse> {
  return tourRequest<FloorPlanResponse>(
    `/api/tours/floors/${floorId}/floor-plan`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export async function confirmFloorPlan(floorId: number): Promise<void> {
  await tourRequest<null>(
    `/api/tours/floors/${floorId}/floor-plan/confirm`,
    { method: "POST" },
  );
}

export async function deleteFloorPlan(floorId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/floors/${floorId}/floor-plan`, {
    method: "DELETE",
  });
}
