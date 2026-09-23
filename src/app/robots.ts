import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seoProperties";

/**
 * Signed-in areas are disallowed because they hold nothing a searcher wants and
 * every URL under them is per-account. The AI crawlers are allowed deliberately:
 * being quoted in an answer is how a listing gets found now, and blocking them is
 * a business decision rather than a default.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
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
  ];

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
