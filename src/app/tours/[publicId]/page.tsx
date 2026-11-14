// src/app/tours/[publicId]/page.tsx
//
// The standalone public tour. Server component: reads the segment and hands
// it to a client shell that fetches the anonymous bundle. The segment is
// whatever identifier the link carries — the opaque public id in normal use,
// or a numeric id on an old link; the backend resolves both.

import { notFound } from "next/navigation";
import TourPageClient from "./TourPageClient";

interface TourPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function TourPage({ params }: TourPageProps) {
  const { publicId } = await params;

  if (!publicId || publicId.length === 0) {
    notFound();
  }

  return <TourPageClient publicId={publicId} />;
}
