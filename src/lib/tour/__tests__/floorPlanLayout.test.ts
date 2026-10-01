// src/lib/tour/__tests__/floorPlanLayout.test.ts
//
// Invariants for the layout port. These do NOT assert specific coordinates.
// The algorithm has tuned heuristics, and two valid layouts of the same
// floor can differ. What the tests assert is the set of properties that
// must hold whatever the algorithm's internals do:
//
//   * every placed room has integer grid coordinates and integer sizes
//   * no two placed rooms overlap
//   * the room with the outside entry ends up on that wall of the plan
//   * room size derives from sizeBucket, with the corridor and bathroom
//     rules from the demo
//   * rooms the algorithm cannot reach end up in unplacedRoomIds
//   * every interior door produces exactly one edge; fixed and exterior
//     doors produce none

import { describe, expect, it } from "vitest";
import { computeLayout } from "@/lib/tour/floorPlanLayout";
import type {
  CompassDirection,
  Door,
  Room,
  SizeBucket,
  WallSide,
} from "@/lib/types/tour";

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const WALL_TO_COMPASS: Record<WallSide, CompassDirection> = {
  TOP: "N",
  RIGHT: "E",
  BOTTOM: "S",
  LEFT: "W",
};

function makeDoor(
  id: number,
  roomId: number,
  overrides: Partial<Door> = {},
): Door {
  const wallSide = overrides.wallSide ?? null;
  return {
    id,
    roomId,
    roomName: "",
    panoramaId: null,
    positionYawDeg: 0,
    positionPitchDeg: 0,
    wallSide,
    compassDirection:
      overrides.compassDirection ??
      (wallSide ? WALL_TO_COMPASS[wallSide] : null),
    alongWallPercent: overrides.alongWallPercent ?? 50,
    x: null,
    y: null,
    kind: overrides.kind ?? "DOOR",
    isFixed: overrides.isFixed ?? false,
    leadsToRoomId: overrides.leadsToRoomId ?? null,
    leadsToRoomName: null,
    leadsToLabel: overrides.leadsToLabel ?? null,
    isReciprocalOf: null,
    reciprocalDoorId: null,
    reciprocalDoorRoomName: null,
  };
}

interface RoomInput {
  id: number;
  roomName: string;
  roomType: string;
  sizeBucket?: SizeBucket;
  doors?: Door[];
}

function makeRoom(input: RoomInput): Room {
  return {
    id: input.id,
    floorId: 1,
    roomName: input.roomName,
    roomType: input.roomType,
    sizeBucket: input.sizeBucket ?? "MEDIUM",
    sizeEstimateSqft: null,
    status: "ready",
    fovAngle: 0,
    panorama: null,
    panoramas: [],
    doors: input.doors ?? [],
    staircases: [],
    floorPlanPosition: null,
  };
}

function fixedEntry(roomId: number, wall: WallSide, doorId = 9001): Door {
  return makeDoor(doorId, roomId, {
    wallSide: wall,
    isFixed: true,
    leadsToLabel: "Outside / Compound",
  });
}

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

interface Placement {
  roomId: number;
  gridX: number | null;
  gridY: number | null;
  widthUnits: number | null;
  heightUnits: number | null;
  isPlaced: boolean;
}

function assertAllInteger(placements: Placement[]): void {
  for (const p of placements) {
    expect(Number.isInteger(p.gridX)).toBe(true);
    expect(Number.isInteger(p.gridY)).toBe(true);
    expect(Number.isInteger(p.widthUnits)).toBe(true);
    expect(Number.isInteger(p.heightUnits)).toBe(true);
  }
}

