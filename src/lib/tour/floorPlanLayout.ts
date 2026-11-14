// src/lib/tour/floorPlanLayout.ts
//
// Port of the demo's utils/floorPlanGenerator.ts. Given a floor's rooms and
// their stored doors, place every room on an integer grid so the blueprint
// and 3D scene have something to draw, and every connecting door sits on the
// shared wall.
//
// The Java generator was deleted for this: 600 lines of tuned heuristics are
// easier to keep faithful in one TypeScript file than to re-tune in Java.
//
// The output is:
//   placements       — one per room, including unplaced ones (isPlaced=false)
//   edges            — one per door that leads to a room on the same floor,
//                      recomputed to the shared wall after the layout settles
//   unplacedRoomIds  — rooms with no path back to the anchor; the wizard
//                      shows them in a warning banner but does not block
//
// Everything is integer grid cells. Fractional sizes from the old Java
// generator (0.7, 1.0, 1.4) never rounded cleanly and could overlap.

import type {
  CompassDirection,
  Door,
  DoorKind,
  Room,
  SizeBucket,
  TourPlacement,
  WallSide,
} from "@/lib/types/tour";
import {
  computeDoorPlacement,
  type PlacedRoom,
} from "./floorPlanEdges";

const SIZE_TO_CELLS: Record<SizeBucket, number> = {
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
};

const WALL_TO_COMPASS: Record<WallSide, CompassDirection> = {
  TOP: "N",
  RIGHT: "E",
  BOTTOM: "S",
  LEFT: "W",
};

export interface LayoutEdge {
  doorId: number;
  fromRoomId: number;
  toRoomId: number;
  compassDirection: CompassDirection;
  alongWallPercent: number;
  kind: DoorKind;
}

export interface LayoutResult {
  placements: TourPlacement[];
  edges: LayoutEdge[];
  unplacedRoomIds: number[];
}

// ---------------------------------------------------------------------------
// Room classification and footprints
// ---------------------------------------------------------------------------

function hasWord(haystack: string, word: string): boolean {
  return new RegExp(`\\b${word}`).test(haystack);
}

function classifyRoom(name: string, type: string): {
  isCorridor: boolean;
  isAlwaysTiny: boolean;
} {
  const t = type.toLowerCase();
  const s = `${name} ${type}`.toLowerCase();
  const isCorridor =
    t === "corridor" ||
    s.includes("corridor") ||
    s.includes("hall") ||
    s.includes("passage");
  const isAlwaysTiny =
    !isCorridor && (hasWord(s, "bath") || hasWord(s, "toilet"));
  return { isCorridor, isAlwaysTiny };
}

function directionOf(door: Door): CompassDirection {
  if (door.compassDirection) return door.compassDirection;
  if (door.wallSide) return WALL_TO_COMPASS[door.wallSide];
  return "S";
}

function corridorFootprint(room: Room): { gw: number; gh: number } {
  let nsDoors = 0;
  let ewDoors = 0;
  for (const door of room.doors ?? []) {
    if (door.isFixed || door.leadsToRoomId === null) continue;
    const dir = directionOf(door);
    if (dir === "N" || dir === "S") nsDoors++;
    else ewDoors++;
  }
  const horizontal = nsDoors >= ewDoors;
  const size = room.sizeBucket ?? "MEDIUM";
  const n = SIZE_TO_CELLS[size] + 1;
  return horizontal ? { gw: n, gh: 1 } : { gw: 1, gh: n };
}

function footprintFor(room: Room): { gw: number; gh: number } {
  const { isCorridor, isAlwaysTiny } = classifyRoom(room.roomName, room.roomType);
  if (isCorridor) return corridorFootprint(room);
  if (isAlwaysTiny) return { gw: 1, gh: 1 };
  const n = SIZE_TO_CELLS[room.sizeBucket ?? "MEDIUM"];
  return { gw: n, gh: n };
}

// ---------------------------------------------------------------------------
// Neighbour graph
// ---------------------------------------------------------------------------

interface NeighborEdge {
  toId: number;
  direction: CompassDirection;
  alongPercent: number;
}

