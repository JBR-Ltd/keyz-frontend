// src/lib/api/tours/panoramas.ts

import type { Panorama } from "@/lib/types/tour";
import { tourRequest } from "./utils";

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
  const formData = new FormData();
  formData.append("file", file, file.name);

  return tourRequest<Panorama>(`/api/tours/rooms/${roomId}/panoramas`, {
    method: "POST",
    body: formData,
  });
}

export async function getPanoramasForRoom(
  roomId: number,
): Promise<Panorama[]> {
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
