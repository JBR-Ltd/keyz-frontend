// src/lib/api/tours/panoramas.ts

import type { Panorama } from "@/lib/types/tour";
import { tourRequest } from "./utils";

// === Helpers

// Vercel rejects request bodies over 4.5MB before they reach the API
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
// iOS Safari refuses to draw a canvas larger than about 16.7 million pixels
const MAX_CANVAS_PIXELS = 16_000_000;
const JPEG_QUALITIES = [0.9, 0.8, 0.7, 0.6];

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

async function shrinkPanorama(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;

  // Browsers that cannot decode the file (HEIC outside Safari) send it as is
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(
    1,
    Math.sqrt(MAX_CANVAS_PIXELS / (bitmap.width * bitmap.height)),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  for (const quality of JPEG_QUALITIES) {
    const blob = await canvasToJpeg(canvas, quality);
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], name, { type: "image/jpeg" });
    }
  }

  return file;
}

// === Requests

/**
 * Uploads a swept panorama. The multipart body is forwarded as raw bytes by
 * the proxy, so the boundary and image data survive the hop to Java. The
 * server validates with the Python service, uploads via StorageService, then
 * sets the room READY — the client never touches status.
 */
export async function uploadPanorama(
  roomId: number,
  file: File,
): Promise<Panorama> {
  const upload = await shrinkPanorama(file);
  const formData = new FormData();
  formData.append("file", upload, upload.name);

  return tourRequest<Panorama>(`/api/tours/rooms/${roomId}/panoramas`, {
    method: "POST",
    body: formData,
  });
}

export async function getPanoramasForRoom(roomId: number): Promise<Panorama[]> {
  return tourRequest<Panorama[]>(`/api/tours/rooms/${roomId}/panoramas`);
}

/** Remove one panorama. If it was the last, the room reverts to EMPTY. */
export async function deletePanorama(panoramaId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/panoramas/${panoramaId}`, {
    method: "DELETE",
  });
}

/** Promote a panorama to be the room's display image. */
export async function setPrimaryPanorama(panoramaId: number): Promise<void> {
  await tourRequest<null>(`/api/tours/panoramas/${panoramaId}/primary`, {
    method: "PATCH",
  });
}
