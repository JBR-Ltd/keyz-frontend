// src/lib/tour/roomIcons.ts
//
// One icon map for every tour surface: the room board, the capture progress
// list, the floor-plan review list, the tour overview. Before this existed,
// CaptureProgress, FloorPlanReview and RoomTile each carried their own copy
// of the same map and drifted.

import type { Room } from "@/lib/types/tour";

export const ROOM_TYPE_ICON: Record<string, string> = {
  bed: "🛏️",
  bath: "🛁",
  toilet: "🚽",
  kitchen: "🍳",
  dining: "🍽️",
  dinning: "🍽️",
  parlour: "🛋️",
  living: "🛋️",
  lounge: "🛋️",
  corridor: "🚪",
  hall: "🚪",
  store: "📦",
  closet: "📦",
  laundry: "🧺",
  balcony: "🌿",
  compound: "🌿",
  office: "🗄️",
  study: "🗄️",
};

export function iconForTypeAndName(type: string, name: string): string {
  const t = `${type} ${name}`.toLowerCase();
  const key = Object.keys(ROOM_TYPE_ICON).find((k) => t.includes(k));
  return key ? ROOM_TYPE_ICON[key] : "📐";
}

export function iconForRoom(room: Room): string {
  return iconForTypeAndName(room.roomType, room.roomName);
}
