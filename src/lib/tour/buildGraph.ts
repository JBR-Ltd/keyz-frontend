// src/lib/tour/buildGraph.ts
//
// Turns a FloorPlanResponse (or a client-computed LayoutResult) plus the
// floor's rooms and staircases into the graph shape the blueprint and 3D
// renderer consume.
//
// Edges come from two sources:
//   - when a caller passes `derivedEdges` (LayoutResult.edges), those win.
//     This is the wizard's floor-plan step, where computeLayout recomputed
//     every door's wall side and along percentage from the settled grid.
//   - otherwise the edges are derived from each room's stored doors, which
//     is what a read-only page uses.

import type {
  CompassDirection,
  Door,
  DoorKind,
  FloorPlanGraph,
  FloorPlanGraphEdge,
  FloorPlanGraphNode,
  Room,
  Staircase,
  TourPlacement,
} from "@/lib/types/tour";
import type { LayoutEdge } from "./floorPlanLayout";

const DISCLAIMER =
  "Interactive Floor Plan: This is approximate layout for navigation. Not to scale.";

export interface BuildGraphInput {
  floorId: number;
  floorName: string;
  confirmed: boolean;
  placements: TourPlacement[];
  unplacedRoomIds: number[];
  rooms: Room[];
  staircases: Staircase[];
  /** Optional. Present when the caller just ran computeLayout. */
  derivedEdges?: LayoutEdge[];
}

function staircaseNode(
  s: Staircase,
  hostNode: FloorPlanGraphNode | undefined,
): FloorPlanGraphNode {
  let gridX = 0;
  let gridY = 0;
  if (hostNode && hostNode.gridX !== null && hostNode.gridY !== null) {
    const hostW = hostNode.widthUnits ?? 1;
    const hostH = hostNode.heightUnits ?? 1;
    const along = Math.max(0, Math.min(100, s.hostAlongWallPercent)) / 100;
    switch (s.hostWallSide) {
      case "TOP":
        gridX = hostNode.gridX + Math.round(along * hostW - s.footprintGw / 2);
        gridY = hostNode.gridY - s.footprintGh;
        break;
      case "BOTTOM":
        gridX = hostNode.gridX + Math.round(along * hostW - s.footprintGw / 2);
        gridY = hostNode.gridY + hostH;
        break;
      case "LEFT":
        gridX = hostNode.gridX - s.footprintGw;
        gridY = hostNode.gridY + Math.round(along * hostH - s.footprintGh / 2);
        break;
      case "RIGHT":
        gridX = hostNode.gridX + hostW;
        gridY = hostNode.gridY + Math.round(along * hostH - s.footprintGh / 2);
        break;
    }
  }
  return {
    roomId: s.id,
    name: s.name,
    roomType: "Staircase",
    sizeBucket: "SMALL",
    sizeEstimateSqft: null,
    gridX,
    gridY,
    widthUnits: s.footprintGw,
    heightUnits: s.footprintGh,
    isStaircase: true,
    hostRoomId: s.hostRoomId,
    doors: [],
  };
}

function doorToEdge(door: Door, fromRoomId: number): FloorPlanGraphEdge | null {
  if (door.leadsToRoomId === null) return null;
  return {
    doorId: door.id,
    fromRoomId,
    toRoomId: door.leadsToRoomId,
    wallSide: door.wallSide,
    compassDirection: door.compassDirection,
    alongWallPercent: door.alongWallPercent,
    kind: door.kind,
  };
}

export function buildGraph(input: BuildGraphInput): FloorPlanGraph {
  const {
    floorId,
    floorName,
    confirmed,
    placements,
    unplacedRoomIds,
    rooms,
    staircases,
    derivedEdges,
  } = input;

  const placementByRoom = new Map<number, TourPlacement>();
  for (const p of placements) placementByRoom.set(p.roomId, p);

  const nodes: FloorPlanGraphNode[] = [];
  const nodeByRoomId = new Map<number, FloorPlanGraphNode>();

  for (const room of rooms) {
    const placement = placementByRoom.get(room.id);
    if (!placement) continue;
    if (!placement.isPlaced) continue;

    const node: FloorPlanGraphNode = {
      roomId: room.id,
      name: room.roomName,
      roomType: room.roomType,
      sizeBucket: room.sizeBucket ?? "MEDIUM",
      sizeEstimateSqft: room.sizeEstimateSqft,
      gridX: placement.gridX,
      gridY: placement.gridY,
      widthUnits: placement.widthUnits,
      heightUnits: placement.heightUnits,
      isStaircase: false,
      hostRoomId: null,
      doors: room.doors ?? [],
    };
    nodes.push(node);
    nodeByRoomId.set(room.id, node);
  }

  let edges: FloorPlanGraphEdge[];
  if (derivedEdges && derivedEdges.length > 0) {
    edges = derivedEdges.map((e) => ({
      doorId: e.doorId,
      fromRoomId: e.fromRoomId,
      toRoomId: e.toRoomId,
      wallSide: null,
      compassDirection: e.compassDirection as CompassDirection,
      alongWallPercent: e.alongWallPercent,
      kind: e.kind as DoorKind,
    }));
  } else {
    edges = [];
    for (const room of rooms) {
      for (const door of room.doors ?? []) {
        const edge = doorToEdge(door, room.id);
        if (edge) edges.push(edge);
      }
    }
  }

  for (const s of staircases) {
    nodes.push(staircaseNode(s, nodeByRoomId.get(s.hostRoomId)));
  }

  return {
    floorId,
    floorName,
    nodes,
    edges,
    unplacedRoomIds,
    isConfirmed: confirmed,
    disclaimer: DISCLAIMER,
  };
}
