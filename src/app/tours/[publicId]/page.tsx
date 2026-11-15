// src/app/tours/[publicId]/page.tsx
//
// The standalone public tour. Server component: reads the segment and hands
// it to a client shell that fetches the anonymous bundle. The segment is
// whatever identifier the link carries: the opaque public id in normal use,
// or a numeric id on an old link; the backend resolves both.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import TourPageClient from "./TourPageClient";
import { getSeoProperty, siteUrl } from "@/lib/seoProperties";

interface TourPageProps {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({
  params,
}: TourPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const property = await getSeoProperty(publicId);

  if (!property) {
    return {
      title: "Virtual tour not found",
      robots: { follow: false, index: false },
    };
  }

  const where = [property.area, property.city].filter(Boolean).join(", ");
  const title = `Virtual tour of ${property.title}`;
  const description = where
    ? `Explore ${property.title} in ${where} with a virtual tour on Rello.`
    : `Explore ${property.title} with a virtual tour on Rello.`;
  const canonicalId = property.publicId ?? publicId;
  const canonical = `${siteUrl()}/tours/${encodeURIComponent(canonicalId)}`;
  const images = property.images
    .slice(0, 4)
    .map((image) => ({ url: image.url }));

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: property.images[0]?.url ? [property.images[0].url] : undefined,
    },
  };
}

export default async function TourPage({
  params,
}: TourPageProps): Promise<ReactElement> {
  const { publicId } = await params;

  if (!publicId || publicId.length === 0) {
    notFound();
  }

  return <TourPageClient publicId={publicId} />;
}
