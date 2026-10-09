// src/app/tours/[publicId]/floor-plan/page.tsx
//
// The standalone floor plan. Reads the public bundle, which already carries
// the placements and staircases for every confirmed floor, so this page
// needs no owner-only endpoints and works for a signed-out visitor on a
// published tour.
//
// The ?view= query param picks the initial tab. `?view=3d` opens straight
// on the 3D walkthrough; anything else (or nothing) opens on Blueprint.

import { notFound } from "next/navigation";
import FloorPlanPageClient from "./FloorPlanPageClient";

interface FloorPlanPageProps {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ floor?: string; view?: string }>;
}

export default async function FloorPlanPage({
  params,
  searchParams,
}: FloorPlanPageProps) {
  const { publicId } = await params;
  const { floor, view } = await searchParams;

  if (!publicId || publicId.length === 0) {
    notFound();
  }

  const parsedFloor = floor ? Number(floor) : NaN;
  const initialFloorId =
    Number.isFinite(parsedFloor) && parsedFloor > 0 ? parsedFloor : undefined;
  const initialViewMode = view === "3d" ? "3d" : "blueprint";

  return (
    <FloorPlanPageClient
      publicId={publicId}
      initialFloorId={initialFloorId}
      initialViewMode={initialViewMode}
    />
  );
}
