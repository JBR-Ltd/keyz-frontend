import type { RentalMode } from "@/lib/hostListings";

export type ShareContent =
  | {
      kind: "property";
      title: string;
      description: string;
      url: string;
      imageUrl?: string | null;
      location: string;
      price: string;
    }
  | {
      kind: "tour";
      title: string;
      description: string;
      url: string;
      imageUrl?: string | null;
    }
  | {
      kind: "host";
      title: string;
      description: string;
      url: string;
      imageUrl?: string | null;
      role: "Landlord" | "Property agent";
    };

export interface ShareChannelUrls {
  email: string;
  facebook: string;
  whatsapp: string;
  x: string;
}

export interface NativeShareData {
  text: string;
  title: string;
  url: string;
}

const RENTAL_SUFFIXES: Record<RentalMode, string> = {
  ANNUAL: "per year",
  MONTHLY: "per month",
  SHORT_STAY: "per night",
};

function configuredOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function buildPublicShareUrl(
  path: string,
  origin = configuredOrigin(),
): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(
      "Public share paths must be same-origin application paths.",
    );
  }

  const url = new URL(path, origin);
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function formatSharePrice(
  price: number,
  rentalMode: RentalMode,
): string {
  const amount = new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);

  return `${amount} ${RENTAL_SUFFIXES[rentalMode]}`;
}

export function getNativeShareData(content: ShareContent): NativeShareData {
  return {
    text: content.description,
    title: content.title,
    url: content.url,
  };
}

export function getShareChannelUrls(content: ShareContent): ShareChannelUrls {
  const message = `${content.description}\n${content.url}`;
  const whatsapp = new URL("https://wa.me/");
  whatsapp.searchParams.set("text", message);

  const x = new URL("https://x.com/intent/post");
  x.searchParams.set("text", content.title);
  x.searchParams.set("url", content.url);

  const facebook = new URL("https://www.facebook.com/sharer/sharer.php");
  facebook.searchParams.set("u", content.url);

  const email = new URL("mailto:");
  email.searchParams.set("subject", content.title);
  email.searchParams.set("body", message);

  return {
    email: email.toString(),
    facebook: facebook.toString(),
    whatsapp: whatsapp.toString(),
    x: x.toString(),
  };
}
