// src/app/tours/[publicId]/floor-plan/page.tsx
//
// The standalone floor plan. Reads the public bundle, which already carries
// the placements and staircases for every confirmed floor, so this page
// needs no owner-only endpoints and works for a signed-out visitor on a
// published tour.

import { notFound } from "next/navigation";
import FloorPlanPageClient from "./FloorPlanPageClient";

interface FloorPlanPageProps {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ floor?: string }>;
}

export default async function FloorPlanPage({
  params,
  searchParams,
}: FloorPlanPageProps) {
  const { publicId } = await params;
  const { floor } = await searchParams;

  if (!publicId || publicId.length === 0) {
    notFound();
  }

  const parsedFloor = floor ? Number(floor) : NaN;
  const initialFloorId =
    Number.isFinite(parsedFloor) && parsedFloor > 0 ? parsedFloor : undefined;

  return (
    <FloorPlanPageClient publicId={publicId} initialFloorId={initialFloorId} />
  );
}
