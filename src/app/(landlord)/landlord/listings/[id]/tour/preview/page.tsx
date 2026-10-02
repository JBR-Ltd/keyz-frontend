// src/app/(landlord)/landlord/listings/[id]/tour/preview/page.tsx
//
// Owner preview of the tour. Reads the owner-preview bundle; ownership is
// enforced server-side, so a stranger would get a 404 rather than this page.

import { notFound } from "next/navigation";
import TourPreviewPage from "@/components/tour/TourPreviewPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LandlordTourPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const propertyId = Number(id);
  if (!Number.isFinite(propertyId) || propertyId <= 0) notFound();

  return <TourPreviewPage propertyId={propertyId} role="landlord" />;
}
