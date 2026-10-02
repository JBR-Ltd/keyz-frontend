// src/lib/simpleBlueprint.ts
//
// Renders the SVG blueprint for a floor plan. Consumes the exact shape the
// backend returns from GET /api/tours/floors/{id}/floor-plan — nodes carry
// their own gridX / gridY / widthUnits / heightUnits / isStaircase, and
// edges carry compass direction. No frontend layout math needed.

import type {
  CompassDirection,
  FloorPlanGraph,
  FloorPlanGraphEdge,
  FloorPlanGraphNode,
  Room,
  WallSide,
} from "@/lib/types/tour";

const CELL_PX = 130;
const WALL_COLOR = "#2C3E50";
const OUTER_WALL = 8;
const INNER_WALL = 3;

const ROOM_COLORS = [
  "#E8F0FE",
  "#E8F5E9",
  "#FFF3E0",
  "#F3E5F5",
  "#FFFDE7",
  "#E0F7FA",
  "#FCE4EC",
  "#E8EAF6",
];

function isHorizontalCompass(c: CompassDirection): boolean {
  return c === "N" || c === "S";
}

function compassToWall(c: CompassDirection): WallSide {
  switch (c) {
    case "N":
      return "TOP";
    case "E":
      return "RIGHT";
    case "S":
      return "BOTTOM";
    case "W":
      return "LEFT";
  }
}

interface PlacedNode {
  roomId: number;
  gridX: number;
  gridY: number;
  widthUnits: number;
  heightUnits: number;
  isStaircase: boolean;
  name: string;
  roomType: string;
  sizeBucket: string;
}

function isPlaced(
  node: FloorPlanGraphNode,
): node is FloorPlanGraphNode & {
  gridX: number;
  gridY: number;
  widthUnits: number;
  heightUnits: number;
} {
  return (
    node.gridX !== null &&
    node.gridY !== null &&
    node.widthUnits !== null &&
    node.heightUnits !== null
  );
}

