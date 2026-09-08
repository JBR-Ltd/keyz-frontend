import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
