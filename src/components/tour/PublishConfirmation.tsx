"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

interface PublishConfirmationProps {
  propertyId: number;
  role: "landlord" | "agent";
}

export default function PublishConfirmation({
  propertyId,
  role,
}: PublishConfirmationProps) {
  const listingHref = `/${role}/listings/${propertyId}`;
  const previewHref = `${listingHref}/tour/preview`;

  return (
    <section
      aria-labelledby="tour-publish-confirmation"
      className="text-center"
    >
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Published
      </p>
      <h2
        id="tour-publish-confirmation"
        className="mt-2 font-display text-2xl font-bold text-primary"
      >
        Virtual tour is live
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Renters can now explore this property room by room from the listing
        page.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={previewHref}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-6 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Eye size={15} aria-hidden="true" />
          Preview as renter
        </Link>
        <Link
          href={listingHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to the listing
        </Link>
      </div>
    </section>
  );
}
