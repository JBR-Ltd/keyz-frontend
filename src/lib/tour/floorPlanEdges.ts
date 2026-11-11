// src/lib/tour/floorPlanEdges.ts
//
// Where a door REALLY sits on the rendered plan, given where the two rooms
// actually landed. The stored alongWallPercent is a rough human hint; after
// layout runs, the door has to move to the centre of the shared wall or it
// floats in the middle of unrelated wall. This is the port of the demo's
// computeDoorPlacement.
//
// Used by:
//   - floorPlanLayout.ts, when it rebuilds edges after placement
//   - FloorPlan3DView.tsx, when it computes door slots per room
//   - simpleBlueprint, indirectly through the graph's edges

import type { CompassDirection } from "@/lib/types/tour";

export interface PlacedRoom {
  roomId: number;
  gx: number;
  gy: number;
  gw: number;
  gh: number;
  isStaircase: boolean;
}

export interface EdgePlacement {
  direction: CompassDirection;
  alongPercent: number;
}

/**
 * If `from` and `to` are flush on the side given by `direction`, return the
 * centre of the shared segment as a 0-100 percentage along `from`'s wall.
 * Otherwise null. Both rects are in integer grid coordinates; the caller
 * guarantees their widths and heights are at least 1.
 */
export function sharedWallPercent(
  from: PlacedRoom,
  to: PlacedRoom,
  direction: CompassDirection,
): number | null {
  switch (direction) {
    case "E": {
      if (to.gx !== from.gx + from.gw) return null;
      const top = Math.max(from.gy, to.gy);
      const bot = Math.min(from.gy + from.gh, to.gy + to.gh);
      if (bot <= top) return null;
      return clamp((((top + bot) / 2 - from.gy) / from.gh) * 100);
    }
    case "W": {
      if (to.gx + to.gw !== from.gx) return null;
      const top = Math.max(from.gy, to.gy);
      const bot = Math.min(from.gy + from.gh, to.gy + to.gh);
      if (bot <= top) return null;
      return clamp((((top + bot) / 2 - from.gy) / from.gh) * 100);
    }
    case "N": {
      if (to.gy + to.gh !== from.gy) return null;
      const left = Math.max(from.gx, to.gx);
      const right = Math.min(from.gx + from.gw, to.gx + to.gw);
      if (right <= left) return null;
      return clamp((((left + right) / 2 - from.gx) / from.gw) * 100);
    }
    case "S": {
      if (to.gy !== from.gy + from.gh) return null;
      const left = Math.max(from.gx, to.gx);
      const right = Math.min(from.gx + from.gw, to.gx + to.gw);
      if (right <= left) return null;
      return clamp((((left + right) / 2 - from.gx) / from.gw) * 100);
    }
  }
}

/**
 * Try the claimed direction; if the two rooms touch on a different side,
 * use that side instead. If they do not touch anywhere, keep the claimed
 * side at 50%.
 */
export function computeDoorPlacement(
  from: PlacedRoom,
  to: PlacedRoom,
  claimed: CompassDirection,
): EdgePlacement {
  const claimedPct = sharedWallPercent(from, to, claimed);
  if (claimedPct !== null) {
    return { direction: claimed, alongPercent: claimedPct };
  }

  const directions: CompassDirection[] = ["N", "S", "E", "W"];
  for (const d of directions) {
    if (d === claimed) continue;
    const pct = sharedWallPercent(from, to, d);
    if (pct !== null) return { direction: d, alongPercent: pct };
  }

  return { direction: claimed, alongPercent: 50 };
}

/** Same rule on the neighbour's side, for the per-room slot the 3D viewer
 *  needs. The `to` room draws its door on the opposite wall, at the same
 *  along percentage as the shared segment's centre measured on ITS wall. */
export function mirroredEdgePlacement(
  from: PlacedRoom,
  to: PlacedRoom,
  claimed: CompassDirection,
): EdgePlacement {
  const forward = computeDoorPlacement(from, to, claimed);
  const mirrored = sharedWallPercent(to, from, opposite(forward.direction));
  if (mirrored !== null) {
    return { direction: opposite(forward.direction), alongPercent: mirrored };
  }
  return { direction: opposite(forward.direction), alongPercent: forward.alongPercent };
}

export function opposite(d: CompassDirection): CompassDirection {
  switch (d) {
    case "N": return "S";
    case "S": return "N";
    case "E": return "W";
    case "W": return "E";
  }
}

function clamp(p: number): number {
  return Math.max(0, Math.min(100, p));
}
