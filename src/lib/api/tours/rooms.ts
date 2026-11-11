// src/lib/api/tours/rooms.ts

import type { LinkedRoomRequest, Room, SizeBucket } from "@/lib/types/tour";
import { tourRequest } from "./utils";

export interface CreateRoomInput {
  roomName: string;
  roomType: string;
  sizeBucket?: SizeBucket;
  sizeEstimateSqft?: number | null;
}

export interface UpdateRoomInput {
  roomName?: string;
  roomType?: string;
  sizeBucket?: SizeBucket;
  sizeEstimateSqft?: number | null;
}

export async function createRoom(
  floorId: number,
  payload: CreateRoomInput,
): Promise<Room> {
  return tourRequest<Room>(`/api/tours/floors/${floorId}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * The wizard's "Capture next". One call creates the target room, the door on
 * the current room that leads to it, and the target's fixed entry door with
 * the reciprocal link.
 */
export async function createLinkedRoom(
  sourceRoomId: number,
  payload: LinkedRoomRequest,
): Promise<Room> {
  return tourRequest<Room>(`/api/tours/rooms/${sourceRoomId}/linked-rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getRoomsForFloor(floorId: number): Promise<Room[]> {
  return tourRequest<Room[]>(`/api/tours/floors/${floorId}/rooms`);
}

export async function getRoom(roomId: number): Promise<Room> {
  return tourRequest<Room>(`/api/tours/rooms/${roomId}`);
}

export async function updateRoom(
  roomId: number,
  payload: UpdateRoomInput,
): Promise<Room> {
  return tourRequest<Room>(`/api/tours/rooms/${roomId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteRoom(roomId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/rooms/${roomId}`, {
    method: "DELETE",
  });
}

/**
 * Move one room on the floor plan. The full layout PUT saves the initial
 * placement; this nudges a single room when the host uses the arrow buttons.
 */
export async function nudgeRoomPlacement(
  roomId: number,
  gridX: number,
  gridY: number,
): Promise<void> {
  await tourRequest<null>(`/api/tours/rooms/${roomId}/placement`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gridX, gridY }),
  });
}
