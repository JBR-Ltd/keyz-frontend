interface ApiEnvelope<TData> {
  success: boolean;
  message: string;
  data: TData;
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    "message" in value
  );
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function parseEnvelope<TData>(response: Response): Promise<ApiEnvelope<TData>> {
  const data: unknown = await response.json().catch(() => null);

  if (!isApiEnvelope(data)) {
    throw new Error("Unexpected response from server");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Request failed");
  }

  return data as ApiEnvelope<TData>;
}

import type { Direction, Floor, Panorama, Room } from "@/lib/types/tour";

export async function createFloor(
  propertyId: number,
  payload: { floorNumber: number; name: string },
  token: string,
): Promise<Floor> {
  const response = await fetch(`/api/tours/properties/${propertyId}/floors`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });

  const envelope = await parseEnvelope<Floor>(response);
  return envelope.data;
}

export async function createRoom(
  floorId: number,
  payload: { roomName: string; roomType: string },
  token: string,
): Promise<Room> {
  const response = await fetch(`/api/tours/floors/${floorId}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });

  const envelope = await parseEnvelope<Room>(response);
  return envelope.data;
}

export async function connectRooms(
  payload: { fromRoomId: number; toRoomId: number; direction: Direction },
  token: string,
): Promise<void> {
  const response = await fetch(`/api/tours/rooms/connections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });

  await parseEnvelope<null>(response);
}

export async function uploadPanorama(
  roomId: number,
  file: File,
  token: string,
): Promise<Panorama> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/tours/rooms/${roomId}/panoramas`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  const envelope = await parseEnvelope<Panorama>(response);
  return envelope.data;
}