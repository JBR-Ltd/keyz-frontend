// src/lib/types/tour.ts
//
// Wire types for the virtual tour feature. Every field mirrors a DTO on the
// Java backend one-for-one. When a field name looks odd it is because the
// server serializes it that way (e.g. `isFixed` as a primitive boolean so
// Jackson emits `"isFixed"` and not `"fixed"`; `compassDirection` derived
// from `wallSide` on the server, not stored).

// === Enums ===

export type WallSide = "TOP" | "RIGHT" | "BOTTOM" | "LEFT";
export type CompassDirection = "N" | "E" | "S" | "W";
export type DoorKind = "DOOR" | "OPENING";
export type StairDirection = "UP" | "DOWN" | "BOTH";
export type SizeBucket = "SMALL" | "MEDIUM" | "LARGE";

/**
 * Room capture lifecycle. Stored lowercase on the wire; the backend maps the
 * Java enum to lowercase via a converter so these are the literal strings
 * the server sends.
 */
export type RoomStatus =
  | "empty"
  | "scanning"
  | "uploading"
  | "ready"
  | "retake";

// === Entities ===

export interface Floor {
  id: number;
  propertyId: number;
  floorNumber: number;
  name: string;
  isFloorPlanConfirmed: boolean | null;
  floorPlanConfirmedAt: string | null;
}

export interface Room {
  id: number;
  floorId: number;
  roomName: string;
  roomType: string;
  sizeBucket: SizeBucket | null;
  sizeEstimateSqft: number | null;
  status: RoomStatus;
  fovAngle: number;
  panorama: string | null;
  panoramas?: Panorama[];
  doors?: Door[];
  staircases?: Staircase[];
  floorPlanPosition?: FloorPlanPosition | null;
}

export interface FloorPlanPosition {
  gridX: number | null;
  gridY: number | null;
  widthUnits: number | null;
  depthUnits: number | null;
}

export interface Panorama {
  id: number;
  roomId: number;
  imageUrl: string;
  captureOrder: number;
  isPrimary: boolean;
  resolution: string | null;
  topCropPercent: number | null;
  bottomCropPercent: number | null;
  processedAt: string | null;
  isProcessed: boolean | null;
}

export interface Door {
  id: number;
  roomId: number;
  roomName: string;
  panoramaId: number | null;
  positionYawDeg: number;
  positionPitchDeg: number;
  wallSide: WallSide | null;
  compassDirection: CompassDirection | null;
  alongWallPercent: number | null;
  x: number | null;
  y: number | null;
  kind: DoorKind;
  isFixed: boolean;
  leadsToRoomId: number | null;
  leadsToRoomName: string | null;
  leadsToLabel: string | null;
  isReciprocalOf: number | null;
  reciprocalDoorId: number | null;
  reciprocalDoorRoomName: string | null;
}

export interface Staircase {
  id: number;
  floorId: number;
  hostRoomId: number;
  hostRoomName: string;
  name: string;
  hostWallSide: WallSide;
  hostAlongWallPercent: number;
  kind: DoorKind;
  direction: StairDirection;
  footprintGw: number;
  footprintGh: number;
}

// === Requests ===

export interface CreateDoorRequest {
  roomId: number;
  panoramaId?: number | null;
  positionYawDeg: number;
  positionPitchDeg?: number;
  wallSide?: WallSide | null;
  alongWallPercent?: number | null;
  kind?: DoorKind;
  leadsToRoomId?: number | null;
  leadsToLabel?: string | null;
  createReciprocal?: boolean;
}

export interface UpdateDoorRequest {
  positionYawDeg?: number;
  positionPitchDeg?: number;
  wallSide?: WallSide;
  alongWallPercent?: number;
  kind?: DoorKind;
  leadsToRoomId?: number;
  leadsToLabel?: string;
}

export interface CreateStaircaseRequest {
  hostRoomId: number;
  name?: string;
  hostWallSide: WallSide;
  hostAlongWallPercent: number;
  kind?: DoorKind;
  direction?: StairDirection;
  footprintGw?: number;
  footprintGh?: number;
}

export interface UpdateStaircaseRequest {
  name?: string;
  hostWallSide?: WallSide;
  hostAlongWallPercent?: number;
  kind?: DoorKind;
  direction?: StairDirection;
  footprintGw?: number;
  footprintGh?: number;
}

