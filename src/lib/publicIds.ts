// === Public identifiers
//
// Public links carry an opaque identifier rather than the numeric database id, so a
// link survives a rename and the catalogue cannot be walked by counting. The
// readable slug in front is presentation only: the identifier at the end is what
// resolves, which is why an outdated slug still finds the right listing.

const PROPERTY_PUBLIC_ID = /(p_[0-9a-f]{16})$/;
const HOST_PUBLIC_ID = /(u_[0-9a-f]{16})$/;

/** Anything a public link can be built for. */
export interface PublicLinkTarget {
  id: number | string;
  publicId?: string | null;
  slug?: string | null;
}

/** The identifier at the end of a route segment such as `luxury-terrace-p_...`. */
export function propertyPublicIdFrom(segment: string): string | null {
  return PROPERTY_PUBLIC_ID.exec(segment)?.[1] ?? null;
}

export function hostPublicIdFrom(segment: string): string | null {
  return HOST_PUBLIC_ID.exec(segment)?.[1] ?? null;
}

/** The route segment a record should live at. */
export function canonicalSegment(target: PublicLinkTarget): string {
  if (!target.publicId) {
    // Data from before identifiers existed still links, and the page redirects it
    return String(target.id);
  }

  return target.slug ? `${target.slug}-${target.publicId}` : target.publicId;
}

export function propertyPath(target: PublicLinkTarget): string {
  return `/property/${canonicalSegment(target)}`;
}

export function hostPath(target: PublicLinkTarget): string {
  return `/host/${canonicalSegment(target)}`;
}
