import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rello",
    short_name: "Rello",
    description:
      "Find verified rentals and shortlets, compare clear terms, and manage your move with Rello.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f2e9",
    theme_color: "#003b55",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
