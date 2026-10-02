// src/lib/tour/__tests__/floorPlanEdges.test.ts
//
// Pure geometry. These assertions carry exact numbers on purpose — they
// are the only place we can state a door's shared-wall position to the
// percentage and check it.
//
// The bug they exist to prevent: the old Java service computed the
// reciprocal door's position as 100 - along. That is only correct when the
// two rooms are the same size and aligned, which is rare. The demo already
// did the right thing; the port puts that behavior back.

import { describe, expect, it } from "vitest";
import {
  computeDoorPlacement,
  mirroredEdgePlacement,
  opposite,
  sharedWallPercent,
  type PlacedRoom,
} from "../floorPlanEdges";

function placed(
  roomId: number,
  gx: number,
  gy: number,
  gw: number,
  gh: number,
): PlacedRoom {
  return { roomId, gx, gy, gw, gh, isStaircase: false };
}

describe("sharedWallPercent", () => {
  it("returns the centre of the shared segment on an East wall", () => {
    // A occupies x 0..2, y 0..2. B is flush against A's east side at x=2.
    // Shared segment on A's east wall: y from 0 to 2, centre at y=1, which
    // is 50% of A's height.
    const a = placed(1, 0, 0, 2, 2);
    const b = placed(2, 2, 0, 2, 2);
    expect(sharedWallPercent(a, b, "E")).toBe(50);
  });

  it("returns the centre for a partial share on an East wall", () => {
    // A is 2 wide, 4 tall. B is 2 wide, 2 tall, flush against A's east side
    // but only covering the top half of A's height.
    // Shared segment: y from 0 to 2, centre at y=1, which is 25% of A's
    // height (4).
    const a = placed(1, 0, 0, 2, 4);
    const b = placed(2, 2, 0, 2, 2);
    expect(sharedWallPercent(a, b, "E")).toBe(25);
  });

  it("returns null when the rooms are not flush on the claimed side", () => {
    const a = placed(1, 0, 0, 2, 2);
    const b = placed(2, 5, 0, 2, 2); // gap of 3 cells
    expect(sharedWallPercent(a, b, "E")).toBeNull();
  });

  it("returns null when the rooms are flush but the segments do not overlap", () => {
    // B is flush east of A, but far enough up that they don't share wall.
    const a = placed(1, 0, 0, 2, 2);
    const b = placed(2, 2, 5, 2, 2);
    expect(sharedWallPercent(a, b, "E")).toBeNull();
  });
});

describe("computeDoorPlacement", () => {
  it("uses the claimed direction when the rooms are flush on that side", () => {
    const a = placed(1, 0, 0, 2, 2);
    const b = placed(2, 0, -2, 2, 2); // north of A
    const result = computeDoorPlacement(a, b, "N");
    expect(result.direction).toBe("N");
    expect(result.alongPercent).toBe(50);
  });

  it("falls back to another shared side when the claimed one is wrong", () => {
    // The data says East, but the two rooms actually touch on B's South
    // (A's North). The service should use North.
    const a = placed(1, 0, 0, 2, 2);
    const b = placed(2, 0, -2, 2, 2); // north of A, so A's north wall is shared
    const result = computeDoorPlacement(a, b, "E");
    expect(result.direction).toBe("N");
  });

  it("falls back to 50% on the claimed side when the rooms do not touch", () => {
    const a = placed(1, 0, 0, 2, 2);
    const b = placed(2, 20, 20, 2, 2); // far away
    const result = computeDoorPlacement(a, b, "S");
    expect(result.direction).toBe("S");
    expect(result.alongPercent).toBe(50);
  });

  // -------------------------------------------------------------------
  // THE REGRESSION THIS MODULE EXISTS FOR
  // -------------------------------------------------------------------

  it("gives each side its own along percent, not 100 minus the other", () => {
    // A is 2 wide, 4 tall. B is 2 wide, 2 tall, flush east of A but only
    // covering the top half of A.
    //
    // A's east wall (y range 0..4):  shared segment y=0..2, centre y=1 → 25%
    // B's west wall (y range 0..2):  shared segment y=0..2, centre y=1 → 50%
    //
    // The old Java logic would produce 25 on A and 100-25=75 on B. That is
    // geometrically wrong and would put B's door in the wrong place.
    const a = placed(1, 0, 0, 2, 4);
    const b = placed(2, 2, 0, 2, 2);

    const fromA = computeDoorPlacement(a, b, "E");
    expect(fromA.direction).toBe("E");
    expect(fromA.alongPercent).toBe(25);

    const fromB = mirroredEdgePlacement(a, b, "E");
    expect(fromB.direction).toBe("W");
    expect(fromB.alongPercent).toBe(50);

    // The two percentages are NOT 100 minus each other.
    expect(fromB.alongPercent).not.toBe(100 - fromA.alongPercent);
  });
});

describe("mirroredEdgePlacement", () => {
  it("returns the opposite wall on the target room's side", () => {
    const a = placed(1, 0, 0, 2, 2);
    const b = placed(2, 2, 0, 2, 2);
    const m = mirroredEdgePlacement(a, b, "E");
    expect(m.direction).toBe("W");
    expect(m.alongPercent).toBe(50);
  });

  it("returns W when A claims E even if the doors ended up non-flush", () => {
    const a = placed(1, 0, 0, 2, 2);
    const b = placed(2, 50, 50, 2, 2);
    const m = mirroredEdgePlacement(a, b, "E");
    expect(m.direction).toBe("W");
    expect(m.alongPercent).toBe(50);
  });
});

describe("opposite", () => {
  it("is involutive", () => {
    expect(opposite(opposite("N"))).toBe("N");
    expect(opposite(opposite("E"))).toBe("E");
  });

  it("maps each direction to its counterpart", () => {
    expect(opposite("N")).toBe("S");
    expect(opposite("S")).toBe("N");
    expect(opposite("E")).toBe("W");
    expect(opposite("W")).toBe("E");
  });
});
