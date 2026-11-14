import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/seoProperties";

const title = "Join the Rello Waitlist";
const description =
  "Join the Rello early-access waitlist for rental and shortlet updates in your city.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${siteUrl()}/waitlist` },
  openGraph: {
    title: `${title} | Rello`,
    description,
    type: "website",
    url: `${siteUrl()}/waitlist`,
  },
};

export default function WaitlistLayout({ children }: { children: ReactNode }) {
  return children;
}
