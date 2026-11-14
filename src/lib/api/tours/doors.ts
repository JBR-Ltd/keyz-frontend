// src/lib/api/tours/doors.ts

import type {
  CreateDoorRequest,
  Door,
  UpdateDoorRequest,
} from "@/lib/types/tour";
import { tourRequest } from "./utils";

export async function createDoor(request: CreateDoorRequest): Promise<Door> {
  return tourRequest<Door>("/api/tours/doors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function updateDoor(
  doorId: number,
  request: UpdateDoorRequest,
): Promise<Door> {
  return tourRequest<Door>(`/api/tours/doors/${doorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function deleteDoor(doorId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/doors/${doorId}`, { method: "DELETE" });
}

export async function getDoorsForRoom(roomId: number): Promise<Door[]> {
  return tourRequest<Door[]>(`/api/tours/doors/rooms/${roomId}`);
}
