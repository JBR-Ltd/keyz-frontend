"use client";

import Link from "next/link";

interface PublishConfirmationProps {
  propertyId: number;
  role: "landlord" | "agent";
}

export default function PublishConfirmation({ propertyId, role }: PublishConfirmationProps) {
  return (
    <section aria-labelledby="tour-publish-confirmation" className="text-center">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Published
      </p>
      <h2 id="tour-publish-confirmation" className="mt-2 font-display text-2xl font-bold text-primary">
        Virtual tour is live
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Renters can now explore this property room by room.
      </p>

      <Link
        href={`/${role}/saved-listings`}
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Back to My Listings
      </Link>
    </section>
  );
}