function assertNoOverlaps(placements: Placement[]): void {
  const placed = placements.filter((p) => p.isPlaced);
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      const overlap =
        a.gridX! < b.gridX! + b.widthUnits! &&
        a.gridX! + a.widthUnits! > b.gridX! &&
        a.gridY! < b.gridY! + b.heightUnits! &&
        a.gridY! + a.heightUnits! > b.gridY!;
      expect(overlap, `rooms ${a.roomId} and ${b.roomId} overlap`).toBe(false);
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("computeLayout", () => {
  it("returns an empty result for an empty floor", () => {
    const result = computeLayout([]);
    expect(result.placements).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.unplacedRoomIds).toEqual([]);
  });

  it("places a single room with a fixed entry at integer coordinates", () => {
    const room = makeRoom({
      id: 1,
      roomName: "Master Bedroom",
      roomType: "Bedroom",
      sizeBucket: "MEDIUM",
      doors: [fixedEntry(1, "BOTTOM")],
    });
    const result = computeLayout([room]);

    expect(result.placements).toHaveLength(1);
    const p = result.placements[0];
    expect(p.roomId).toBe(1);
    expect(p.isPlaced).toBe(true);
    expect(p.widthUnits).toBe(2);
    expect(p.heightUnits).toBe(2);
    assertAllInteger(result.placements);
    expect(result.unplacedRoomIds).toEqual([]);
  });

  it("keeps the room with a bottom-facing entry at the bottom of the plan", () => {
    const root = makeRoom({
      id: 1,
      roomName: "Parlour",
      roomType: "Parlour",
      sizeBucket: "MEDIUM",
      doors: [
        fixedEntry(1, "BOTTOM"),
        makeDoor(10, 1, { wallSide: "TOP", leadsToRoomId: 2 }),
      ],
    });
    const other = makeRoom({
      id: 2,
      roomName: "Kitchen",
      roomType: "Kitchen",
      sizeBucket: "MEDIUM",
      doors: [makeDoor(11, 2, { wallSide: "BOTTOM", leadsToRoomId: 1 })],
    });

    const result = computeLayout([root, other]);
    const rootPlacement = result.placements.find((p) => p.roomId === 1)!;
    const maxBottom = Math.max(
      ...result.placements
        .filter((p) => p.isPlaced)
        .map((p) => p.gridY! + p.heightUnits!),
    );
    expect(rootPlacement.gridY! + rootPlacement.heightUnits!).toBe(maxBottom);
  });

  it("places two linked rooms without overlaps", () => {
    const root = makeRoom({
      id: 1,
      roomName: "Parlour",
      roomType: "Parlour",
      sizeBucket: "MEDIUM",
      doors: [
        fixedEntry(1, "BOTTOM"),
        makeDoor(10, 1, { wallSide: "TOP", leadsToRoomId: 2 }),
      ],
    });
    const kitchen = makeRoom({
      id: 2,
      roomName: "Kitchen",
      roomType: "Kitchen",
      sizeBucket: "MEDIUM",
      doors: [makeDoor(11, 2, { wallSide: "BOTTOM", leadsToRoomId: 1 })],
    });

    const result = computeLayout([root, kitchen]);
    expect(result.placements).toHaveLength(2);
    assertAllInteger(result.placements);
    assertNoOverlaps(result.placements);
  });

  it("derives room size from sizeBucket", () => {
    const small = makeRoom({
      id: 1,
      roomName: "Guest Closet",
      roomType: "Store",
      sizeBucket: "SMALL",
      doors: [fixedEntry(1, "BOTTOM")],
    });
    const large = makeRoom({
      id: 2,
      roomName: "Open Plan Living",
      roomType: "Parlour",
      sizeBucket: "LARGE",
      doors: [],
    });

    const r1 = computeLayout([small]);
    expect(r1.placements[0].widthUnits).toBe(1);
    expect(r1.placements[0].heightUnits).toBe(1);

    const r2 = computeLayout([large]);
    expect(r2.placements[0].widthUnits).toBe(3);
    expect(r2.placements[0].heightUnits).toBe(3);
  });

  it("forces a bathroom to a single cell regardless of sizeBucket", () => {
    const bath = makeRoom({
      id: 1,
      roomName: "Guest Bathroom",
      roomType: "Toilet & Bath",
      sizeBucket: "LARGE",
      doors: [fixedEntry(1, "BOTTOM")],
    });
    const result = computeLayout([bath]);
    expect(result.placements[0].widthUnits).toBe(1);
    expect(result.placements[0].heightUnits).toBe(1);
  });

  it("makes a corridor wide when its exits are on N/S walls", () => {
    const corridor = makeRoom({
      id: 1,
      roomName: "Main Passage",
      roomType: "Corridor",
      sizeBucket: "MEDIUM",
      doors: [
        fixedEntry(1, "BOTTOM"),
        makeDoor(20, 1, { wallSide: "TOP", leadsToRoomId: 2 }),
        makeDoor(21, 1, { wallSide: "BOTTOM", leadsToRoomId: 3 }),
      ],
    });
    const neighborA = makeRoom({
      id: 2,
      roomName: "A",
      roomType: "Bedroom",
      doors: [makeDoor(22, 2, { wallSide: "BOTTOM", leadsToRoomId: 1 })],
    });
    const neighborB = makeRoom({
      id: 3,
      roomName: "B",
      roomType: "Bedroom",
      doors: [makeDoor(23, 3, { wallSide: "TOP", leadsToRoomId: 1 })],
    });

    const result = computeLayout([corridor, neighborA, neighborB]);
    const placed = result.placements.find((p) => p.roomId === 1)!;
    expect(placed.widthUnits!).toBeGreaterThan(placed.heightUnits!);
  });

  it("makes a corridor tall when its exits are on E/W walls", () => {
    const corridor = makeRoom({
      id: 1,
      roomName: "Side Passage",
      roomType: "Corridor",
      sizeBucket: "MEDIUM",
      doors: [
        fixedEntry(1, "BOTTOM"),
        makeDoor(30, 1, { wallSide: "LEFT", leadsToRoomId: 2 }),
        makeDoor(31, 1, { wallSide: "RIGHT", leadsToRoomId: 3 }),
      ],
    });
    const neighborA = makeRoom({
      id: 2,
      roomName: "A",
      roomType: "Bedroom",
      doors: [makeDoor(32, 2, { wallSide: "RIGHT", leadsToRoomId: 1 })],
    });
    const neighborB = makeRoom({
      id: 3,
      roomName: "B",
      roomType: "Bedroom",
      doors: [makeDoor(33, 3, { wallSide: "LEFT", leadsToRoomId: 1 })],
    });

    const result = computeLayout([corridor, neighborA, neighborB]);
    const placed = result.placements.find((p) => p.roomId === 1)!;
    expect(placed.heightUnits!).toBeGreaterThan(placed.widthUnits!);
  });

  it("lists a disconnected room in unplacedRoomIds but still gives it a slot", () => {
    const root = makeRoom({
      id: 1,
      roomName: "Parlour",
      roomType: "Parlour",
      doors: [fixedEntry(1, "BOTTOM")],
    });
    const orphan = makeRoom({
      id: 2,
      roomName: "Detached Shed",
      roomType: "Store",
      doors: [],
    });

    const result = computeLayout([root, orphan]);
    expect(result.unplacedRoomIds).toContain(2);
    const orphanPlacement = result.placements.find((p) => p.roomId === 2)!;
    expect(orphanPlacement.isPlaced).toBe(false);
    expect(Number.isInteger(orphanPlacement.gridX)).toBe(true);
  });

  it("emits exactly one edge per interior door", () => {
    const a = makeRoom({
      id: 1,
      roomName: "A",
      roomType: "Bedroom",
      doors: [
        fixedEntry(1, "BOTTOM"),
        makeDoor(40, 1, { wallSide: "TOP", leadsToRoomId: 2 }),
      ],
    });
    const b = makeRoom({
      id: 2,
      roomName: "B",
      roomType: "Bedroom",
      doors: [makeDoor(41, 2, { wallSide: "BOTTOM", leadsToRoomId: 1 })],
    });

    const result = computeLayout([a, b]);
    expect(result.edges).toHaveLength(1);
    const edge = result.edges[0];
    expect(edge.fromRoomId).toBe(1);
    expect(edge.toRoomId).toBe(2);
    expect(edge.alongWallPercent).toBeGreaterThanOrEqual(0);
    expect(edge.alongWallPercent).toBeLessThanOrEqual(100);
  });

  it("never emits an edge for a fixed door or a labeled exterior door", () => {
    const a = makeRoom({
      id: 1,
      roomName: "A",
      roomType: "Bedroom",
      doors: [
        fixedEntry(1, "BOTTOM"),
        makeDoor(50, 1, { wallSide: "LEFT", leadsToLabel: "Outside" }),
      ],
    });
    const result = computeLayout([a]);
    expect(result.edges).toHaveLength(0);
  });
});
