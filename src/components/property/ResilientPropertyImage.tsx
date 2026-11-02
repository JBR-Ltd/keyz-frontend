"use client";

import type { ImageProps } from "next/image";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface ResilientPropertyImageProps extends Omit<
  ImageProps,
  "alt" | "onError" | "src"
> {
  alt: string;
  compactPlaceholder?: boolean;
  src?: string | null;
}

function isPrivateProductionSource(source: string): boolean {
  if (process.env.NODE_ENV !== "production" || !/^https?:\/\//i.test(source)) {
    return false;
  }

  try {
    const hostname = new URL(source).hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.")
    ) {
      return true;
    }
    const match = /^172\.(\d+)\./.exec(hostname);
    return match ? Number(match[1]) >= 16 && Number(match[1]) <= 31 : false;
  } catch {
    return true;
  }
}

export default function ResilientPropertyImage({
  alt,
  className,
  compactPlaceholder = false,
  fill,
  src,
  ...imageProps
}: ResilientPropertyImageProps): ReactElement {
  const normalizedSource = src?.trim() || null;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const unavailable =
    !normalizedSource ||
    failedSource === normalizedSource ||
    isPrivateProductionSource(normalizedSource);

  if (unavailable) {
    return (
      <span
        role="img"
        aria-label={alt ? `${alt}. Photo unavailable` : "Photo unavailable"}
        className={cn(
          "flex items-center justify-center gap-2 bg-surface-soft text-muted",
          fill ? "absolute inset-0" : "",
          className,
        )}
      >
        <ImageOff size={compactPlaceholder ? 20 : 24} aria-hidden="true" />
        <span
          className={cn(
            "font-body text-sm font-medium",
            compactPlaceholder ? "sr-only" : "",
          )}
        >
          Photo unavailable
        </span>
      </span>
    );
  }

  return (
    <Image
      {...imageProps}
      src={normalizedSource}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => setFailedSource(normalizedSource)}
    />
  );
}
