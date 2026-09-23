import type { MetadataRoute } from "next";
import { POLICIES } from "@/lib/policies";
import {
  citySlug,
  getPublishedProperties,
  getRentalCities,
  propertyPath,
  siteUrl,
} from "@/lib/seoProperties";

/** Rebuilt hourly: new listings are the reason to crawl this at all. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/policies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...POLICIES.map((policy) => ({
      url: `${base}/policies/${policy.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  const [properties, cities] = await Promise.all([
    getPublishedProperties(),
    getRentalCities(),
  ]);

  // Location pages rank for the searches people actually make, so they go in first
  const cityEntries: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${base}/rent/${citySlug(city)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const propertyEntries: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${base}${propertyPath(property)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...cityEntries, ...propertyEntries];
}