export interface LinkedRoomRequest {
  roomName: string;
  roomType: string;
  sizeBucket?: SizeBucket;
  wallSide: WallSide;
  alongWallPercent: number;
  kind?: DoorKind;
}

// === Floor-plan persistence ===
//
// The browser computes the layout and PUTs the whole plan. The server
// validates ownership, room membership, integer cells and no overlaps, then
// stores. There is no more server-side generator.

export interface TourPlacement {
  roomId: number;
  gridX: number | null;
  gridY: number | null;
  widthUnits: number | null;
  heightUnits: number | null;
  isPlaced: boolean;
}

export interface FloorPlanResponse {
  floorId: number;
  floorName: string;
  confirmed: boolean;
  placements: TourPlacement[];
  unplacedRoomIds: number[];
}

export interface PutFloorPlanRequest {
  placements: TourPlacement[];
}

// === Public tour bundle ===
//
// One payload for the viewer, the blueprint and the 3D scene. The public
// endpoint filters to READY rooms; the owner preview (full-tour) includes
// drafts. Same shape, so one client reads both.

export interface PublicTourPanorama {
  url: string;
  topCropPercent: number | null;
  bottomCropPercent: number | null;
}

export interface PublicTourDoor {
  id: number;
  wallSide: WallSide | null;
  compassDirection: CompassDirection | null;
  alongWallPercent: number | null;
  kind: DoorKind | null;
  isFixed: boolean;
  yawDeg: number | null;
  pitchDeg: number | null;
  leadsToRoomId: number | null;
  leadsToLabel: string | null;
}

export interface PublicTourRoom {
  id: number;
  name: string;
  type: string;
  sizeBucket: SizeBucket | null;
  status: RoomStatus;
  panorama: PublicTourPanorama | null;
  doors: PublicTourDoor[];
}

export interface PublicTourFloor {
  id: number;
  name: string;
  floorNumber: number;
  confirmed: boolean;
  placements: TourPlacement[];
  rooms: PublicTourRoom[];
  staircases: Staircase[];
}

export interface PublicTour {
  propertyPublicId: string;
  propertyName: string;
  published: boolean;
  publishedAt: string | null;
  floors: PublicTourFloor[];
}

// === Tour summary (manage-listing panel) ===

export interface TourSummary {
  propertyId: number;
  /** The opaque public id, used to build public links. Optional on cached responses. */
  propertyPublicId?: string;
  floorCount: number;
  roomCount: number;
  panoramaCount: number;
  hasFloorPlan: boolean;
  isFloorPlanConfirmed: boolean;
  isPublishable: boolean;
  isPublished: boolean;
  unplacedCount: number;
  notReadyCount: number;
  unconfirmedFloorCount: number;
}

// === Floor-plan graph (rendering shape) ===
//
// Assembled on the client by lib/tour/buildGraph.ts from the persisted
// placements plus each room's doors. Consumed by blueprint.ts and
// FloorPlan3DView.

export interface FloorPlanGraphNode {
  roomId: number;
  name: string;
  roomType: string;
  sizeBucket: string;
  sizeEstimateSqft: number | null;
  gridX: number | null;
  gridY: number | null;
  widthUnits: number | null;
  heightUnits: number | null;
  isStaircase: boolean;
  hostRoomId: number | null;
  doors: Door[];
}

export interface FloorPlanGraphEdge {
  doorId: number;
  fromRoomId: number;
  toRoomId: number;
  wallSide: WallSide | null;
  compassDirection: CompassDirection | null;
  alongWallPercent: number | null;
  kind: DoorKind | null;
}

export interface FloorPlanGraph {
  floorId: number;
  floorName: string;
  nodes: FloorPlanGraphNode[];
  edges: FloorPlanGraphEdge[];
  unplacedRoomIds: number[];
  isConfirmed: boolean | null;
  disclaimer: string;
}

// === Panorama validation (used by the Python pipeline UI) ===

export interface ValidationIssue {
  category: string;
  code: string;
  message: string;
  severity: string;
}

export interface PanoValidationResult {
  status: "accepted" | "rejected";
  validationResults: {
    passed: boolean;
    issues: ValidationIssue[];
  };
  savedOutputPath?: string;
}
