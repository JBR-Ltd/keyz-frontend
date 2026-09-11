import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, Fraunces, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import InternalNavigationTracker from "@/components/navigation/InternalNavigationTracker";
import { ToastProvider } from "@/components/ui/toast";
import { LoadingScreenGate } from "@/components/LoadingScreenGate";
import { Analytics } from "@vercel/analytics/next";

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

export const metadata: Metadata = {
  title: "Rello Estate",
  description:
    "Luxury property marketing and waitlist access for premium listings.",
  openGraph: {
    title: "Rello Estate",
    description:
      "Luxury property marketing and waitlist access for premium listings.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rello Estate",
    description:
      "Luxury property marketing and waitlist access for premium listings.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      style={{ visibility: "hidden", overflow: "hidden" }}
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
        <LoadingScreenGate>
          <Suspense fallback={null}>
            <InternalNavigationTracker />
          </Suspense>
          <ToastProvider>{children}</ToastProvider>
        </LoadingScreenGate>
        <Analytics />
      </body>
    </html>
  );
}
