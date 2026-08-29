export interface Floor {
  id: number;
  floorNumber: number;
  name: string;
}

export interface Room {
  id: number;
  floorId: number;
  roomName: string;
  roomType: string;
}

export interface Panorama {
  id: number;
  roomId: number;
  imageUrl: string;
  captureOrder: number;
  isPrimary: boolean;
  resolution: string | null;
}

export type Direction = "NORTH" | "SOUTH" | "EAST" | "WEST";

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