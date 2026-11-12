import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import HostProfileClient from "./HostProfileClient";
import type { BackendPage, BackendProperty } from "@/lib/hostListings";
import { canonicalSegment, hostPath } from "@/lib/publicIds";
import { getSeoHostListings, getSeoHostProfile } from "@/lib/seoHosts";
import { siteUrl, structuredDataJson } from "@/lib/seoProperties";

interface HostPageProps {
  params: Promise<{ id: string }>;
}

const EMPTY_LISTINGS: BackendPage<BackendProperty> = {
  hasNext: false,
  items: [],
  page: 0,
  size: 12,
  totalItems: 0,
  totalPages: 0,
};

function hostDescription(name: string, role: "AGENT" | "LANDLORD"): string {
  const roleLabel = role === "AGENT" ? "property agent" : "landlord";

  return `Explore available homes from ${name}, a ${roleLabel} on Rello.`;
}

export async function generateMetadata({
  params,
}: HostPageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getSeoHostProfile(id);

  if (!profile) {
    return {
      title: "Host not found",
      robots: { follow: false, index: false },
    };
  }

  const roleLabel = profile.role === "AGENT" ? "Property Agent" : "Landlord";
  const title = `${profile.name}, ${roleLabel}`;
  const description = hostDescription(profile.name, profile.role);
  const canonical = `${siteUrl()}${hostPath(profile)}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots:
      profile.listingCount > 0 ? undefined : { follow: true, index: false },
    openGraph: {
      title: `${title} | Rello`,
      description,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
      type: "profile",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Rello`,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
    },
  };
}

export default async function HostProfilePage({
  params,
}: HostPageProps): Promise<ReactElement> {
  const { id } = await params;
  const [profile, listings] = await Promise.all([
    getSeoHostProfile(id),
    getSeoHostListings(id).catch(() => null),
  ]);

  if (!profile) notFound();

  const canonicalId = canonicalSegment(profile);

  if (id !== canonicalId) permanentRedirect(`/host/${canonicalId}`);

  const canonical = `${siteUrl()}${hostPath(profile)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          name: profile.name,
          jobTitle: profile.role === "AGENT" ? "Property agent" : "Landlord",
          image: profile.avatarUrl ?? undefined,
          url: canonical,
        },
        name: `${profile.name} on Rello`,
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            item: siteUrl(),
            name: "Home",
            position: 1,
          },
          {
            "@type": "ListItem",
            item: `${siteUrl()}/browse`,
            name: "Browse homes",
            position: 2,
          },
          {
            "@type": "ListItem",
            item: canonical,
            name: profile.name,
            position: 3,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson(structuredData) }}
      />
      <HostProfileClient
        hostId={id}
        profile={profile}
        initialListings={listings ?? EMPTY_LISTINGS}
        initialListingError={
          listings ? "" : "Homes could not be loaded. Try again."
        }
      />
    </>
  );
}
