import type { NextConfig } from "next";

const siteEnvironment = process.env.RELLO_SITE_ENVIRONMENT;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!siteEnvironment || !siteUrl) {
  throw new Error(
    "RELLO_SITE_ENVIRONMENT and NEXT_PUBLIC_SITE_URL are required.",
  );
}

if (
  siteEnvironment === "production" &&
  siteUrl.replace(/\/$/, "") !== "https://www.rello.online"
) {
  throw new Error(
    "Production NEXT_PUBLIC_SITE_URL must be https://www.rello.online.",
  );
}

const nextConfig: NextConfig = {
  async headers() {
    return siteEnvironment === "staging"
      ? [
          {
            source: "/:path*",
            headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
          },
        ]
      : [];
  },
  async redirects() {
    return [
      {
        source: "/tenant/browse",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/marketing",
        destination: "/",
        permanent: true,
      },
      {
        source: "/marketing/waitlist",
        destination: "/waitlist",
        permanent: true,
      },
    ];
  },
  images: {
    // Local uploads resolve to a private address, so development serves them directly.
    // Production keeps the optimizer and its private-network protection enabled.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
