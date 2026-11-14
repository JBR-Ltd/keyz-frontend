// src/app/(agent)/agent/listings/[id]/tour/preview/page.tsx
//
// Agent-side owner preview. Identical to the landlord one; only the role
// passed to the client differs, and that only drives the back link.

import { notFound } from "next/navigation";
import TourPreviewPage from "@/components/tour/TourPreviewPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentTourPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const propertyId = Number(id);
  if (!Number.isFinite(propertyId) || propertyId <= 0) notFound();

  return <TourPreviewPage propertyId={propertyId} role="agent" />;
}
