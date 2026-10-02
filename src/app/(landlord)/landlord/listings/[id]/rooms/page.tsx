// src/app/(landlord)/landlord/listings/[id]/rooms/page.tsx
//
// Landlord-facing room board. If ?floor= is missing, RoomBoardPage fetches
// the property's floors and picks the first.

import { notFound } from "next/navigation";
import RoomBoardPage from "@/components/tour/RoomBoardPage";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ floor?: string }>;
}

export default async function LandlordRoomsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { floor } = await searchParams;

  const propertyId = Number(id);
  if (!Number.isFinite(propertyId) || propertyId <= 0) notFound();

  const parsedFloor = floor ? Number(floor) : NaN;
  const floorId =
    Number.isFinite(parsedFloor) && parsedFloor > 0 ? parsedFloor : undefined;

  return (
    <RoomBoardPage
      propertyId={propertyId}
      floorId={floorId}
      role="landlord"
    />
  );
}
