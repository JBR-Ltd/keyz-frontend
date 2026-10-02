// src/components/tour/FloorPlan3DView.tsx
//
// The 3D walkthrough of a floor plan. Consumes the same FloorPlanGraph the
// blueprint renderer does, plus the floor's Room entities, and builds an
// explorable three.js scene: walls, doors, windows, furniture, staircases,
// and outdoor surroundings. Rendered with @react-three/fiber.
//
// All room-type-driven decisions (wall paint, floor material, which
// furniture) live in the type-and-name classifiers near the top. Adding a
// new room type to the wizard means adding a branch here or the room gets
// the default paint.
//
// Door slots: BOTH rooms cut a gap in their shared wall so neither side has
// a solid wall where the doorway opens. The visible door frame is only drawn
// by the lower-id room of each pair, so it does not appear twice.

"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  Sky,
  SoftShadows,
} from "@react-three/drei";
import {
  EffectComposer,
  N8AO,
  Bloom,
  Vignette,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { sharedWallPercent, opposite, type PlacedRoom } from "@/lib/tour/floorPlanEdges";
import type {
  CompassDirection,
  Floor,
  FloorPlanGraph,
  Room,
  SizeBucket,
  WallSide,
} from "@/lib/types/tour";

const WALL_HEIGHT = 2.5;
const UNIT_SIZE = 1.8;
const WALL_THICKNESS = 0.15;
const GROUND_Y = -0.45;
const BUILDING_BASE_Y = -0.45;

const DOOR_HEIGHT = 2.05;
const DOOR_WIDTH = 0.9;
const WINDOW_SILL = 0.9;
const WINDOW_HEIGHT = 1.2;
const WINDOW_WIDTH = 1.1;

const THEME = {
  bg: "#efede8",
  card: "#faf9f7",
  navy: "#04344c",
  gold: "#c9913a",
  success: "#2f7a5b",
  muted: "#6b7c88",
  faint: "#8a99a4",
};

const ROOM_PALETTE = [
  { wall: "#D6E4FB" },
  { wall: "#D4EBD6" },
  { wall: "#FBE4C9" },
  { wall: "#E6D2EB" },
  { wall: "#FBF6C9" },
  { wall: "#C9EEF2" },
  { wall: "#F8D2DD" },
  { wall: "#D6D9EE" },
];

const SELECTED_FLOOR = "#F0DCA8";
const SELECTED_WALL = "#C8913A";
const DOOR_WOOD = "#6B4226";
const DOOR_WOOD_DARK = "#5A3720";

// ============================================================
// Room-type classifiers
// ============================================================

const WALL_PAINTS: Record<string, string> = {
  bedroom: "#E7E9DF",
  bath: "#DCEDF0",
  kitchen: "#F3ECD9",
  parlour: "#EFE6D6",
  dining: "#F0E4D0",
  corridor: "#E9E3D6",
  store: "#E3DED2",
  balcony: "#D9E4E0",
  office: "#E6E2D6",
  default: "#EDEAE2",
};

function getWallPaint(typeAndName: string): string {
  const t = typeAndName.toLowerCase();
  if (t.includes("bed")) return WALL_PAINTS.bedroom;
  if (t.includes("bath") || t.includes("toilet")) return WALL_PAINTS.bath;
  if (t.includes("kitchen")) return WALL_PAINTS.kitchen;
  if (t.includes("dining") || t.includes("dinning")) return WALL_PAINTS.dining;
  if (t.includes("parlour") || t.includes("living") || t.includes("lounge"))
    return WALL_PAINTS.parlour;
  if (t.includes("corridor") || t.includes("hall") || t.includes("passage"))
    return WALL_PAINTS.corridor;
  if (t.includes("store") || t.includes("closet")) return WALL_PAINTS.store;
  if (t.includes("balcony")) return WALL_PAINTS.balcony;
  if (t.includes("study") || t.includes("office")) return WALL_PAINTS.office;
  return WALL_PAINTS.default;
}

function getFloorKind(typeAndName: string): "wood" | "tile" {
  const t = typeAndName.toLowerCase();
  if (
    t.includes("bath") ||
    t.includes("toilet") ||
    t.includes("kitchen") ||
    t.includes("laundry") ||
    t.includes("corridor") ||
    t.includes("hall")
  ) {
    return "tile";
  }
  return "wood";
}

// ============================================================
// Procedural textures
// ============================================================

function makeGrassTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#5a8a3f";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.random();
    if (shade < 0.4) ctx.fillStyle = "rgba(70, 110, 45, 0.55)";
    else if (shade < 0.75) ctx.fillStyle = "rgba(110, 160, 70, 0.5)";
    else ctx.fillStyle = "rgba(50, 85, 35, 0.45)";
    const w = 1 + Math.random() * 2.5;
    const h = 1 + Math.random() * 3;
    ctx.fillRect(x, y, w, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBarkTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#5a4632";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.strokeStyle = `rgba(${30 + Math.random() * 40}, ${20 + Math.random() * 30}, ${10 + Math.random() * 20}, 0.55)`;
    ctx.lineWidth = 0.6 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 6, y + 4 + Math.random() * 10);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeConcreteTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#c9c3b6";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = Math.random() * 40 - 20;
    ctx.fillStyle = `rgba(${180 + v}, ${175 + v}, ${165 + v}, 0.35)`;
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWoodFloorTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#B88856";
  ctx.fillRect(0, 0, w, h);
  const plankH = 64;
  for (let y = 0; y < h; y += plankH) {
    const offset = (y / plankH) % 2 === 0 ? 0 : 80;
    for (let x = -offset; x < w; x += 160) {
      const tone = -10 + Math.random() * 20;
      ctx.fillStyle = `rgba(${140 + tone}, ${96 + tone}, ${56 + tone}, 0.35)`;
      ctx.fillRect(x, y, 160, plankH);
      ctx.strokeStyle = "rgba(60,35,15,0.45)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x, y, 160, plankH);
    }
    ctx.strokeStyle = "rgba(50,30,12,0.5)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTileFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#E8E5DE";
  ctx.fillRect(0, 0, size, size);
  const tile = 128;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      const tone = Math.random() * 8 - 4;
      ctx.fillStyle = `rgba(${230 + tone}, ${227 + tone}, ${220 + tone}, 0.6)`;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    }
  }
  ctx.strokeStyle = "rgba(120,115,105,0.55)";
  ctx.lineWidth = 3;
  for (let x = 0; x <= size; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallPaintTexture(hex: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.028)"
        : "rgba(0,0,0,0.028)";
    const r = 3 + Math.random() * 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallRoughnessTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#E0E0E0";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 200 + Math.floor(Math.random() * 55);
    ctx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.35)`;
    const r = 2 + Math.random() * 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

function makeWoodRoughnessTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#A0A0A0";
  ctx.fillRect(0, 0, size, size);
  const plankH = 32;
  for (let y = 0; y < size; y += plankH) {
    const offset = (y / plankH) % 2 === 0 ? 0 : 40;
    for (let x = -offset; x < size; x += 80) {
      ctx.strokeStyle = "rgba(220,220,220,0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 80, plankH);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeTileRoughnessTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#F0F0F0";
  ctx.fillRect(0, 0, size, size);
  const tile = 64;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      ctx.fillStyle = "#6A6A6A";
      ctx.fillRect(x + 3, y + 3, tile - 6, tile - 6);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Module-level cache so textures are built once per session
let grassTex: THREE.CanvasTexture | null = null;
let barkTex: THREE.CanvasTexture | null = null;
let concreteTex: THREE.CanvasTexture | null = null;
let woodFloorTex: THREE.CanvasTexture | null = null;
let tileFloorTex: THREE.CanvasTexture | null = null;
let woodRoughnessTex: THREE.CanvasTexture | null = null;
let tileRoughnessTex: THREE.CanvasTexture | null = null;
let wallRoughnessTex: THREE.CanvasTexture | null = null;
const wallTexCache = new Map<string, THREE.CanvasTexture>();

function getWallTexture(hex: string): THREE.CanvasTexture {
  if (!wallTexCache.has(hex)) wallTexCache.set(hex, makeWallPaintTexture(hex));
  return wallTexCache.get(hex)!;
}

function useSharedTextures() {
  return useMemo(() => {
    if (!grassTex) grassTex = makeGrassTexture();
    if (!barkTex) barkTex = makeBarkTexture();
    if (!concreteTex) concreteTex = makeConcreteTexture();
    if (!woodFloorTex) woodFloorTex = makeWoodFloorTexture();
    if (!tileFloorTex) tileFloorTex = makeTileFloorTexture();
    if (!woodRoughnessTex) woodRoughnessTex = makeWoodRoughnessTexture();
    if (!tileRoughnessTex) tileRoughnessTex = makeTileRoughnessTexture();
    if (!wallRoughnessTex) wallRoughnessTex = makeWallRoughnessTexture();
    return {
      grassTex,
      barkTex,
      concreteTex,
      woodFloorTex,
      tileFloorTex,
      woodRoughnessTex,
      tileRoughnessTex,
      wallRoughnessTex,
    };
  }, []);
}

// ============================================================
// Shared materials
// ============================================================

const MAT = {
  wood: { color: "#7A5A3A", roughness: 0.72, metalness: 0.0 },
  woodDark: { color: "#4E3424", roughness: 0.68, metalness: 0.0 },
  doorFrame: { color: "#F8F4EC", roughness: 0.5, metalness: 0.0 },
  leather: { color: "#B5523C", roughness: 0.55, metalness: 0.05 },
  metalChrome: { color: "#C8C8CC", roughness: 0.18, metalness: 0.95 },
  metalBrushed: { color: "#B4B4B8", roughness: 0.42, metalness: 0.85 },
  blackMatte: { color: "#1A1A1A", roughness: 0.55, metalness: 0.1 },
  ceramicWhite: { color: "#FFFFFF", roughness: 0.18, metalness: 0.02 },
  stoneTop: { color: "#3A3A3A", roughness: 0.32, metalness: 0.05 },
  accent: { color: "#C8913A", roughness: 0.55, metalness: 0.15 },
  plantLeaf: {
    color: "#3d6b2e",
    roughness: 0.88,
    metalness: 0.0,
    flatShading: true,
  },
  soil: { color: "#4A3624", roughness: 1.0, metalness: 0.0 },
  pot: { color: "#A85C3A", roughness: 0.85, metalness: 0.0 },
};

// ============================================================
// Doors & windows
// ============================================================

interface DoorSlot {
  localX: number;
  localZ: number;
  wallSide: WallSide;
  width: number;
  /**
   * The room on the other side of this door. Both rooms cut a gap in their
   * shared wall so neither side has a solid wall where the doorway opens.
   * The visible door frame is only drawn by the lower-id room, so at render
   * time we filter: slot.otherRoomId > node.roomId.
   */
  otherRoomId: number;
}

interface WindowSlot {
  localX: number;
  localZ: number;
  wallSide: WallSide;
  width: number;
}

function DoorPanel({ slot }: { slot: DoorSlot }) {
  const { localX, localZ, wallSide, width } = slot;
  const rotY = wallSide === "LEFT" || wallSide === "RIGHT" ? Math.PI / 2 : 0;

  return (
    <group position={[localX, 0, localZ]} rotation={[0, rotY, 0]}>
      <mesh position={[-width / 2, DOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.06, DOOR_HEIGHT, WALL_THICKNESS + 0.02]} />
        <meshStandardMaterial {...MAT.doorFrame} />
      </mesh>
      <mesh position={[width / 2, DOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.06, DOOR_HEIGHT, WALL_THICKNESS + 0.02]} />
        <meshStandardMaterial {...MAT.doorFrame} />
      </mesh>
      <mesh position={[0, DOOR_HEIGHT, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.12, 0.06, WALL_THICKNESS + 0.02]} />
        <meshStandardMaterial {...MAT.doorFrame} />
      </mesh>
      <mesh position={[0, DOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width - 0.06, DOOR_HEIGHT - 0.06, 0.04]} />
        <meshStandardMaterial
          color={DOOR_WOOD}
          roughness={0.55}
          metalness={0.02}
        />
      </mesh>
      <mesh
        position={[0, DOOR_HEIGHT * 0.7, WALL_THICKNESS / 2 + 0.005]}
        castShadow
      >
        <boxGeometry args={[width - 0.24, DOOR_HEIGHT * 0.32, 0.01]} />
        <meshStandardMaterial color={DOOR_WOOD_DARK} roughness={0.6} />
      </mesh>
      <mesh
        position={[0, DOOR_HEIGHT * 0.32, WALL_THICKNESS / 2 + 0.005]}
        castShadow
      >
        <boxGeometry args={[width - 0.24, DOOR_HEIGHT * 0.36, 0.01]} />
        <meshStandardMaterial color={DOOR_WOOD_DARK} roughness={0.6} />
      </mesh>
      <mesh
        position={[width / 2 - 0.14, DOOR_HEIGHT * 0.45, WALL_THICKNESS / 2 + 0.04]}
        castShadow
      >
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial {...MAT.metalChrome} />
      </mesh>
    </group>
  );
}

function WindowPanel({ slot }: { slot: WindowSlot }) {
  const { localX, localZ, wallSide, width } = slot;
  const rotY = wallSide === "LEFT" || wallSide === "RIGHT" ? Math.PI / 2 : 0;
  const topOfWindow = WINDOW_SILL + WINDOW_HEIGHT;
  const outward = WALL_THICKNESS / 2 + 0.001;

  return (
    <group position={[localX, 0, localZ]} rotation={[0, rotY, 0]}>
      <mesh position={[0, WINDOW_SILL + WINDOW_HEIGHT / 2, outward]}>
        <planeGeometry args={[width, WINDOW_HEIGHT]} />
        <meshStandardMaterial color="#0F1B26" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, WINDOW_SILL + WINDOW_HEIGHT / 2, outward + 0.008]}>
        <boxGeometry args={[width - 0.08, WINDOW_HEIGHT - 0.08, 0.01]} />
        <meshPhysicalMaterial
          color="#DCEAF0"
          roughness={0.02}
          metalness={0.0}
          transmission={0.9}
          thickness={0.05}
          ior={1.5}
          transparent
          opacity={0.35}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[
            (side * width) / 2,
            WINDOW_SILL + WINDOW_HEIGHT / 2,
            outward + 0.012,
          ]}
          castShadow
        >
          <boxGeometry args={[0.08, WINDOW_HEIGHT + 0.1, 0.05]} />
          <meshStandardMaterial
            color={DOOR_WOOD}
            roughness={0.55}
            metalness={0.02}
          />
        </mesh>
      ))}
      <mesh position={[0, topOfWindow, outward + 0.012]} castShadow>
        <boxGeometry args={[width + 0.16, 0.08, 0.05]} />
        <meshStandardMaterial
          color={DOOR_WOOD}
          roughness={0.55}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[0, WINDOW_SILL, outward + 0.012]} castShadow>
        <boxGeometry args={[width + 0.16, 0.08, 0.05]} />
        <meshStandardMaterial
          color={DOOR_WOOD}
          roughness={0.55}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// Door / window slot computation
// ============================================================

function computeDoorSlots(
  roomId: number,
  graph: FloorPlanGraph,
  w: number,
  d: number,
): DoorSlot[] {
  const slots: DoorSlot[] = [];
  const halfW = w / 2;
  const halfD = d / 2;
  const doorWidth = Math.min(DOOR_WIDTH, Math.min(w, d) * 0.42);

  const selfNode = graph.nodes.find((n) => n.roomId === roomId);
  const selfRect: PlacedRoom | null =
    selfNode && selfNode.gridX !== null && selfNode.gridY !== null
      ? {
          roomId: selfNode.roomId,
          gx: selfNode.gridX,
          gy: selfNode.gridY,
          gw: selfNode.widthUnits ?? 1,
          gh: selfNode.heightUnits ?? 1,
          isStaircase: false,
        }
      : null;

  graph.edges.forEach((edge) => {
    const isFrom = edge.fromRoomId === roomId;
    const isTo = edge.toRoomId === roomId;
    if (!isFrom && !isTo) return;
    if (!edge.compassDirection) return;

    const otherId = isFrom ? edge.toRoomId : edge.fromRoomId;

    let compass: CompassDirection = edge.compassDirection;
    let alongPercent = edge.alongWallPercent ?? 50;

    if (isTo && !isFrom) {
      // We are the target room. The edge was written from the other room's
      // perspective: its compass points out of that room's wall, ours is the
      // opposite. The percent must be recomputed geometrically: the old
      // 100 - along shortcut was only correct when both rooms were the same
      // size and aligned, which is rare.
      compass = opposite(compass);

      const otherNode = graph.nodes.find((n) => n.roomId === otherId);
      const otherRect: PlacedRoom | null =
        otherNode && otherNode.gridX !== null && otherNode.gridY !== null
          ? {
              roomId: otherNode.roomId,
              gx: otherNode.gridX,
              gy: otherNode.gridY,
              gw: otherNode.widthUnits ?? 1,
              gh: otherNode.heightUnits ?? 1,
              isStaircase: false,
            }
          : null;

      if (selfRect && otherRect) {
        const shared = sharedWallPercent(selfRect, otherRect, compass);
        if (shared !== null) {
          alongPercent = shared;
        } else {
          alongPercent = 100 - alongPercent;
        }
      } else {
        alongPercent = 100 - alongPercent;
      }
    }

    const along = Math.max(0.08, Math.min(0.92, alongPercent / 100));

    switch (compass) {
      case "N": {
        const lx = -halfW + along * w;
        slots.push({
          localX: lx,
          localZ: -halfD,
          wallSide: "TOP",
          width: doorWidth,
          otherRoomId: otherId,
        });
        break;
      }
      case "S": {
        const lx = -halfW + along * w;
        slots.push({
          localX: lx,
          localZ: halfD,
          wallSide: "BOTTOM",
          width: doorWidth,
          otherRoomId: otherId,
        });
        break;
      }
      case "W": {
        const lz = -halfD + along * d;
        slots.push({
          localX: -halfW,
          localZ: lz,
          wallSide: "LEFT",
          width: doorWidth,
          otherRoomId: otherId,
        });
        break;
      }
      case "E": {
        const lz = -halfD + along * d;
        slots.push({
          localX: halfW,
          localZ: lz,
          wallSide: "RIGHT",
          width: doorWidth,
          otherRoomId: otherId,
        });
        break;
      }
    }
  });

  return slots;
}

function computeWindowSlots(
  roomId: number,
  graph: FloorPlanGraph,
  w: number,
  d: number,
  doorSlots: DoorSlot[],
): WindowSlot[] {
  const slots: WindowSlot[] = [];
  const halfW = w / 2;
  const halfD = d / 2;

  const node = graph.nodes.find((n) => n.roomId === roomId);
  if (!node || node.gridX === null || node.gridY === null) return slots;

  let floorMinX = Infinity;
  let floorMaxX = -Infinity;
  let floorMinY = Infinity;
  let floorMaxY = -Infinity;
  graph.nodes.forEach((n) => {
    if (n.gridX === null || n.gridY === null) return;
    if (n.widthUnits === null || n.heightUnits === null) return;
    floorMinX = Math.min(floorMinX, n.gridX);
    floorMaxX = Math.max(floorMaxX, n.gridX + n.widthUnits);
    floorMinY = Math.min(floorMinY, n.gridY);
    floorMaxY = Math.max(floorMaxY, n.gridY + n.heightUnits);
  });

  const roomMinX = node.gridX;
  const roomMaxX = node.gridX + (node.widthUnits ?? 1);
  const roomMinY = node.gridY;
  const roomMaxY = node.gridY + (node.heightUnits ?? 1);

  const isTopPerimeter = Math.abs(roomMinY - floorMinY) < 0.001;
  const isBottomPerimeter = Math.abs(roomMaxY - floorMaxY) < 0.001;
  const isLeftPerimeter = Math.abs(roomMinX - floorMinX) < 0.001;
  const isRightPerimeter = Math.abs(roomMaxX - floorMaxX) < 0.001;

  const wallsWithDoors = new Set(doorSlots.map((ds) => ds.wallSide));
  const windowWidth = Math.min(WINDOW_WIDTH, Math.min(w, d) * 0.45);

  const candidates = [
    { wallSide: "TOP" as WallSide, isPerimeter: isTopPerimeter },
    { wallSide: "BOTTOM" as WallSide, isPerimeter: isBottomPerimeter },
    { wallSide: "LEFT" as WallSide, isPerimeter: isLeftPerimeter },
    { wallSide: "RIGHT" as WallSide, isPerimeter: isRightPerimeter },
  ];

  candidates.forEach(({ wallSide, isPerimeter }) => {
    if (!isPerimeter) return;
    if (wallsWithDoors.has(wallSide)) return;
    if (wallSide === "TOP" || wallSide === "BOTTOM") {
      if (w < windowWidth * 1.4) return;
      const lx = 0;
      const lz = wallSide === "TOP" ? -halfD : halfD;
      slots.push({ localX: lx, localZ: lz, wallSide, width: windowWidth });
    } else {
      if (d < windowWidth * 1.4) return;
      const lz = 0;
      const lx = wallSide === "LEFT" ? -halfW : halfW;
      slots.push({ localX: lx, localZ: lz, wallSide, width: windowWidth });
    }
  });

  return slots;
}

// ============================================================
// Furniture
// ============================================================

function NoPointer({ children }: { children: ReactNode }) {
  return (
    <group
      onPointerOver={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </group>
  );
}

function Rug({
  x = 0,
  z = 0,
  w = 1.2,
  d = 1.8,
  color = "#B5523C",
}: {
  x?: number;
  z?: number;
  w?: number;
  d?: number;
  color?: string;
}) {
  return (
    <mesh
      position={[x, 0.011, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} roughness={0.98} metalness={0} />
    </mesh>
  );
}

function NightstandLamp({ x = 0, z = 0 }: { x?: number; z?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 0.5, 0.35]} />
        <meshStandardMaterial {...MAT.wood} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.25, 12]} />
        <meshStandardMaterial {...MAT.metalBrushed} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <coneGeometry args={[0.12, 0.18, 16]} />
        <meshStandardMaterial
          color="#F0DCA8"
          emissive="#F0DCA8"
          emissiveIntensity={0.7}
          roughness={0.7}
        />
      </mesh>
      <pointLight
        position={[0, 0.78, 0]}
        intensity={0.4}
        distance={1.5}
        color="#F0DCA8"
      />
    </group>
  );
}

function Bed({
  x = 0,
  z = 0,
  w = 1.3,
  d = 1.9,
  rotY = 0,
}: {
  x?: number;
  z?: number;
  w?: number;
  d?: number;
  rotY?: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <Rug x={0} z={0.5} w={w + 0.7} d={d + 0.3} color="#C7A27A" />
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.4, d]} />
        <meshStandardMaterial color="#B8C3D4" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.06, 0.08, d - 0.35]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.96} />
      </mesh>
      <mesh
        position={[-w / 2 + 0.14, 0.56, -d * 0.1]}
        castShadow
        receiveShadow
        rotation={[0, 0, 0.05]}
      >
        <boxGeometry args={[0.3, 0.12, 0.4]} />
        <meshStandardMaterial color="#F0EAE0" roughness={0.95} />
      </mesh>
      <mesh
        position={[w / 2 - 0.14, 0.56, -d * 0.1]}
        castShadow
        receiveShadow
        rotation={[0, 0, -0.05]}
      >
        <boxGeometry args={[0.3, 0.12, 0.4]} />
        <meshStandardMaterial color="#F0EAE0" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.6, -d / 2 - 0.03]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.9, 0.08]} />
        <meshStandardMaterial {...MAT.wood} />
      </mesh>
      <mesh position={[0, 0.6, -d / 2 + 0.25]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.35, 0.14, 0.4]} />
        <meshStandardMaterial {...MAT.leather} />
      </mesh>
      <NightstandLamp x={w / 2 + 0.28} z={-d / 2 + 0.3} />
    </group>
  );
}

function Sofa({
  x = 0,
  z = 0,
  w = 1.8,
  d = 0.85,
  rotY = 0,
  color = "#8A9BA8",
}: {
  x?: number;
  z?: number;
  w?: number;
  d?: number;
  rotY?: number;
  color?: string;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.35, d]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.55, -d / 2 + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.45, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[(side * w) / 2 - (side * 0.1), 0.5, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.2, 0.35, d]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      {[-w * 0.22, w * 0.22].map((cx, i) => (
        <mesh
          key={i}
          position={[cx, 0.55, 0.05]}
          rotation={[0.15, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.32, 0.28, 0.12]} />
          <meshStandardMaterial {...MAT.accent} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable({ x = 0, z = 0 }: { x?: number; z?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Rug x={0} z={0} w={1.6} d={1.2} color="#D9CBAE" />
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.08, 0.5]} />
        <meshStandardMaterial color="#A47A50" roughness={0.42} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.34, 0.4]} />
        <meshStandardMaterial {...MAT.woodDark} />
      </mesh>
    </group>
  );
}

function TV({
  x = 0,
  z = 0,
  rotY = 0,
}: {
  x?: number;
  z?: number;
  rotY?: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.08, 0.35]} />
        <meshStandardMaterial {...MAT.blackMatte} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.65, 0.06]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.15} metalness={0.35} />
      </mesh>
    </group>
  );
}

function DiningTable({
  x = 0,
  z = 0,
  w = 1.6,
  d = 0.9,
}: {
  x?: number;
  z?: number;
  w?: number;
  d?: number;
}) {
  const chairPositions: Array<[number, number, number]> = [
    [-w / 2 + 0.25, 0, -d / 2 - 0.28],
    [0, 0, -d / 2 - 0.28],
    [w / 2 - 0.25, 0, -d / 2 - 0.28],
    [-w / 2 + 0.25, 0, d / 2 + 0.28],
    [0, 0, d / 2 + 0.28],
    [w / 2 - 0.25, 0, d / 2 + 0.28],
  ];
  return (
    <group position={[x, 0, z]}>
      <Rug x={0} z={0} w={w + 1.2} d={d + 1.2} color="#8A6642" />
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.06, d]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.4} metalness={0.05} />
      </mesh>
      {chairPositions.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.05, 0.4]} />
            <meshStandardMaterial color="#7A5232" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.23, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.06, 0.45, 0.06]} />
            <meshStandardMaterial color="#5B3A22" roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function KitchenCounter({
  x = 0,
  z = 0,
  w = 2.2,
  d = 0.65,
  rotY = 0,
}: {
  x?: number;
  z?: number;
  w?: number;
  d?: number;
  rotY?: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.9, d]} />
        <meshStandardMaterial color="#E4E0D8" roughness={0.6} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.06, d + 0.02]} />
        <meshStandardMaterial {...MAT.stoneTop} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[(side * w) / 4, 0.96, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.13, 0.13, 0.02, 20]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.25} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, -d / 2 + 0.02]}>
        <boxGeometry args={[w, 0.35, 0.02]} />
        <meshStandardMaterial color="#D9D2C2" roughness={0.35} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.55, -d / 2 + 0.16]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.5, 0.32]} />
        <meshStandardMaterial color="#E8E2D5" roughness={0.62} />
      </mesh>
      {[-w * 0.3, 0, w * 0.3].map((cx, i) => (
        <mesh key={i} position={[cx, 1.55, -d / 2 + 0.32]}>
          <boxGeometry args={[0.02, 0.44, 0.02]} />
          <meshStandardMaterial {...MAT.metalBrushed} />
        </mesh>
      ))}
    </group>
  );
}

function Fridge({
  x = 0,
  z = 0,
  rotY = 0,
}: {
  x?: number;
  z?: number;
  rotY?: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.7, 0.6]} />
        <meshStandardMaterial color="#D0D0D4" roughness={0.28} metalness={0.55} />
      </mesh>
    </group>
  );
}

function Toilet({ x = 0, z = 0 }: { x?: number; z?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.2, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.4, 0.5]} />
        <meshStandardMaterial {...MAT.ceramicWhite} />
      </mesh>
      <mesh position={[0, 0.45, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.5, 0.18]} />
        <meshStandardMaterial {...MAT.ceramicWhite} />
      </mesh>
    </group>
  );
}

function Sink({ x = 0, z = 0 }: { x?: number; z?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.8, 0.12]} />
        <meshStandardMaterial {...MAT.ceramicWhite} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.14, 0.4]} />
        <meshStandardMaterial {...MAT.ceramicWhite} />
      </mesh>
      <mesh position={[0, 0.95, -0.14]} castShadow>
        <boxGeometry args={[0.05, 0.14, 0.05]} />
        <meshStandardMaterial {...MAT.metalChrome} />
      </mesh>
    </group>
  );
}

function Shower({
  x = 0,
  z = 0,
  w = 0.9,
  d = 0.9,
}: {
  x?: number;
  z?: number;
  w?: number;
  d?: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.35} />
      </mesh>
      <mesh position={[w / 2 - 0.02, 0.9, 0]} castShadow>
        <boxGeometry args={[0.03, 1.8, d]} />
        <meshPhysicalMaterial
          color="#DCEAF0"
          roughness={0.02}
          transmission={0.9}
          thickness={0.02}
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh position={[0, 0.9, d / 2 - 0.02]} castShadow>
        <boxGeometry args={[w, 1.8, 0.03]} />
        <meshPhysicalMaterial
          color="#DCEAF0"
          roughness={0.02}
          transmission={0.9}
          thickness={0.02}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

function Bathtub({
  x = 0,
  z = 0,
  w = 1.5,
  d = 0.75,
}: {
  x?: number;
  z?: number;
  w?: number;
  d?: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.55, d]} />
        <meshStandardMaterial {...MAT.ceramicWhite} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[w - 0.16, 0.08, d - 0.16]} />
        <meshStandardMaterial color="#DCEAF2" roughness={0.15} />
      </mesh>
    </group>
  );
}

function Desk({
  x = 0,
  z = 0,
  rotY = 0,
}: {
  x?: number;
  z?: number;
  rotY?: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.06, 0.6]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.42} metalness={0.05} />
      </mesh>
      {[-0.5, 0.5].map((lx) => (
        <mesh key={lx} position={[lx, 0.36, 0]} castShadow>
          <boxGeometry args={[0.06, 0.72, 0.55]} />
          <meshStandardMaterial {...MAT.woodDark} />
        </mesh>
      ))}
    </group>
  );
}

function Shelves({
  x = 0,
  z = 0,
  w = 1.4,
}: {
  x?: number;
  z?: number;
  w?: number;
}) {
  return (
    <group position={[x, 0, z]}>
      {[0.4, 0.9, 1.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.05, 0.35]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.62} />
        </mesh>
      ))}
      {[-w / 2 + 0.03, w / 2 - 0.03].map((x2) => (
        <mesh key={x2} position={[x2, 0.9, 0]} castShadow>
          <boxGeometry args={[0.06, 1.8, 0.35]} />
          <meshStandardMaterial {...MAT.woodDark} />
        </mesh>
      ))}
    </group>
  );
}

function Washer({ x = 0, z = 0 }: { x?: number; z?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.9, 0.65]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.4} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.5, 0.33]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 24]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.35} metalness={0.4} />
      </mesh>
    </group>
  );
}

function PottedPlant({
  x = 0,
  z = 0,
  scale = 1,
}: {
  x?: number;
  z?: number;
  scale?: number;
}) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.3, 16]} />
        <meshStandardMaterial {...MAT.pot} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial {...MAT.plantLeaf} />
      </mesh>
    </group>
  );
}

function Bench({
  x = 0,
  z = 0,
  rotY = 0,
}: {
  x?: number;
  z?: number;
  rotY?: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.06, 0.4]} />
        <meshStandardMaterial {...MAT.wood} />
      </mesh>
      <mesh position={[0, 0.65, -0.17]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.4, 0.06]} />
        <meshStandardMaterial {...MAT.wood} />
      </mesh>
    </group>
  );
}

function LampPost({ x = 0, z = 0 }: { x?: number; z?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 2.2, 12]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial
          color="#FFE9B8"
          emissive="#F0DCA8"
          emissiveIntensity={1.2}
          roughness={0.4}
        />
      </mesh>
      <pointLight
        position={[0, 2.25, 0]}
        intensity={0.9}
        distance={5}
        color="#F0DCA8"
      />
    </group>
  );
}

function FlowerBed({
  x = 0,
  z = 0,
  w = 2,
  d = 0.4,
}: {
  x?: number;
  z?: number;
  w?: number;
  d?: number;
}) {
  const colors = ["#D96B8A", "#E8C34A", "#C75B5B", "#8A6BC7"];
  const flowers = useMemo(() => {
    const arr: { fx: number; fz: number; c: string }[] = [];
    for (let i = 0; i < Math.round(w * 3); i++) {
      arr.push({
        fx: (Math.random() - 0.5) * w * 0.9,
        fz: (Math.random() - 0.5) * d * 0.7,
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, d]);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[w, 0.12, d]} />
        <meshStandardMaterial {...MAT.soil} />
      </mesh>
      {flowers.map((f, i) => (
        <mesh key={i} position={[f.fx, 0.15, f.fz]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={f.c} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
// Furniture composer
// ============================================================

function RoomFurniture({
  room,
  w,
  d,
}: {
  room: Room;
  w: number;
  d: number;
}) {
  const type = (room.roomType + " " + room.roomName).toLowerCase();
  const halfW = w / 2;
  const halfD = d / 2;
  const innerW = w - WALL_THICKNESS * 2;
  const innerD = d - WALL_THICKNESS * 2;
  const items: ReactNode[] = [];

  if (type.includes("bed")) {
    items.push(
      <Bed
        key="bed"
        x={halfW - innerW * 0.35}
        z={-halfD + innerD * 0.4}
        w={1.3}
        d={1.9}
      />,
    );
  }

  if (type.includes("bath") || type.includes("toilet")) {
    items.push(<Toilet key="wc" x={-halfW + 0.5} z={-halfD + 0.6} />);
    items.push(<Sink key="sink" x={halfW - 0.5} z={-halfD + 0.5} />);
    if (innerW > 1.6) {
      items.push(
        <Shower key="shower" x={halfW - 0.7} z={halfD - 0.7} w={1.0} d={1.0} />,
      );
    } else {
      items.push(
        <Bathtub
          key="tub"
          x={halfW - 0.6}
          z={halfD - 0.5}
          w={Math.min(1.2, innerW * 0.7)}
          d={0.6}
        />,
      );
    }
  }

  if (type.includes("kitchen")) {
    items.push(
      <KitchenCounter
        key="counter"
        x={-halfW + innerW * 0.35}
        z={-halfD + 0.4}
        w={Math.min(innerW * 0.9, 2.4)}
        d={0.65}
      />,
    );
    items.push(<Fridge key="fridge" x={halfW - 0.4} z={-halfD + 0.4} />);
  }

  if (type.includes("store") || type.includes("closet")) {
    items.push(
      <Shelves
        key="shelves"
        x={0}
        z={halfD - 0.25}
        w={Math.min(innerW * 0.9, 1.6)}
      />,
    );
  }

  if (type.includes("laundry")) {
    items.push(<Washer key="washer" x={-halfW + 0.5} z={-halfD + 0.5} />);
    items.push(
      <Shelves
        key="shelves"
        x={0}
        z={halfD - 0.25}
        w={Math.min(innerW * 0.9, 1.4)}
      />,
    );
  }

  if (type.includes("dining") || type.includes("dinning")) {
    items.push(
      <DiningTable
        key="dining"
        x={0}
        z={0}
        w={Math.min(innerW * 0.7, 1.8)}
        d={Math.min(innerD * 0.5, 1.0)}
      />,
    );
  }

  if (
    type.includes("parlour") ||
    type.includes("living") ||
    type.includes("lounge")
  ) {
    items.push(
      <Sofa
        key="sofa"
        x={0}
        z={halfD - 0.55}
        w={Math.min(innerW * 0.8, 2.2)}
        d={0.85}
        rotY={Math.PI}
      />,
    );
    items.push(<CoffeeTable key="coffee" x={0} z={-halfD + 1.1} />);
    items.push(<TV key="tv" x={0} z={-halfD + 0.35} />);
    items.push(
      <PottedPlant
        key="plant"
        x={halfW - 0.35}
        z={halfD - 0.35}
        scale={1.1}
      />,
    );
  }

  if (type.includes("study") || type.includes("office")) {
    items.push(<Desk key="desk" x={0} z={halfD - 0.4} rotY={Math.PI} />);
  }

  if (type.includes("corridor") || type.includes("hall") || type.includes("passage")) {
    items.push(
      <mesh
        key="runner"
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[Math.min(innerW * 0.5, 1.1), innerD * 0.8]} />
        <meshStandardMaterial color="#B5523C" roughness={0.98} />
      </mesh>,
    );
  }

  if (type.includes("balcony") || type.includes("compound")) {
    items.push(
      <PottedPlant key="plant1" x={-halfW + 0.3} z={-halfD + 0.3} scale={0.9} />,
    );
  }

  return <NoPointer>{items}</NoPointer>;
}

// ============================================================
// Selection glow
// ============================================================

function SelectionGlow({ w, d }: { w: number; d: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 2.4) * 0.03;
    ref.current.scale.set(s, 1, s);
  });
  return (
    <mesh ref={ref} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w * 0.94, d * 0.94]} />
      <meshBasicMaterial color={SELECTED_WALL} transparent opacity={0.16} />
    </mesh>
  );
}

// ============================================================
// Staircase 3D
// ============================================================

function Staircase3D({
  node,
}: {
  node: FloorPlanGraph["nodes"][number];
}) {
  const x = (node.gridX ?? 0) * UNIT_SIZE;
  const z = (node.gridY ?? 0) * UNIT_SIZE;
  const w = (node.widthUnits ?? 1) * UNIT_SIZE;
  const d = (node.heightUnits ?? 1) * UNIT_SIZE;

  const steps = 8;
  const stepH = 0.18;
  const runAlongX = w >= d;

  const stepEls = Array.from({ length: steps }, (_, i) => {
    const stepW = runAlongX ? w / steps : w;
    const stepD = runAlongX ? d : d / steps;
    const cx = runAlongX ? -w / 2 + (i + 0.5) * (w / steps) : 0;
    const cz = runAlongX ? 0 : -d / 2 + (i + 0.5) * (d / steps);
    const cy = 0.03 + i * stepH;
    return (
      <mesh key={i} position={[cx, cy, cz]} castShadow receiveShadow>
        <boxGeometry args={[stepW, stepH, stepD]} />
        <meshStandardMaterial color="#B8AE9E" roughness={0.7} metalness={0.02} />
      </mesh>
    );
  });

  return (
    <group position={[x + w / 2, 0, z + d / 2]}>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[w, 0.03, d]} />
        <meshStandardMaterial color="#D6CFC2" roughness={0.85} />
      </mesh>
      {stepEls}
    </group>
  );
}

// ============================================================
// Room 3D
// ============================================================

interface Room3DProps {
  node: FloorPlanGraph["nodes"][number];
  room: Room | undefined;
  graph: FloorPlanGraph;
  colourIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
  woodTex: THREE.CanvasTexture;
  tileTex: THREE.CanvasTexture;
  woodRoughTex: THREE.CanvasTexture;
  tileRoughTex: THREE.CanvasTexture;
  wallRoughTex: THREE.CanvasTexture;
}

function Room3D({
  node,
  room,
  graph,
  colourIndex,
  isSelected,
  isHovered,
  onSelect,
  onHoverIn,
  onHoverOut,
  woodTex,
  tileTex,
  woodRoughTex,
  tileRoughTex,
  wallRoughTex,
}: Room3DProps) {
  const x = (node.gridX ?? 0) * UNIT_SIZE;
  const z = (node.gridY ?? 0) * UNIT_SIZE;
  const w = (node.widthUnits ?? 1) * UNIT_SIZE;
  const d = (node.heightUnits ?? 1) * UNIT_SIZE;

  const typeAndName = `${node.roomType} ${node.name}`;
  const wallPaint = getWallPaint(typeAndName);
  const wallTex = getWallTexture(wallPaint);
  const floorKind = getFloorKind(typeAndName);
  const baseFloorTex = floorKind === "wood" ? woodTex : tileTex;
  const baseRoughTex = floorKind === "wood" ? woodRoughTex : tileRoughTex;
  const accent = ROOM_PALETTE[colourIndex % ROOM_PALETTE.length].wall;

  const floorTexInstance = useMemo(() => {
    const t = baseFloorTex.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, w / 1.4), Math.max(1, d / 1.4));
    t.anisotropy = 8;
    return t;
  }, [baseFloorTex, w, d]);

  const floorRoughInstance = useMemo(() => {
    const t = baseRoughTex.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, w / 1.4), Math.max(1, d / 1.4));
    return t;
  }, [baseRoughTex, w, d]);

  const wallRoughInstance = useMemo(() => {
    const t = wallRoughTex.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, w / 1.2), 2);
    return t;
  }, [wallRoughTex, w]);

  const doorSlots = useMemo(
    () => computeDoorSlots(node.roomId, graph, w, d),
    [node.roomId, graph, w, d],
  );
  const windowSlots = useMemo(
    () => computeWindowSlots(node.roomId, graph, w, d, doorSlots),
    [node.roomId, graph, w, d, doorSlots],
  );

  const floorTint = isSelected ? SELECTED_FLOOR : isHovered ? "#FAF3E4" : "#ffffff";
  const wallTint = isSelected ? "#FDF3DB" : isHovered ? "#FCF8EE" : "#ffffff";
  const floorRoughness = isSelected ? 0.45 : floorKind === "wood" ? 0.55 : 0.4;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();
  };

  const showHoverLabel = isHovered && !isSelected;

  const floorTopY = 0;
  const floorThickness = floorTopY - BUILDING_BASE_Y;
  const floorCentreY = (floorTopY + BUILDING_BASE_Y) / 2;

  const wallGaps = (
    wallSide: WallSide,
    wallLength: number,
  ): Array<{ start: number; end: number }> => {
    const gaps: Array<{ start: number; end: number }> = [];
    doorSlots
      .filter((ds) => ds.wallSide === wallSide)
      .forEach((ds) => {
        const along =
          wallSide === "TOP" || wallSide === "BOTTOM"
            ? ds.localX + w / 2
            : ds.localZ + d / 2;
        gaps.push({
          start: Math.max(0, along - ds.width / 2 - 0.03),
          end: Math.min(wallLength, along + ds.width / 2 + 0.03),
        });
      });
    gaps.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];
    gaps.forEach((g) => {
      const last = merged[merged.length - 1];
      if (last && g.start <= last.end) {
        last.end = Math.max(last.end, g.end);
      } else {
        merged.push({ ...g });
      }
    });
    return merged;
  };

  const emitWallSegments = (
    wallSide: WallSide,
    wallLength: number,
    positionAlongAxis: number,
    horizontal: boolean,
  ) => {
    const gaps = wallGaps(wallSide, wallLength);
    const segments: Array<{ start: number; length: number }> = [];
    let cursor = 0;
    gaps.forEach((g) => {
      if (g.start > cursor + 0.001)
        segments.push({ start: cursor, length: g.start - cursor });
      cursor = Math.max(cursor, g.end);
    });
    if (cursor < wallLength - 0.001)
      segments.push({ start: cursor, length: wallLength - cursor });

    return segments.map((seg, i) => {
      const segCentreAlong = seg.start + seg.length / 2;
      const alongWorld = -wallLength / 2 + segCentreAlong;
      let px: number, pz: number, sx: number, sz: number;
      if (horizontal) {
        px = alongWorld;
        pz = positionAlongAxis;
        sx = seg.length;
        sz = WALL_THICKNESS;
      } else {
        px = positionAlongAxis;
        pz = alongWorld;
        sx = WALL_THICKNESS;
        sz = seg.length;
      }
      return (
        <mesh
          key={`wall-${wallSide}-${i}`}
          position={[px, WALL_HEIGHT / 2, pz]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[sx, WALL_HEIGHT, sz]} />
          <meshStandardMaterial
            map={wallTex}
            roughnessMap={wallRoughInstance}
            color={wallTint}
            roughness={0.88}
            metalness={0.0}
          />
        </mesh>
      );
    });
  };

  const emitLintels = (
    wallSide: WallSide,
    positionAlongAxis: number,
    horizontal: boolean,
  ) => {
    return doorSlots
      .filter((ds) => ds.wallSide === wallSide)
      .map((ds, i) => {
        const alongWorld =
          wallSide === "TOP" || wallSide === "BOTTOM" ? ds.localX : ds.localZ;
        const lintelHeight = WALL_HEIGHT - DOOR_HEIGHT;
        let px: number, pz: number, sx: number, sz: number;
        if (horizontal) {
          px = alongWorld;
          pz = positionAlongAxis;
          sx = ds.width + 0.06;
          sz = WALL_THICKNESS;
        } else {
          px = positionAlongAxis;
          pz = alongWorld;
          sx = WALL_THICKNESS;
          sz = ds.width + 0.06;
        }
        return (
          <mesh
            key={`lintel-${wallSide}-${i}`}
            position={[px, DOOR_HEIGHT + lintelHeight / 2, pz]}
            receiveShadow
            castShadow
          >
            <boxGeometry args={[sx, lintelHeight, sz]} />
            <meshStandardMaterial
              map={wallTex}
              roughnessMap={wallRoughInstance}
              color={wallTint}
              roughness={0.88}
              metalness={0.0}
            />
          </mesh>
        );
      });
  };

  return (
    <group
      position={[x + w / 2, 0, z + d / 2]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHoverIn();
      }}
      onPointerOut={onHoverOut}
    >
      <mesh position={[0, floorCentreY, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, floorThickness, d]} />
        <meshStandardMaterial
          map={floorTexInstance}
          roughnessMap={floorRoughInstance}
          color={floorTint}
          roughness={floorRoughness}
          metalness={0.02}
        />
      </mesh>

      {isSelected && <SelectionGlow w={w} d={d} />}

      {room ? <RoomFurniture room={room} w={w} d={d} /> : null}

      {emitWallSegments("TOP", w - WALL_THICKNESS, -d / 2 + WALL_THICKNESS / 2, true)}
      {emitWallSegments("BOTTOM", w - WALL_THICKNESS, d / 2 - WALL_THICKNESS / 2, true)}
      {emitWallSegments("LEFT", d - WALL_THICKNESS, -w / 2 + WALL_THICKNESS / 2, false)}
      {emitWallSegments("RIGHT", d - WALL_THICKNESS, w / 2 - WALL_THICKNESS / 2, false)}

      {emitLintels("TOP", -d / 2 + WALL_THICKNESS / 2, true)}
      {emitLintels("BOTTOM", d / 2 - WALL_THICKNESS / 2, true)}
      {emitLintels("LEFT", -w / 2 + WALL_THICKNESS / 2, false)}
      {emitLintels("RIGHT", w / 2 - WALL_THICKNESS / 2, false)}

      {doorSlots
        .filter((ds) => ds.otherRoomId > node.roomId)
        .map((ds, i) => (
          <DoorPanel key={`door-${i}`} slot={ds} />
        ))}

      {windowSlots.map((ws, i) => (
        <WindowPanel key={`window-${i}`} slot={ws} />
      ))}

      {/* Baseboards */}
      {[
        { side: "TOP" as const, wallLength: w - WALL_THICKNESS, pos: -d / 2 + WALL_THICKNESS - 0.01, horizontal: true },
        { side: "BOTTOM" as const, wallLength: w - WALL_THICKNESS, pos: d / 2 - WALL_THICKNESS + 0.01, horizontal: true },
        { side: "LEFT" as const, wallLength: d - WALL_THICKNESS, pos: -w / 2 + WALL_THICKNESS - 0.01, horizontal: false },
        { side: "RIGHT" as const, wallLength: d - WALL_THICKNESS, pos: w / 2 - WALL_THICKNESS + 0.01, horizontal: false },
      ].flatMap(({ side, wallLength, pos, horizontal }, wallIdx) => {
        const gaps = wallGaps(side, wallLength);
        const segments: Array<{ start: number; length: number }> = [];
        let cursor = 0;
        gaps.forEach((g) => {
          if (g.start > cursor + 0.001)
            segments.push({ start: cursor, length: g.start - cursor });
          cursor = Math.max(cursor, g.end);
        });
        if (cursor < wallLength - 0.001)
          segments.push({ start: cursor, length: wallLength - cursor });
        return segments.map((seg, i) => {
          const segCentre = seg.start + seg.length / 2;
          const alongWorld = -wallLength / 2 + segCentre;
          let px: number, pz: number, sx: number, sz: number;
          if (horizontal) {
            px = alongWorld;
            pz = pos;
            sx = seg.length;
            sz = 0.03;
          } else {
            px = pos;
            pz = alongWorld;
            sx = 0.03;
            sz = seg.length;
          }
          return (
            <mesh key={`base-${wallIdx}-${i}`} position={[px, 0.08, pz]}>
              <boxGeometry args={[sx, 0.16, sz]} />
              <meshStandardMaterial
                color="#F5F2EC"
                roughness={0.45}
                metalness={0.02}
              />
            </mesh>
          );
        });
      })}

      {/* Crown accent */}
      {[
        { side: "TOP" as const, wallLength: w - WALL_THICKNESS, pos: -d / 2 + WALL_THICKNESS / 2, horizontal: true },
        { side: "BOTTOM" as const, wallLength: w - WALL_THICKNESS, pos: d / 2 - WALL_THICKNESS / 2, horizontal: true },
        { side: "LEFT" as const, wallLength: d - WALL_THICKNESS, pos: -w / 2 + WALL_THICKNESS / 2, horizontal: false },
        { side: "RIGHT" as const, wallLength: d - WALL_THICKNESS, pos: w / 2 - WALL_THICKNESS / 2, horizontal: false },
      ].flatMap(({ side, wallLength, pos, horizontal }, wallIdx) => {
        const gaps = wallGaps(side, wallLength);
        const segments: Array<{ start: number; length: number }> = [];
        let cursor = 0;
        gaps.forEach((g) => {
          if (g.start > cursor + 0.001)
            segments.push({ start: cursor, length: g.start - cursor });
          cursor = Math.max(cursor, g.end);
        });
        if (cursor < wallLength - 0.001)
          segments.push({ start: cursor, length: wallLength - cursor });
        return segments.map((seg, i) => {
          const segCentre = seg.start + seg.length / 2;
          const alongWorld = -wallLength / 2 + segCentre;
          let px: number, pz: number, sx: number, sz: number;
          if (horizontal) {
            px = alongWorld;
            pz = pos;
            sx = seg.length;
            sz = WALL_THICKNESS + 0.02;
          } else {
            px = pos;
            pz = alongWorld;
            sx = WALL_THICKNESS + 0.02;
            sz = seg.length;
          }
          return (
            <mesh key={`crown-${wallIdx}-${i}`} position={[px, WALL_HEIGHT - 0.05, pz]}>
              <boxGeometry args={[sx, 0.08, sz]} />
              <meshStandardMaterial
                color={accent}
                roughness={0.55}
                metalness={0.08}
              />
            </mesh>
          );
        });
      })}

      {isSelected ? (
        <>
          {[
            [0, 0.02, -d / 2],
            [0, 0.02, d / 2],
            [-w / 2, 0.02, 0],
            [w / 2, 0.02, 0],
            [0, WALL_HEIGHT + 0.02, -d / 2],
            [0, WALL_HEIGHT + 0.02, d / 2],
            [-w / 2, WALL_HEIGHT + 0.02, 0],
            [w / 2, WALL_HEIGHT + 0.02, 0],
          ].map((p, i) => {
            const isTop = i >= 4;
            const isHorizontal = i === 0 || i === 1 || i === 4 || i === 5;
            return (
              <mesh key={`outline-${i}`} position={p as [number, number, number]}>
                <boxGeometry
                  args={
                    isHorizontal
                      ? [w, 0.04, 0.05]
                      : [0.05, 0.04, d]
                  }
                />
                <meshStandardMaterial
                  color={THEME.gold}
                  emissive={THEME.gold}
                  emissiveIntensity={isTop ? 0.55 : 0.7}
                  roughness={0.4}
                />
              </mesh>
            );
          })}
        </>
      ) : null}

      {showHoverLabel ? (
        <Html
          position={[0, WALL_HEIGHT + 0.45, 0]}
          center
          distanceFactor={8}
          zIndexRange={[15, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            style={{
              background: "rgba(4, 52, 76, 0.94)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: 999,
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              letterSpacing: "0.02em",
            }}
          >
            {node.name}
          </div>
        </Html>
      ) : null}

      {isSelected ? (
        <Html
          position={[0, WALL_HEIGHT + 0.45, 0]}
          center
          distanceFactor={8}
          zIndexRange={[15, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            style={{
              background: THEME.gold,
              color: THEME.navy,
              padding: "4px 10px",
              borderRadius: 999,
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 6px 18px rgba(201,145,58,0.55)",
            }}
          >
            {node.name}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

// ============================================================
// Surroundings
// ============================================================

function HedgeBox({
  position,
  width,
  depth,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
}) {
  return (
    <mesh position={[position[0], 0.25, position[2]]} castShadow receiveShadow>
      <boxGeometry args={[width, 0.5, depth]} />
      <meshStandardMaterial color="#3f6b2e" roughness={0.98} />
    </mesh>
  );
}

function Tree({
  position,
  scale = 1,
  barkTexture,
}: {
  position: [number, number, number];
  scale?: number;
  barkTexture: THREE.CanvasTexture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z =
      Math.sin(t * 0.6 + position[0]) * 0.015;
  });
  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.14, 1.4, 12]} />
        <meshStandardMaterial map={barkTexture} color="#7a6244" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshStandardMaterial color="#3d6b2e" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.35, 1.5, 0.15]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.52, 1]} />
        <meshStandardMaterial color="#4d7a3a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.3, 1.55, -0.2]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.46, 1]} />
        <meshStandardMaterial color="#356026" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function Bush({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshStandardMaterial color="#4a7a38" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.2, 0.14, 0.1]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#3d6b2e" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function GroundLevelSurroundings({
  bounds,
  groundSize,
  barkTexture,
  grassTexture,
  concreteTexture,
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  groundSize: number;
  barkTexture: THREE.CanvasTexture;
  grassTexture: THREE.CanvasTexture;
  concreteTexture: THREE.CanvasTexture;
}) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const buildingW = bounds.maxX - bounds.minX;
  const buildingD = bounds.maxZ - bounds.minZ;
  const pathLength = 4;
  const entryZ = centerZ + buildingD / 2 + 1.3;

  const decor = useMemo(() => {
    type Item =
      | { kind: "tree"; pos: [number, number, number]; scale: number }
      | { kind: "bush"; pos: [number, number, number]; scale: number };
    const items: Item[] = [];
    const halfW = groundSize / 2;
    const halfD = groundSize / 2;
    const pad = 1.5;
    const treeCount = Math.max(6, Math.round(groundSize / 4));
    const bushCount = Math.max(10, Math.round(groundSize / 3));

    let seed = 1;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    let attempts = 0;
    while (
      items.filter((i) => i.kind === "tree").length < treeCount &&
      attempts < 300
    ) {
      attempts++;
      const gx = centerX + (rand() - 0.5) * groundSize * 0.92;
      const gz = centerZ + (rand() - 0.5) * groundSize * 0.92;
      const insideX = gx > bounds.minX - pad && gx < bounds.maxX + pad;
      const insideZ = gz > bounds.minZ - pad && gz < bounds.maxZ + pad;
      if (insideX && insideZ) continue;
      if (Math.abs(gx - centerX) > halfW * 0.95) continue;
      if (Math.abs(gz - centerZ) > halfD * 0.95) continue;
      items.push({
        kind: "tree",
        pos: [gx, 0, gz],
        scale: 0.85 + rand() * 0.5,
      });
    }

    for (let i = 0; i < bushCount; i++) {
      const gx = centerX + (rand() - 0.5) * groundSize * 0.94;
      const gz = centerZ + (rand() - 0.5) * groundSize * 0.94;
      const insideX = gx > bounds.minX - 0.8 && gx < bounds.maxX + 0.8;
      const insideZ = gz > bounds.minZ - 0.8 && gz < bounds.maxZ + 0.8;
      if (insideX && insideZ) continue;
      items.push({
        kind: "bush",
        pos: [gx, 0, gz],
        scale: 0.7 + rand() * 0.6,
      });
    }

    return items;
  }, [bounds, groundSize, centerX, centerZ]);

  return (
    <group>
      <mesh
        position={[centerX, GROUND_Y, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial map={grassTexture} roughness={1} metalness={0} />
      </mesh>

      <mesh
        position={[centerX, GROUND_Y + 0.005, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[buildingW + 1.6, buildingD + 1.6]} />
        <meshStandardMaterial
          map={concreteTexture}
          color="#d9d3c7"
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      <mesh
        position={[centerX, GROUND_Y + 0.015, entryZ + pathLength / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1.6, pathLength]} />
        <meshStandardMaterial
          map={concreteTexture}
          color="#BFB3A2"
          roughness={0.88}
        />
      </mesh>

      <HedgeBox
        position={[centerX, GROUND_Y, centerZ - (buildingD / 2 + 1.3)]}
        width={buildingW + 2.2}
        depth={0.5}
      />
      <HedgeBox
        position={[centerX, GROUND_Y, entryZ]}
        width={buildingW + 2.2}
        depth={0.5}
      />

      <FlowerBed
        x={centerX - buildingW / 2 - 0.6}
        z={entryZ - 0.4}
        w={1.4}
        d={0.5}
      />
      <FlowerBed
        x={centerX + buildingW / 2 + 0.6}
        z={entryZ - 0.4}
        w={1.4}
        d={0.5}
      />
      <Bench x={centerX + buildingW / 2 + 1.8} z={entryZ + 1.4} rotY={Math.PI / 2} />
      <LampPost x={centerX - 1.2} z={entryZ + pathLength - 0.3} />
      <LampPost x={centerX + 1.2} z={entryZ + pathLength - 0.3} />

      {decor.map((item, i) =>
        item.kind === "tree" ? (
          <Tree
            key={`t-${i}`}
            position={item.pos}
            scale={item.scale}
            barkTexture={barkTexture}
          />
        ) : (
          <Bush key={`b-${i}`} position={item.pos} scale={item.scale} />
        ),
      )}
    </group>
  );
}

function UpperLevelSurroundings({
  bounds,
  deckWoodTexture,
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  deckWoodTexture: THREE.CanvasTexture;
}) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const buildingW = bounds.maxX - bounds.minX;
  const buildingD = bounds.maxZ - bounds.minZ;
  const pad = 1.4;
  const deckW = buildingW + pad * 2;
  const deckD = buildingD + pad * 2;

  const deckTexInstance = useMemo(() => {
    const t = deckWoodTexture.clone();
    t.needsUpdate = true;
    t.repeat.set(deckW / 1.4, deckD / 1.4);
    t.anisotropy = 8;
    return t;
  }, [deckWoodTexture, deckW, deckD]);

  const columnOffsets = useMemo(() => {
    const hx = deckW / 2 - 0.35;
    const hz = deckD / 2 - 0.35;
    return [
      [-hx, -hz],
      [hx, -hz],
      [-hx, hz],
      [hx, hz],
      [0, -hz],
      [0, hz],
    ] as [number, number][];
  }, [deckW, deckD]);

  return (
    <group>
      {columnOffsets.map(([ox, oz], i) => (
        <mesh
          key={i}
          position={[centerX + ox, -3.1, centerZ + oz]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.32, 6.2, 0.32]} />
          <meshStandardMaterial
            color="#A79C88"
            roughness={0.85}
            metalness={0.02}
          />
        </mesh>
      ))}
      <mesh position={[centerX, -0.22, centerZ]} receiveShadow castShadow>
        <boxGeometry args={[deckW, 0.34, deckD]} />
        <meshStandardMaterial color="#CFC7B4" roughness={0.92} />
      </mesh>
      <mesh
        position={[centerX, -0.045, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[deckW, deckD]} />
        <meshStandardMaterial
          map={deckTexInstance}
          color="#B98F63"
          roughness={0.68}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// Main component
// ============================================================

interface FloorPlan3DViewProps {
  floor: Floor;
  rooms: Room[];
  graph: FloorPlanGraph;
  onRoomClick?: (roomId: number) => void;
}

export default function FloorPlan3DView({
  floor,
  rooms,
  graph,
  onRoomClick,
}: FloorPlan3DViewProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<number | null>(null);

  const {
    grassTex: gTex,
    barkTex: bTex,
    concreteTex: cTex,
    woodFloorTex,
    tileFloorTex,
    woodRoughnessTex,
    tileRoughnessTex,
    wallRoughnessTex,
  } = useSharedTextures();

  const isGroundFloor = floor.floorNumber <= 1;

  const bounds = useMemo(() => {
    if (graph.nodes.length === 0) {
      return {
        minX: 0,
        maxX: 0,
        minZ: 0,
        maxZ: 0,
        center: [0, 0, 0] as [number, number, number],
      };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    graph.nodes.forEach((n) => {
      if (n.gridX === null || n.gridY === null) return;
      if (n.widthUnits === null || n.heightUnits === null) return;
      minX = Math.min(minX, n.gridX * UNIT_SIZE);
      maxX = Math.max(maxX, (n.gridX + n.widthUnits) * UNIT_SIZE);
      minZ = Math.min(minZ, n.gridY * UNIT_SIZE);
      maxZ = Math.max(maxZ, (n.gridY + n.heightUnits) * UNIT_SIZE);
    });
    if (!Number.isFinite(minX)) {
      return {
        minX: 0,
        maxX: 0,
        minZ: 0,
        maxZ: 0,
        center: [0, 0, 0] as [number, number, number],
      };
    }
    return {
      minX,
      maxX,
      minZ,
      maxZ,
      center: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2] as [
        number,
        number,
        number,
      ],
    };
  }, [graph]);

  const colourIndexByRoom = useMemo(() => {
    const map = new Map<number, number>();
    graph.nodes.forEach((n, i) => map.set(n.roomId, i));
    return map;
  }, [graph]);

  const roomByRoomId = useMemo(() => {
    const map = new Map<number, Room>();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  const selectedRoom = useMemo(
    () =>
      graph.nodes.find(
        (n) => n.roomId === selectedRoomId && !n.isStaircase,
      ) ?? null,
    [graph.nodes, selectedRoomId],
  );

  const handleSelect = (roomId: number) => {
    setSelectedRoomId((current) => (current === roomId ? null : roomId));
  };

  const handleStepInside = () => {
    if (!selectedRoomId) return;
    onRoomClick?.(selectedRoomId);
  };

  if (graph.nodes.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "620px",
          borderRadius: "12px",
          background: THEME.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: THEME.faint,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "14px",
        }}
      >
        No rooms to display in 3D yet.
      </div>
    );
  }

  const buildingW = bounds.maxX - bounds.minX;
  const buildingD = bounds.maxZ - bounds.minZ;
  const maxBuildingDim = Math.max(buildingW, buildingD, 1);
  const groundSize = maxBuildingDim * (isGroundFloor ? 2.2 : 1.8) + 4;

  return (
    <div
      style={{
        width: "100%",
        height: "620px",
        borderRadius: "12px",
        overflow: "hidden",
        background: isGroundFloor ? THEME.bg : "#dbe6f0",
        position: "relative",
      }}
    >
      <Canvas
        shadows="variance"
        dpr={[1, 1.5]}
        camera={{
          position: [bounds.center[0] + 8, 10, bounds.center[2] + 8],
          fov: 42,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.72,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
        }}
      >
        <SoftShadows size={20} samples={12} focus={1.3} />

        <Environment
          preset={isGroundFloor ? "park" : "sunset"}
          background={false}
          environmentIntensity={1.15}
        />

        <ambientLight intensity={0.14} />
        <hemisphereLight args={["#dfe8f5", "#c8bfa8", 0.22]} />

        <directionalLight
          position={[14, 20, 10]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-near={1}
          shadow-camera-far={80}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          color="#fff4e0"
        />

        {isGroundFloor && (
          <Sky
            distance={450000}
            sunPosition={[10, 12, 6]}
            inclination={0.55}
            azimuth={0.25}
            turbidity={6}
            rayleigh={1.2}
            mieCoefficient={0.012}
            mieDirectionalG={0.85}
          />
        )}

        {isGroundFloor ? (
          <GroundLevelSurroundings
            bounds={bounds}
            groundSize={groundSize}
            barkTexture={bTex}
            grassTexture={gTex}
            concreteTexture={cTex}
          />
        ) : (
          <UpperLevelSurroundings bounds={bounds} deckWoodTexture={woodFloorTex} />
        )}

        {graph.nodes.map((node) => {
          if (node.isStaircase) {
            return <Staircase3D key={`stair-`} node={node} />;
          }
          return (
            <Room3D
              key={node.roomId}
              node={node}
              room={roomByRoomId.get(node.roomId)}
              graph={graph}
              colourIndex={colourIndexByRoom.get(node.roomId) ?? 0}
              isSelected={selectedRoomId === node.roomId}
              isHovered={hoveredRoomId === node.roomId}
              onSelect={() => handleSelect(node.roomId)}
              onHoverIn={() => setHoveredRoomId(node.roomId)}
              onHoverOut={() =>
                setHoveredRoomId((current) =>
                  current === node.roomId ? null : current,
                )
              }
              woodTex={woodFloorTex}
              tileTex={tileFloorTex}
              woodRoughTex={woodRoughnessTex}
              tileRoughTex={tileRoughnessTex}
              wallRoughTex={wallRoughnessTex}
            />
          );
        })}

        <ContactShadows
          position={[bounds.center[0], GROUND_Y + 0.02, bounds.center[2]]}
          opacity={0.62}
          scale={maxBuildingDim * 2.0}
          blur={2.6}
          far={6}
          resolution={512}
        />

        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO
            aoRadius={2.0}
            distanceFalloff={1.0}
            intensity={1.4}
            quality="performance"
            aoSamples={8}
            denoiseSamples={4}
            denoiseRadius={10}
            halfRes={true}
            color="#1a1a1a"
          />
          <Bloom
            intensity={0.28}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.15} darkness={0.5} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>

        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={5}
          maxDistance={maxBuildingDim * 3.5}
          target={[bounds.center[0], 0, bounds.center[2]]}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {selectedRoom ? (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(4, 52, 76, 0.94)",
            backdropFilter: "blur(10px)",
            color: "#FFFFFF",
            padding: "10px 14px",
            borderRadius: "12px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            zIndex: 20,
            minWidth: 220,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: THEME.gold,
                  boxShadow: `0 0 8px ${THEME.gold}`,
                }}
              />
              <span style={{ fontWeight: 700 }}>{selectedRoom.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRoomId(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
              }}
              aria-label="Clear selection"
            >
              ×
            </button>
          </div>

          <button
            type="button"
            onClick={handleStepInside}
            style={{
              background: `linear-gradient(to right, ${THEME.gold}, #b07c22)`,
              color: THEME.navy,
              border: "none",
              borderRadius: 999,
              padding: "10px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            Step inside →
          </button>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(250, 249, 247, 0.92)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(4, 52, 76, 0.1)",
          borderRadius: "10px",
          padding: "8px 12px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: THEME.navy,
          zIndex: 20,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: THEME.gold,
            opacity: 0.6,
            marginRight: 8,
          }}
        />
        <span>
          {floor.name} · {graph.nodes.length} rooms
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: "rgba(4, 52, 76, 0.78)",
          color: "#FFFFFF",
          padding: "6px 12px",
          borderRadius: "8px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        Drag to rotate · Scroll to zoom · Hover a room · Click to select
      </div>
    </div>
  );
}
