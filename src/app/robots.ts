import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seoProperties";
import { getSiteEnvironment } from "@/lib/siteEnvironment";

/**
 * Signed-in areas are disallowed because they hold nothing a searcher wants and
 * every URL under them is per-account. The AI crawlers are allowed deliberately:
 * being quoted in an answer is how a listing gets found now, and blocking them is
 * a business decision rather than a default.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  const site = getSiteEnvironment();

  if (!site.indexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  const disallow = [
    "/api/",
    "/admin/",
    "/agent/",
    "/landlord/",
    "/tenant/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/receipts/",
    "/tours/",
  ];

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
