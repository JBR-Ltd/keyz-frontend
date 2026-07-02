"use client";

import { X } from "lucide-react";
import { useState } from "react";

const ADMIN_PREVIEW_BANNER_KEY = "rello_admin_preview_banner_dismissed";

export default function AdminPreviewBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return sessionStorage.getItem(ADMIN_PREVIEW_BANNER_KEY) !== "true";
  });

  const dismiss = () => {
    sessionStorage.setItem(ADMIN_PREVIEW_BANNER_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="px-5 pt-5 sm:px-8 lg:px-12 lg:pt-8">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-accent/30 bg-accent/10 px-5 py-4 text-primary shadow-sm">
        <p className="font-body text-sm font-medium leading-6">
          🚧 Admin backend is not yet connected. This dashboard is a design
          preview using placeholder data.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Dismiss admin preview notice"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
