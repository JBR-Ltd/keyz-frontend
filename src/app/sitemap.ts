import type { MetadataRoute } from "next";
import { POLICIES } from "@/lib/policies";
import { getPublishedHostProfiles } from "@/lib/seoHosts";
import { hostPath } from "@/lib/publicIds";
import {
  citySlug,
  getPublishedProperties,
  getRentalCities,
  propertyPath,
  siteUrl,
} from "@/lib/seoProperties";
import { getSiteEnvironment } from "@/lib/siteEnvironment";

/** Rebuilt hourly: new listings are the reason to crawl this at all. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!getSiteEnvironment().indexable) return [];

  const base = siteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/browse`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/policies`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...POLICIES.map((policy) => ({
      url: `${base}/policies/${policy.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  const [properties, cities] = await Promise.all([
    getPublishedProperties(),
    getRentalCities(),
  ]);
  const hosts = await getPublishedHostProfiles(properties);

  // Location pages rank for the searches people actually make, so they go in first
  const cityEntries: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${base}/rent/${citySlug(city)}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const propertyEntries: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${base}${propertyPath(property)}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const hostEntries: MetadataRoute.Sitemap = hosts.map((host) => ({
    url: `${base}${hostPath(host)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...cityEntries, ...propertyEntries, ...hostEntries];
}
