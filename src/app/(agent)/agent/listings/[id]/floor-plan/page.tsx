// src/app/(agent)/agent/listings/[id]/floor-plan/page.tsx
//
// Agent-facing dedicated floor-plan page. Renders the full FloorPlanViewer
// outside the wizard, keyed by the numeric property id.

import { notFound } from "next/navigation";
import HostFloorPlanPage from "@/components/tour/HostFloorPlanPage";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ floor?: string }>;
}

export default async function AgentFloorPlanPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { floor } = await searchParams;

  const propertyId = Number(id);
  if (!Number.isFinite(propertyId) || propertyId <= 0) notFound();

  const parsedFloor = floor ? Number(floor) : NaN;
  const initialFloorId =
    Number.isFinite(parsedFloor) && parsedFloor > 0 ? parsedFloor : undefined;

  return (
    <HostFloorPlanPage
      propertyId={propertyId}
      role="agent"
      initialFloorId={initialFloorId}
    />
  );
}
