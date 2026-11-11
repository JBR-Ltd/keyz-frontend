// src/lib/tourConstants.ts
//
// Room type strings shared across the tour wizard. These strings travel to the
// backend as-is, drive the panorama lookup (TYPE_TO_PANORAMA), and are matched
// against by the 3D floor-plan classifier. Keep them in lockstep with those
// consumers or you get empty rooms with default paint.

import type { SizeBucket } from "@/lib/types/tour";

export const ROOM_TYPES = [
  "Entryway",
  "Parlour",
  "Family Dining",
  "Kitchen",
  "Bedroom",
  "Toilet & Bath",
  "Store",
  "Balcony",
  "Compound",
  "Boys' Quarters",
  "Corridor",
  "Laundry",
  "Office",
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

export const SIZE_OPTIONS: ReadonlyArray<{
  value: SizeBucket;
  label: string;
  hint: string;
}> = [
  { value: "SMALL", label: "Small", hint: "Bathroom, closet" },
  { value: "MEDIUM", label: "Medium", hint: "Bedroom, kitchen" },
  { value: "LARGE", label: "Large", hint: "Parlour, open plan" },
];
