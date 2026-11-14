import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { DM_Sans, Fraunces, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import InternalNavigationTracker from "@/components/navigation/InternalNavigationTracker";
import { ToastProvider } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { getSiteEnvironment } from "@/lib/siteEnvironment";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--rello-font-body",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--rello-font-display",
  weight: ["500", "600", "700", "800"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--rello-font-accent",
  weight: ["500", "600", "700", "800"],
});

const site = getSiteEnvironment();

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Rello",
    template: "%s | Rello",
  },
  description:
    "Find verified rentals and shortlets, compare clear terms, and manage your move with Rello.",
  icons: {
    apple: "/apple-icon",
    icon: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  robots: site.indexable
    ? { follow: true, index: true }
    : { follow: false, index: false },
  openGraph: {
    title: "Rello",
    description:
      "Find verified rentals and shortlets, compare clear terms, and manage your move with Rello.",
    type: "website",
    images: ["/opengraph-image"],
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rello",
    description:
      "Find verified rentals and shortlets, compare clear terms, and manage your move with Rello.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(
        "h-full",
        "antialiased",
        fraunces.variable,
        dmSans.variable,
        syne.variable,
        "font-body",
      )}
    >
      {/*
        Extensions such as Grammarly add their own attributes to body before
        React hydrates, which React reports as a mismatch it cannot patch. The
        markup we render is identical either way.
      */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Suspense fallback={null}>
          <InternalNavigationTracker />
        </Suspense>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