function buildNeighborGraph(rooms: Room[]): Map<number, NeighborEdge[]> {
  const byId = new Map<number, Room>();
  for (const r of rooms) byId.set(r.id, r);

  const graph = new Map<number, NeighborEdge[]>();
  for (const r of rooms) graph.set(r.id, []);

  for (const room of rooms) {
    for (const door of room.doors ?? []) {
      if (door.leadsToRoomId === null) continue;
      if (!byId.has(door.leadsToRoomId)) continue;
      graph.get(room.id)!.push({
        toId: door.leadsToRoomId,
        direction: directionOf(door),
        alongPercent: door.alongWallPercent ?? 50,
      });
    }
  }
  return graph;
}

function pickRootId(rooms: Room[]): number | null {
  const withOutsideEntry = rooms.find((room) =>
    (room.doors ?? []).some((d) => d.isFixed && d.leadsToRoomId === null),
  );
  if (withOutsideEntry) return withOutsideEntry.id;
  return rooms[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

interface Rect {
  gx: number;
  gy: number;
  gw: number;
  gh: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.gx < b.gx + b.gw &&
    a.gx + a.gw > b.gx &&
    a.gy < b.gy + b.gh &&
    a.gy + a.gh > b.gy
  );
}

function canPlaceRect(
  r: Rect,
  placed: Map<number, PlacedRoom>,
  excludeId?: number,
): boolean {
  for (const [id, p] of placed) {
    if (id === excludeId) continue;
    if (rectsOverlap(r, p)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Greedy priority placement
// ---------------------------------------------------------------------------

interface PlacedNeighbor {
  neighbor: PlacedRoom;
  direction: CompassDirection;
  alongPercent: number;
}

function computeIdealPosition(
  fp: { gw: number; gh: number },
  constraints: PlacedNeighbor[],
): { gx: number; gy: number } | null {
  if (constraints.length === 0) return null;

  let gx: number | null = null;
  let gy: number | null = null;

  for (const c of constraints) {
    const N = c.neighbor;
    if (c.direction === "N" || c.direction === "S") {
      if (gy === null) {
        gy = c.direction === "N" ? N.gy + N.gh : N.gy - fp.gh;
      }
    } else {
      if (gx === null) {
        gx = c.direction === "W" ? N.gx + N.gw : N.gx - fp.gw;
      }
    }
  }

  const primary = constraints[0];
  const N0 = primary.neighbor;
  const p = Math.max(0, Math.min(100, primary.alongPercent)) / 100;

  if (gx === null) {
    gx = Math.round(
      primary.direction === "N" || primary.direction === "S"
        ? N0.gx + N0.gw / 2 - p * fp.gw
        : N0.gx + N0.gw / 2 - fp.gw / 2,
    );
  }
  if (gy === null) {
    gy = Math.round(
      primary.direction === "E" || primary.direction === "W"
        ? N0.gy + N0.gh / 2 - p * fp.gh
        : N0.gy + N0.gh / 2 - fp.gh / 2,
    );
  }

  return { gx, gy };
}

function placeRoomsGreedy(
  rootId: number,
  graph: Map<number, NeighborEdge[]>,
  footprints: Map<number, { gw: number; gh: number }>,
): { placed: Map<number, PlacedRoom>; unplacedIds: number[] } {
  const placed = new Map<number, PlacedRoom>();
  const rootFp = footprints.get(rootId)!;
  placed.set(rootId, { roomId: rootId, gx: 0, gy: 0, ...rootFp, isStaircase: false });

  const unplaced = new Set<number>();
  graph.forEach((_, id) => {
    if (id !== rootId) unplaced.add(id);
  });

  const unplacedIds: number[] = [];

  let safety = 0;
  while (unplaced.size > 0 && safety++ < 2000) {
    let bestId: number | null = null;
    let bestCount = -1;
    for (const id of unplaced) {
      let count = 0;
      for (const edge of graph.get(id) ?? []) {
        if (placed.has(edge.toId)) count++;
      }
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
      }
    }
    if (bestId === null) break;

    if (bestCount === 0) {
      unplacedIds.push(bestId);
      unplaced.delete(bestId);
      continue;
    }

    const roomId = bestId;
    const fp = footprints.get(roomId)!;
    const constraints: PlacedNeighbor[] = [];
    for (const edge of graph.get(roomId) ?? []) {
      const n = placed.get(edge.toId);
      if (n) {
        constraints.push({
          neighbor: n,
          direction: edge.direction,
          alongPercent: edge.alongPercent,
        });
      }
    }

    const ideal = computeIdealPosition(fp, constraints);
    if (!ideal) {
      unplacedIds.push(roomId);
      unplaced.delete(roomId);
      continue;
    }

    const candidates: { gx: number; gy: number }[] = [ideal];
    const primaryAxis: "x" | "y" =
      constraints[0].direction === "N" || constraints[0].direction === "S"
        ? "y"
        : "x";

    const MAX_SLIDE = 24;
    for (let d = 1; d <= MAX_SLIDE; d++) {
      if (primaryAxis === "y") {
        candidates.push({ gx: ideal.gx + d, gy: ideal.gy });
        candidates.push({ gx: ideal.gx - d, gy: ideal.gy });
      } else {
        candidates.push({ gx: ideal.gx, gy: ideal.gy + d });
        candidates.push({ gx: ideal.gx, gy: ideal.gy - d });
      }
    }
    for (let d = 1; d <= MAX_SLIDE; d++) {
      candidates.push({ gx: ideal.gx + d, gy: ideal.gy });
      candidates.push({ gx: ideal.gx - d, gy: ideal.gy });
      candidates.push({ gx: ideal.gx, gy: ideal.gy + d });
      candidates.push({ gx: ideal.gx, gy: ideal.gy - d });
    }
    for (let d = 1; d <= MAX_SLIDE; d++) {
      candidates.push({ gx: ideal.gx + d, gy: ideal.gy + d });
      candidates.push({ gx: ideal.gx - d, gy: ideal.gy + d });
      candidates.push({ gx: ideal.gx + d, gy: ideal.gy - d });
      candidates.push({ gx: ideal.gx - d, gy: ideal.gy - d });
    }

    let placedHere = false;
    for (const c of candidates) {
      const rect: Rect = { gx: c.gx, gy: c.gy, gw: fp.gw, gh: fp.gh };
      if (canPlaceRect(rect, placed)) {
        placed.set(roomId, {
          roomId,
          gx: c.gx,
          gy: c.gy,
          ...fp,
          isStaircase: false,
        });
        unplaced.delete(roomId);
        placedHere = true;
        break;
      }
    }

    if (!placedHere) {
      unplacedIds.push(roomId);
      unplaced.delete(roomId);
    }
  }

  for (const id of unplaced) unplacedIds.push(id);
  return { placed, unplacedIds };
}

// ---------------------------------------------------------------------------
// Spanning tree + subtree motion
// ---------------------------------------------------------------------------

interface ParentLink {
  parentId: number;
  direction: CompassDirection;
}

interface ChildLink {
  childId: number;
  direction: CompassDirection;
  alongPercent: number;
}

function buildSpanningTree(
  rootId: number,
  graph: Map<number, NeighborEdge[]>,
): {
  parentOf: Map<number, ParentLink>;
  childrenOf: Map<number, ChildLink[]>;
  visited: Set<number>;
} {
  const parentOf = new Map<number, ParentLink>();
  const childrenOf = new Map<number, ChildLink[]>();
  const visited = new Set<number>([rootId]);
  const queue: number[] = [rootId];

  while (queue.length > 0) {
    const curId = queue.shift()!;
    const neighbors = (graph.get(curId) ?? [])
      .slice()
      .sort((a, b) => a.alongPercent - b.alongPercent);

    for (const edge of neighbors) {
      if (edge.toId === curId || visited.has(edge.toId)) continue;
      visited.add(edge.toId);
      parentOf.set(edge.toId, { parentId: curId, direction: edge.direction });
      const list = childrenOf.get(curId) ?? [];
      list.push({
        childId: edge.toId,
        direction: edge.direction,
        alongPercent: edge.alongPercent,
      });
      childrenOf.set(curId, list);
      queue.push(edge.toId);
    }
  }

  return { parentOf, childrenOf, visited };
}

function getSubtreeIds(
  rootId: number,
  childrenOf: Map<number, ChildLink[]>,
): number[] {
  const result: number[] = [rootId];
  const queue = [rootId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const child of childrenOf.get(cur) ?? []) {
      result.push(child.childId);
      queue.push(child.childId);
    }
  }
  return result;
}

function canPlaceSubtreeAt(
  subtreeIds: number[],
  originals: Map<number, PlacedRoom>,
  dx: number,
  dy: number,
  placed: Map<number, PlacedRoom>,
): boolean {
  const subtreeSet = new Set(subtreeIds);
  for (const sid of subtreeIds) {
    const orig = originals.get(sid)!;
    const test: PlacedRoom = { ...orig, gx: orig.gx + dx, gy: orig.gy + dy };
    for (const [otherId, otherRect] of placed) {
      if (subtreeSet.has(otherId)) continue;
      if (rectsOverlap(test, otherRect)) return false;
    }
  }
  return true;
}

function tryMoveSubtree(
  id: number,
  dx: number,
  dy: number,
  placed: Map<number, PlacedRoom>,
  childrenOf: Map<number, ChildLink[]>,
): boolean {
  if (dx === 0 && dy === 0) return false;
  const subtreeIds = getSubtreeIds(id, childrenOf);
  const originals = new Map<number, PlacedRoom>();
  subtreeIds.forEach((sid) => originals.set(sid, { ...placed.get(sid)! }));
  if (!canPlaceSubtreeAt(subtreeIds, originals, dx, dy, placed)) return false;
  subtreeIds.forEach((sid) => {
    const orig = originals.get(sid)!;
    placed.set(sid, { ...orig, gx: orig.gx + dx, gy: orig.gy + dy });
  });
  return true;
}

function findFirstOverlap(
  ids: number[],
  placed: Map<number, PlacedRoom>,
): [number, number] | null {
  for (let i = 0; i < ids.length; i++) {
    const a = placed.get(ids[i])!;
    for (let j = i + 1; j < ids.length; j++) {
      const b = placed.get(ids[j])!;
      if (rectsOverlap(a, b)) return [ids[i], ids[j]];
    }
  }
  return null;
}

function resolveOverlaps(
  rootId: number,
  placed: Map<number, PlacedRoom>,
  childrenOf: Map<number, ChildLink[]>,
  parentOf: Map<number, ParentLink>,
): void {
  const allIds = Array.from(placed.keys());
  const MAX_PASSES = 600;
  const SLIDE_RANGE = 48;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const conflict = findFirstOverlap(allIds, placed);
    if (!conflict) break;
    const [aId, bId] = conflict;

    const order: number[] = [];
    if (aId === rootId) order.push(bId);
    else if (bId === rootId) order.push(aId);
    else {
      const aSize = getSubtreeIds(aId, childrenOf).length;
      const bSize = getSubtreeIds(bId, childrenOf).length;
      if (aSize <= bSize) order.push(aId, bId);
      else order.push(bId, aId);
    }

    let moved = false;
    for (const moveId of order) {
      const info = parentOf.get(moveId);
      const freeAxis: "x" | "y" =
        !info || info.direction === "N" || info.direction === "S" ? "x" : "y";

      for (let mag = 1; mag <= SLIDE_RANGE && !moved; mag++) {
        for (const sign of [1, -1]) {
          const delta = mag * sign;
          const dx = freeAxis === "x" ? delta : 0;
          const dy = freeAxis === "y" ? delta : 0;
          if (tryMoveSubtree(moveId, dx, dy, placed, childrenOf)) {
            moved = true;
            break;
          }
        }
      }
      if (moved) break;

      if (info) {
        let dx = 1;
        let dy = 0;
        switch (info.direction) {
          case "N": dx = 0; dy = -1; break;
          case "S": dx = 0; dy = 1; break;
          case "W": dx = -1; dy = 0; break;
          case "E": dx = 1; dy = 0; break;
        }
        if (tryMoveSubtree(moveId, dx, dy, placed, childrenOf)) {
          moved = true;
          break;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Extra edges + gap closing + relaxation
// ---------------------------------------------------------------------------

interface ExtraEdge {
  aId: number;
  bId: number;
  direction: CompassDirection;
  alongPercent: number;
}

function collectExtraEdges(
  graph: Map<number, NeighborEdge[]>,
  parentOf: Map<number, ParentLink>,
  visited: Set<number>,
): ExtraEdge[] {
  const seen = new Set<string>();
  const result: ExtraEdge[] = [];
  graph.forEach((edges, aId) => {
    if (!visited.has(aId)) return;
    edges.forEach((edge) => {
      const bId = edge.toId;
      if (!visited.has(bId)) return;
      const parentOfB = parentOf.get(bId);
      const parentOfA = parentOf.get(aId);
      const isTreeEdge =
        (parentOfB && parentOfB.parentId === aId) ||
        (parentOfA && parentOfA.parentId === bId);
      if (isTreeEdge) return;
      const key = aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({
        aId,
        bId,
        direction: edge.direction,
        alongPercent: edge.alongPercent,
      });
    });
  });
  return result;
}

function closeExtraGaps(
  extraEdges: ExtraEdge[],
  placed: Map<number, PlacedRoom>,
  childrenOf: Map<number, ChildLink[]>,
): boolean {
  let anyMoved = false;

  for (const { aId, bId, direction, alongPercent } of extraEdges) {
    const a = placed.get(aId);
    const b = placed.get(bId);
    if (!a || !b) continue;

    const p = Math.max(0, Math.min(100, alongPercent)) / 100;
    let targetGx: number;
    let targetGy: number;
    if (direction === "N" || direction === "S") {
      targetGx = Math.round(a.gx + p * a.gw - b.gw / 2);
      targetGy = direction === "N" ? a.gy - b.gh : a.gy + a.gh;
    } else {
      targetGy = Math.round(a.gy + p * a.gh - b.gh / 2);
      targetGx = direction === "W" ? a.gx - b.gw : a.gx + a.gw;
    }
    const dx = targetGx - b.gx;
    const dy = targetGy - b.gy;
    if (dx === 0 && dy === 0) continue;

    if (tryMoveSubtree(bId, dx, dy, placed, childrenOf)) {
      anyMoved = true;
      continue;
    }

    const primaryAxis: "x" | "y" =
      direction === "N" || direction === "S" ? "y" : "x";
    const primaryDelta = primaryAxis === "y" ? dy : dx;
    if (primaryDelta !== 0) {
      const step = primaryDelta > 0 ? 1 : -1;
      let movedAny = false;
      for (let i = 0; i < Math.abs(primaryDelta); i++) {
        const sx = primaryAxis === "x" ? step : 0;
        const sy = primaryAxis === "y" ? step : 0;
        if (!tryMoveSubtree(bId, sx, sy, placed, childrenOf)) break;
        movedAny = true;
      }
      if (movedAny) {
        anyMoved = true;
        continue;
      }
    }
  }

  return anyMoved;
}

function pullFlushToTreeParents(
  rootId: number,
  placed: Map<number, PlacedRoom>,
  parentOf: Map<number, ParentLink>,
  childrenOf: Map<number, ChildLink[]>,
): boolean {
  const order: number[] = [];
  const queue: number[] = [rootId];
  const seen = new Set<number>([rootId]);
  while (queue.length > 0) {
    const cur = queue.shift()!;
    order.push(cur);
    for (const c of childrenOf.get(cur) ?? []) {
      if (!seen.has(c.childId)) {
        seen.add(c.childId);
        queue.push(c.childId);
      }
    }
  }

  let moved = false;
  for (const roomId of order) {
    if (roomId === rootId) continue;
    const link = parentOf.get(roomId);
    if (!link) continue;
    const parent = placed.get(link.parentId);
    const room = placed.get(roomId);
    if (!parent || !room) continue;

    let dx = 0;
    let dy = 0;
    switch (link.direction) {
      case "N": dy = parent.gy - (room.gy + room.gh); break;
      case "S": dy = parent.gy + parent.gh - room.gy; break;
      case "W": dx = parent.gx - (room.gx + room.gw); break;
      case "E": dx = parent.gx + parent.gw - room.gx; break;
    }

    if (dx === 0 && dy === 0) continue;
    if (tryMoveSubtree(roomId, dx, dy, placed, childrenOf)) {
      moved = true;
    } else if (link.direction === "N" || link.direction === "S") {
      if (dy !== 0 && tryMoveSubtree(roomId, 0, dy, placed, childrenOf)) moved = true;
    } else {
      if (dx !== 0 && tryMoveSubtree(roomId, dx, 0, placed, childrenOf)) moved = true;
    }
  }

  return moved;
}

function relaxLayout(
  rootId: number,
  placed: Map<number, PlacedRoom>,
  extraEdges: ExtraEdge[],
  parentOf: Map<number, ParentLink>,
  childrenOf: Map<number, ChildLink[]>,
): void {
  const MAX_ITER = 16;
  for (let i = 0; i < MAX_ITER; i++) {
    let changed = false;
    if (pullFlushToTreeParents(rootId, placed, parentOf, childrenOf)) changed = true;
    if (closeExtraGaps(extraEdges, placed, childrenOf)) changed = true;
    if (!changed) break;
  }
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function computeLayout(rooms: Room[]): LayoutResult {
  if (rooms.length === 0) {
    return { placements: [], edges: [], unplacedRoomIds: [] };
  }

  const rootId = pickRootId(rooms);
  if (rootId === null) {
    return {
      placements: [],
      edges: [],
      unplacedRoomIds: rooms.map((r) => r.id),
    };
  }

  const footprints = new Map<number, { gw: number; gh: number }>();
  for (const r of rooms) footprints.set(r.id, footprintFor(r));

  const graph = buildNeighborGraph(rooms);
  const { parentOf, childrenOf, visited } = buildSpanningTree(rootId, graph);

  const { placed, unplacedIds: disconnected } = placeRoomsGreedy(rootId, graph, footprints);

  resolveOverlaps(rootId, placed, childrenOf, parentOf);

  const extraEdges = collectExtraEdges(graph, parentOf, visited);
  relaxLayout(rootId, placed, extraEdges, parentOf, childrenOf);

  // Disconnected rooms stack off to one side.
  const unplacedRoomIds: number[] = [];
  let stackX = 0;
  placed.forEach((p) => {
    stackX = Math.max(stackX, p.gx + p.gw + 1);
  });
  let stackY = 0;
  for (const roomId of disconnected) {
    const fp = footprints.get(roomId)!;
    placed.set(roomId, {
      roomId,
      gx: stackX,
      gy: stackY,
      ...fp,
      isStaircase: false,
    });
    stackY += fp.gh + 1;
    unplacedRoomIds.push(roomId);
  }

  // Shift so the root room's outside-entry wall is on the plan's edge.
  const allPlaced = Array.from(placed.values());
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  allPlaced.forEach((p) => {
    minX = Math.min(minX, p.gx);
    maxX = Math.max(maxX, p.gx + p.gw);
    minY = Math.min(minY, p.gy);
    maxY = Math.max(maxY, p.gy + p.gh);
  });

  const rootRoom = rooms.find((r) => r.id === rootId)!;
  const rootEntry = (rootRoom.doors ?? []).find(
    (d) => d.isFixed && d.leadsToRoomId === null,
  );
  const rootPlaced = placed.get(rootId)!;
  const entryWall = rootEntry?.wallSide ?? "BOTTOM";

  let shiftX = 0;
  let shiftY = 0;
  if (entryWall === "BOTTOM") shiftY = maxY - (rootPlaced.gy + rootPlaced.gh);
  else if (entryWall === "TOP") shiftY = minY - rootPlaced.gy;
  else if (entryWall === "LEFT") shiftX = minX - rootPlaced.gx;
  else if (entryWall === "RIGHT") shiftX = maxX - (rootPlaced.gx + rootPlaced.gw);

  allPlaced.forEach((p) => {
    p.gx += shiftX;
    p.gy += shiftY;
  });

  let finalMinX = Infinity;
  let finalMinY = Infinity;
  allPlaced.forEach((p) => {
    finalMinX = Math.min(finalMinX, p.gx);
    finalMinY = Math.min(finalMinY, p.gy);
  });
  allPlaced.forEach((p) => {
    p.gx -= finalMinX;
    p.gy -= finalMinY;
  });

  // Edges are computed AFTER placement, on the shared wall.
  const edges: LayoutEdge[] = [];
  const seenPairs = new Set<string>();
  for (const room of rooms) {
    for (const door of room.doors ?? []) {
      if (door.isFixed) continue;
      if (door.leadsToRoomId === null) continue;
      const key =
        room.id < door.leadsToRoomId
          ? `${room.id}|${door.leadsToRoomId}`
          : `${door.leadsToRoomId}|${room.id}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);

      const fromPlaced = placed.get(room.id);
      const toPlaced = placed.get(door.leadsToRoomId);
      if (!fromPlaced || !toPlaced) continue;

      const claimed = directionOf(door);
      const { direction, alongPercent } = computeDoorPlacement(
        fromPlaced,
        toPlaced,
        claimed,
      );

      edges.push({
        doorId: door.id,
        fromRoomId: room.id,
        toRoomId: door.leadsToRoomId,
        compassDirection: direction,
        alongWallPercent: alongPercent,
        kind: door.kind,
      });
    }
  }

  const placements: TourPlacement[] = [];
  for (const r of rooms) {
    const p = placed.get(r.id);
    if (!p) continue;
    const isUnplaced = unplacedRoomIds.includes(r.id);
    placements.push({
      roomId: r.id,
      gridX: p.gx,
      gridY: p.gy,
      widthUnits: p.gw,
      heightUnits: p.gh,
      isPlaced: !isUnplaced,
    });
  }

  return { placements, edges, unplacedRoomIds };
}