export function generateSimpleBlueprint(
  floorPlan: FloorPlanGraph,
  rooms: Room[],
): string {
  const placed: PlacedNode[] = floorPlan.nodes
    .filter(isPlaced)
    .map((node) => ({
      roomId: node.roomId,
      gridX: node.gridX,
      gridY: node.gridY,
      widthUnits: node.widthUnits,
      heightUnits: node.heightUnits,
      isStaircase: node.isStaircase,
      name: node.name,
      roomType: node.roomType,
      sizeBucket: node.sizeBucket,
    }));

  if (placed.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <text x="200" y="100" text-anchor="middle" font-size="13" fill="#8A99A4" font-family="'DM Sans', sans-serif">
        No rooms placed on this floor plan yet
      </text>
    </svg>`;
  }

  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const nodeByRoom = new Map(placed.map((n) => [n.roomId, n]));

  // ---- Grid bounds ----
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  placed.forEach((n) => {
    minX = Math.min(minX, n.gridX);
    minY = Math.min(minY, n.gridY);
    maxX = Math.max(maxX, n.gridX + n.widthUnits);
    maxY = Math.max(maxY, n.gridY + n.heightUnits);
  });

  const PAD = 90;
  const viewW = (maxX - minX) * CELL_PX + PAD * 2;
  const viewH = (maxY - minY) * CELL_PX + PAD * 2 + 90;

  const px = (u: number) => (u - minX) * CELL_PX + PAD;
  const py = (v: number) => (v - minY) * CELL_PX + PAD;

  const wallX = px(minX);
  const wallY = py(minY);
  const wallW = (maxX - minX) * CELL_PX;
  const wallH = (maxY - minY) * CELL_PX;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}"
    style="background: #F5F3EF; font-family: 'DM Sans', sans-serif;">
    <defs>
      <pattern id="checker" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#E8E5DF"/>
        <rect x="10" y="10" width="10" height="10" fill="#E8E5DF"/>
        <rect x="10" width="10" height="10" fill="#F2F0EB"/>
        <rect y="10" width="10" height="10" fill="#F2F0EB"/>
      </pattern>
    </defs>
    <rect width="${viewW}" height="${viewH}" fill="url(#checker)"/>
  `;

  // ---- 1. Room fills (skip staircases) ----
  let roomIndex = 0;
  placed
    .filter((n) => !n.isStaircase)
    .forEach((n) => {
      const x = px(n.gridX);
      const y = py(n.gridY);
      const w = n.widthUnits * CELL_PX;
      const h = n.heightUnits * CELL_PX;
      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ROOM_COLORS[roomIndex % ROOM_COLORS.length]}"/>`;
      roomIndex++;
    });

  // ---- 1b. Staircase fills + treads + arrow ----
  placed
    .filter((n) => n.isStaircase)
    .forEach((n) => {
      const x = px(n.gridX);
      const y = py(n.gridY);
      const w = n.widthUnits * CELL_PX;
      const h = n.heightUnits * CELL_PX;

      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#EDEDED"/>`;

      const treadCount = Math.max(4, Math.round((w > h ? w : h) / 22));
      const stairColor = "#7A7A7A";
      if (w >= h) {
        for (let i = 1; i < treadCount; i++) {
          const tx = x + (w / treadCount) * i;
          svg += `<line x1="${tx}" y1="${y + 4}" x2="${tx}" y2="${y + h - 4}" stroke="${stairColor}" stroke-width="1" opacity="0.55"/>`;
        }
      } else {
        for (let i = 1; i < treadCount; i++) {
          const ty = y + (h / treadCount) * i;
          svg += `<line x1="${x + 4}" y1="${ty}" x2="${x + w - 4}" y2="${ty}" stroke="${stairColor}" stroke-width="1" opacity="0.55"/>`;
        }
      }

      const cx = x + w / 2;
      const cy = y + h / 2;
      const arrowColor = "#2C3E50";
      if (w >= h) {
        svg += `<line x1="${x + 8}" y1="${cy}" x2="${x + w - 8}" y2="${cy}" stroke="${arrowColor}" stroke-width="1.6"/>`;
        svg += `<polygon points="${x + w - 8},${cy} ${x + w - 16},${cy - 5} ${x + w - 16},${cy + 5}" fill="${arrowColor}"/>`;
      } else {
        svg += `<line x1="${cx}" y1="${y + h - 8}" x2="${cx}" y2="${y + 8}" stroke="${arrowColor}" stroke-width="1.6"/>`;
        svg += `<polygon points="${cx},${y + 8} ${cx - 5},${y + 16} ${cx + 5},${y + 16}" fill="${arrowColor}"/>`;
      }

      const fontSize = Math.max(9, Math.min(13, Math.min(w, h) / 12));
      svg += `<text x="${cx}" y="${y + h - 4}" text-anchor="middle" font-size="${fontSize}" font-weight="600" fill="${arrowColor}">Stair</text>`;
    });

  // ---- 2. Outer wall (thick) ----
  svg += `<rect x="${wallX}" y="${wallY}" width="${wallW}" height="${wallH}"
    fill="none" stroke="${WALL_COLOR}" stroke-width="${OUTER_WALL}"/>`;

  // ---- 3. Inner room outlines (skip staircases) ----
  placed
    .filter((n) => !n.isStaircase)
    .forEach((n) => {
      const x = px(n.gridX);
      const y = py(n.gridY);
      const w = n.widthUnits * CELL_PX;
      const h = n.heightUnits * CELL_PX;
      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"
        stroke="${WALL_COLOR}" stroke-width="${INNER_WALL}"/>`;
    });

  // ---- 3b. Staircase outlines: dashed ----
  placed
    .filter((n) => n.isStaircase)
    .forEach((n) => {
      const x = px(n.gridX);
      const y = py(n.gridY);
      const w = n.widthUnits * CELL_PX;
      const h = n.heightUnits * CELL_PX;
      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"
        stroke="${WALL_COLOR}" stroke-width="${INNER_WALL}" stroke-dasharray="4,3"/>`;
    });

  // ---- 4. Doorways ----
  floorPlan.edges.forEach((edge) => {
    const node = nodeByRoom.get(edge.fromRoomId);
    if (!node) return;

    const compass: CompassDirection | null = edge.compassDirection;
    if (!compass) return;

    const room = roomById.get(edge.fromRoomId);
    if (!room) return;

    const x = px(node.gridX);
    const y = py(node.gridY);
    const w = node.widthUnits * CELL_PX;
    const h = node.heightUnits * CELL_PX;

    const isOpening = edge.kind === "OPENING";
    const along =
      Math.max(0, Math.min(100, edge.alongWallPercent ?? 50)) / 100;

    const onHorizontalWall = isHorizontalCompass(compass);
    const wallLengthPx = onHorizontalWall ? w : h;
    const doorSize = Math.max(20, wallLengthPx * (isOpening ? 0.32 : 0.24));

    let dx = x;
    let dy = y;
    let cutX = 0;
    let cutY = 0;
    let cutW = 0;
    let cutH = 0;
    let pivotX = 0;
    let pivotY = 0;
    let leafEndX = 0;
    let leafEndY = 0;

    switch (compass) {
      case "N":
        dx = x + along * w - doorSize / 2;
        dy = y;
        cutX = dx; cutY = y - INNER_WALL;
        cutW = doorSize; cutH = INNER_WALL * 2;
        pivotX = dx; pivotY = y;
        leafEndX = pivotX; leafEndY = pivotY - doorSize;
        break;
      case "S":
        dx = x + along * w - doorSize / 2;
        dy = y + h;
        cutX = dx; cutY = y + h - INNER_WALL;
        cutW = doorSize; cutH = INNER_WALL * 2;
        pivotX = dx + doorSize; pivotY = y + h;
        leafEndX = pivotX; leafEndY = pivotY + doorSize;
        break;
      case "W":
        dx = x;
        dy = y + along * h - doorSize / 2;
        cutX = x - INNER_WALL; cutY = dy;
        cutW = INNER_WALL * 2; cutH = doorSize;
        pivotX = x; pivotY = dy + doorSize;
        leafEndX = pivotX - doorSize; leafEndY = pivotY;
        break;
      case "E":
        dx = x + w;
        dy = y + along * h - doorSize / 2;
        cutX = x + w - INNER_WALL; cutY = dy;
        cutW = INNER_WALL * 2; cutH = doorSize;
        pivotX = x + w; pivotY = dy;
        leafEndX = pivotX + doorSize; leafEndY = pivotY;
        break;
    }

    svg += `<rect x="${cutX}" y="${cutY}" width="${cutW}" height="${cutH}" fill="#FFFFFF" stroke="none"/>`;

    if (isOpening) {
      const t = 8;
      if (onHorizontalWall) {
        svg += `<line x1="${dx}" y1="${dy - t / 2}" x2="${dx}" y2="${dy + t / 2}" stroke="${WALL_COLOR}" stroke-width="1.4"/>`;
        svg += `<line x1="${dx + doorSize}" y1="${dy - t / 2}" x2="${dx + doorSize}" y2="${dy + t / 2}" stroke="${WALL_COLOR}" stroke-width="1.4"/>`;
      } else {
        svg += `<line x1="${dx - t / 2}" y1="${dy}" x2="${dx + t / 2}" y2="${dy}" stroke="${WALL_COLOR}" stroke-width="1.4"/>`;
        svg += `<line x1="${dx - t / 2}" y1="${dy + doorSize}" x2="${dx + t / 2}" y2="${dy + doorSize}" stroke="${WALL_COLOR}" stroke-width="1.4"/>`;
      }
    } else {
      svg += `<line x1="${pivotX}" y1="${pivotY}" x2="${leafEndX}" y2="${leafEndY}" stroke="${WALL_COLOR}" stroke-width="1.8" stroke-linecap="round"/>`;
      svg += `<path d="M ${pivotX} ${pivotY} A ${doorSize} ${doorSize} 0 0 1 ${leafEndX} ${leafEndY}" fill="none" stroke="${WALL_COLOR}" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.7"/>`;
      svg += `<circle cx="${pivotX}" cy="${pivotY}" r="1.8" fill="${WALL_COLOR}"/>`;
    }
  });

  // ---- 5. Room labels + size badge (skip staircases) ----
  placed
    .filter((n) => !n.isStaircase)
    .forEach((n) => {
      const x = px(n.gridX);
      const y = py(n.gridY);
      const w = n.widthUnits * CELL_PX;
      const h = n.heightUnits * CELL_PX;

      const fontSize = Math.max(10, Math.min(15, Math.min(w, h) / 11));
      const words = n.name.split(" ");
      const wrap = n.name.length > 14 && words.length > 1;

      if (wrap) {
        const mid = Math.ceil(words.length / 2);
        const l1 = words.slice(0, mid).join(" ");
        const l2 = words.slice(mid).join(" ");
        const lh = fontSize * 1.25;
        svg += `<text x="${x + w / 2}" y="${y + h / 2 - lh / 2 + 4}" text-anchor="middle" font-size="${fontSize}" font-weight="600" fill="#2C3E50">${l1}</text>`;
        svg += `<text x="${x + w / 2}" y="${y + h / 2 + lh / 2 + 4}" text-anchor="middle" font-size="${fontSize}" font-weight="600" fill="#2C3E50">${l2}</text>`;
      } else {
        svg += `<text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-size="${fontSize}" font-weight="600" fill="#2C3E50">${n.name}</text>`;
      }

      const typeY = y + h / 2 + fontSize + 8;
      svg += `<text x="${x + w / 2}" y="${typeY}" text-anchor="middle" font-size="9" fill="#2C3E50" opacity="0.55">${n.roomType}</text>`;

      const sizeLabel =
        n.sizeBucket === "LARGE" ? "L" : n.sizeBucket === "MEDIUM" ? "M" : "S";
      const sizeColor =
        n.sizeBucket === "LARGE"
          ? "#4A90D9"
          : n.sizeBucket === "MEDIUM"
            ? "#5CB85C"
            : "#F0AD4E";
      svg += `<rect x="${x + w - 26}" y="${y + 10}" width="16" height="16" rx="8" fill="${sizeColor}" opacity="0.2"/>`;
      svg += `<text x="${x + w - 18}" y="${y + 22}" text-anchor="middle" font-size="9" font-weight="700" fill="${sizeColor}">${sizeLabel}</text>`;
    });

  // ---- 6. Dimension line ----
  const dimY = wallY + wallH + 28;
  svg += `<line x1="${wallX}" y1="${dimY}" x2="${wallX + wallW}" y2="${dimY}" stroke="#999" stroke-width="1"/>`;
  svg += `<line x1="${wallX}" y1="${dimY - 6}" x2="${wallX}" y2="${dimY + 6}" stroke="#999" stroke-width="1"/>`;
  svg += `<line x1="${wallX + wallW}" y1="${dimY - 6}" x2="${wallX + wallW}" y2="${dimY + 6}" stroke="#999" stroke-width="1"/>`;
  svg += `<text x="${wallX + wallW / 2}" y="${dimY + 18}" text-anchor="middle" font-size="10" fill="#999">~${Math.round(wallW / 45)} m</text>`;

  // ---- 7. Legend ----
  const legendY = dimY + 50;
  svg += `<g transform="translate(${wallX}, ${legendY})">
    <line x1="0" y1="-2" x2="20" y2="-2" stroke="${WALL_COLOR}" stroke-width="1.8"/>
    <text x="25" y="2" font-size="9" fill="#666">Door</text>
    <line x1="75" y1="-2" x2="95" y2="-2" stroke="${WALL_COLOR}" stroke-width="1.4" stroke-dasharray="2,2"/>
    <text x="100" y="2" font-size="9" fill="#666">Opening</text>
    <circle cx="175" cy="-2" r="5" fill="#4A90D9" opacity="0.35"/>
    <text x="185" y="2" font-size="9" fill="#666">L</text>
    <circle cx="205" cy="-2" r="5" fill="#5CB85C" opacity="0.35"/>
    <text x="215" y="2" font-size="9" fill="#666">M</text>
    <circle cx="235" cy="-2" r="5" fill="#F0AD4E" opacity="0.35"/>
    <text x="245" y="2" font-size="9" fill="#666">S</text>
    <line x1="275" y1="-2" x2="295" y2="-2" stroke="${WALL_COLOR}" stroke-width="1.6" stroke-dasharray="4,3"/>
    <text x="300" y="2" font-size="9" fill="#666">Staircase</text>
  </g>`;

  svg += `</svg>`;
  return svg;
}
