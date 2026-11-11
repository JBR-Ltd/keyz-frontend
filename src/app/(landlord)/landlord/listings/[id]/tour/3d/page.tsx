// src/app/(landlord)/landlord/listings/[id]/tour/3d/page.tsx
//
// Landlord-facing dedicated 3D walkthrough page.

import { notFound } from "next/navigation";
import Host3DWalkthroughPage from "@/components/tour/Host3DWalkthroughPage";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ floor?: string }>;
}

export default async function Landlord3DWalkthroughPage({
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
    <Host3DWalkthroughPage
      propertyId={propertyId}
      role="landlord"
      initialFloorId={initialFloorId}
    />
  );
}
