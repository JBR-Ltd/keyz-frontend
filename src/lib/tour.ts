"use client";

// === Types

export interface TourFloor {
  id: number;
  floorNumber: number;
  name: string;
}

export interface TourRoom {
  floorId: number;
  id: number;
  roomName: string;
  roomType: string | null;
}

export interface TourPanorama {
  captureOrder: number;
  id: number;
  imageUrl: string;
  primary: boolean;
  resolution: string | null;
}

/** A floor with its rooms, and each room with its panoramas. */
export interface TourRoomWithViews extends TourRoom {
  panoramas: TourPanorama[];
}

export interface TourFloorWithRooms extends TourFloor {
  rooms: TourRoomWithViews[];
}

// === Helpers

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

async function readList(path: string): Promise<unknown[]> {
  try {
    const response = await fetch(path);

    if (!response.ok) {
      return [];
    }

    const data = unwrap(await response.json().catch(() => null));

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function isFloor(value: unknown): value is TourFloor {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number"
  );
}

function isRoom(value: unknown): value is TourRoom {
  return isFloor(value) && "roomName" in value;
}

function isPanorama(value: unknown): value is TourPanorama {
  return (
    value !== null &&
    typeof value === "object" &&
    "imageUrl" in value &&
    typeof value.imageUrl === "string"
  );
}

// === Requests

/**
 * The whole tour in one shape.
 *
 * Three round trips deep, because the API is one endpoint per level. A tour is a
 * handful of rooms, so the requests are made in parallel per level rather than
 * one at a time.
 */
export async function getPropertyTour(
  propertyId: number,
): Promise<TourFloorWithRooms[]> {
  const floors = (
    await readList(`/api/tours/properties/${propertyId}/floors`)
  ).filter(isFloor);

  if (floors.length === 0) {
    return [];
  }

  const withRooms = await Promise.all(
    floors.map(async (floor) => {
      const rooms = (await readList(`/api/tours/floors/${floor.id}/rooms`)).filter(
        isRoom,
      );

      const roomsWithViews = await Promise.all(
        rooms.map(async (room) => ({
          ...room,
          panoramas: (
            await readList(`/api/tours/rooms/${room.id}/panoramas`)
          ).filter(isPanorama),
        })),
      );

      return { ...floor, rooms: roomsWithViews };
    }),
  );

  // A floor with nothing to look at is not worth a tab
  return withRooms
    .filter((floor) => floor.rooms.some((room) => room.panoramas.length > 0))
    .sort((left, right) => left.floorNumber - right.floorNumber);
}

/** The view a room opens on: the one marked primary, else the first captured. */
export function primaryPanorama(room: TourRoomWithViews): TourPanorama | null {
  if (room.panoramas.length === 0) {
    return null;
  }

  const primary = room.panoramas.find((panorama) => panorama.primary);

  return (
    primary ??
    [...room.panoramas].sort(
      (left, right) => left.captureOrder - right.captureOrder,
    )[0]
  );
}
