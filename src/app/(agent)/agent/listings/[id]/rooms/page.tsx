// src/app/(agent)/agent/listings/[id]/rooms/page.tsx
//
// Agent-facing room board. Shows every room on every floor of the property.

import { notFound } from "next/navigation";
import RoomBoardPage from "@/components/tour/RoomBoardPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentRoomsPage({ params }: PageProps) {
  const { id } = await params;

  const propertyId = Number(id);
  if (!Number.isFinite(propertyId) || propertyId <= 0) notFound();

  return <RoomBoardPage propertyId={propertyId} role="agent" />;
}
