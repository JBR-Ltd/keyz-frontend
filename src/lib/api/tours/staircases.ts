// src/lib/api/tours/staircases.ts

import type {
  CreateStaircaseRequest,
  Staircase,
  UpdateStaircaseRequest,
} from "@/lib/types/tour";
import { tourRequest } from "./utils";

export async function createStaircase(
  floorId: number,
  request: CreateStaircaseRequest,
): Promise<Staircase> {
  return tourRequest<Staircase>(`/api/tours/floors/${floorId}/staircases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function updateStaircase(
  staircaseId: number,
  request: UpdateStaircaseRequest,
): Promise<Staircase> {
  return tourRequest<Staircase>(`/api/tours/staircases/${staircaseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function deleteStaircase(staircaseId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/staircases/${staircaseId}`, {
    method: "DELETE",
  });
}

export async function getStaircasesForFloor(
  floorId: number,
): Promise<Staircase[]> {
  return tourRequest<Staircase[]>(`/api/tours/floors/${floorId}/staircases`);
}

export async function getStaircasesForRoom(
  roomId: number,
): Promise<Staircase[]> {
  return tourRequest<Staircase[]>(`/api/tours/rooms/${roomId}/staircases`);
}
