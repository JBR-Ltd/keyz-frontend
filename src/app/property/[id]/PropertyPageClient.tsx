"use client";

import type { ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  Users,
  Check,
  ChefHat,
  CircleParking,
  Dumbbell,
  Heart,
  Home,
  Images,
  Loader2,
  MapPin,
  Ruler,
  Share2,
  ShieldCheck,
  Snowflake,
  Star,
  X,
  Trees,
  Waves,
  Wifi,
  Zap,
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TouchEvent, useEffect, useRef, useState } from "react";
import { useAuthentication } from "@/components/auth/AuthProvider";
import BackButton from "@/components/navigation/BackButton";
import OverlayPortal from "@/components/ui/OverlayPortal";
import MessageHostButton from "@/components/property/MessageHostButton";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import ReportDialog from "@/components/reports/ReportDialog";
import PropertyPrice from "@/components/property/PropertyPrice";
import PropertyTourEmbed from "@/components/property/PropertyTourEmbed";
import TenantVerificationGate from "@/components/tenant/TenantVerificationGate";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { canonicalSegment, hostPath } from "@/lib/publicIds";
import { getPropertyById, PropertyDetail } from "@/lib/propertyDetails";
import { getPropertyReviews } from "@/lib/reviews";
import {
  getSavedListings,
  removeSavedListing,
  saveListing,
} from "@/lib/savedListings";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { useToast } from "@/components/ui/toast";
import { getOpenRentalRequest, type Booking } from "@/lib/bookings";

const BookingRequestDialog = dynamic(
  () => import("@/components/property/BookingRequestDialog"),
  { loading: RequestDialogLoading },
);
const ViewingRequestDialog = dynamic(
  () => import("@/components/property/ViewingRequestDialog"),
  { loading: RequestDialogLoading },
);

function RequestDialogLoading(): ReactElement {
  return (
    <OverlayPortal>
      <div
        role="status"
        className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-bg px-5 py-3 font-body text-sm font-medium text-primary shadow-lg"
      >
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        Loading request form
      </div>
    </OverlayPortal>
  );
}

interface PropertyPageClientProps {
  id: string;
  /**
   * The listing as the server already resolved it. Seeding from this is what puts the
   * title, price and description in the HTML a crawler receives, rather than leaving
   * them to arrive after hydration. Null when the server lookup found nothing.
   */
  initialProperty: PropertyDetail | null;
}

type LoadingState = "loading" | "ready" | "not-found";
type RentalRequestLoadState = "idle" | "loading" | "ready" | "error";

interface GalleryImage {
  src: string;
  index: number;
}

const AMENITY_ICONS = {
  wifi: Wifi,
  parking: CircleParking,
  kitchen: ChefHat,
  "air conditioning": Snowflake,
  security: ShieldCheck,
  generator: Zap,
  pool: Waves,
  garden: Trees,
  gym: Dumbbell,
  balcony: Home,
  elevator: Home,
  "water supply": Waves,
} satisfies Record<string, typeof Check>;

function formatHostRole(role: PropertyDetail["host"]["role"]): string {
  return role === "LANDLORD" ? "Landlord" : "Agent";
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getRentalPeriodLabel(
  rentalMode: PropertyDetail["rentalMode"],
): string {
  if (rentalMode === "SHORT_STAY") return "Price per night";
  if (rentalMode === "MONTHLY") return "Monthly rent";
  return "Annual rent";
}

function getRentalUnitLabel(rentalMode: PropertyDetail["rentalMode"]): string {
  if (rentalMode === "SHORT_STAY") return "per night";
  if (rentalMode === "MONTHLY") return "per month";
  return "per year";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRelativeDate(value: string): string {
  const createdAt = new Date(value).getTime();
  const diffMs = Date.now() - createdAt;
  const diffDays = Math.max(1, Math.round(diffMs / 86400000));

  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  const diffMonths = Math.max(1, Math.round(diffDays / 30));

  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

function getOuterCornerClass(
  visibleCount: number,
  cellIndex: number,
  imageCount: number,
): string {
  if (imageCount === 1) {
    return "rounded-2xl";
  }

  if (imageCount === 2) {
    return cellIndex === 0 ? "rounded-l-2xl" : "rounded-r-2xl";
  }

  if (cellIndex === 0) {
    return "rounded-l-2xl";
  }

  if (cellIndex === 1) {
    return "rounded-tr-2xl";
  }

  if (cellIndex === visibleCount - 1) {
    return "rounded-br-2xl";
  }

  return "";
}

function getMosaicClass(imageCount: number): string {
  if (imageCount === 1) {
    return "h-[420px] grid-cols-1";
  }

  if (imageCount === 2) {
    return "h-[420px] grid-cols-2";
  }

  return "h-[420px] grid-cols-[minmax(0,3fr)_minmax(0,2fr)]";
}

function getSideGridClass(imageCount: number): string {
  if (imageCount === 3) {
    return "grid-rows-2";
  }

  if (imageCount === 4) {
    return "grid-cols-2 grid-rows-2";
  }

  return "grid-cols-2 grid-rows-2";
}

function getSideCellClass(imageCount: number, sideIndex: number): string {
  return imageCount === 4 && sideIndex === 0 ? "col-span-2" : "";
}

function getAmenityIcon(amenity: string): typeof Check {
  return (
    AMENITY_ICONS[amenity.toLowerCase() as keyof typeof AMENITY_ICONS] ?? Check
  );
}

function PropertyDetailSkeleton(): ReactElement {
  return (
    <main className="bg-bg text-primary">
      <div className="mx-auto max-w-7xl px-4 pb-32 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pb-10 lg:pt-4">
        <div className="aspect-video animate-pulse rounded-2xl bg-skeleton-strong lg:h-[min(58vw,38rem)] lg:aspect-auto" />
        <div className="mt-4 space-y-3 lg:hidden">
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-skeleton" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-skeleton" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-skeleton"
              />
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-6">
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-skeleton" />
            <div className="h-5 w-1/3 animate-pulse rounded-lg bg-skeleton" />
            <div className="h-24 animate-pulse rounded-lg bg-skeleton" />
            <div className="h-52 animate-pulse rounded-lg bg-skeleton" />
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-skeleton shadow-sm" />
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 px-4 pt-3 backdrop-blur-md lg:hidden">
        <div
          className="mx-auto flex max-w-7xl items-center gap-4"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="h-10 min-w-0 flex-1 animate-pulse rounded-lg bg-skeleton" />
          <div className="h-12 w-40 animate-pulse rounded-full bg-skeleton-strong" />
        </div>
      </div>
    </main>
  );
}

function PropertyNotFound(): ReactElement {
  return (
    <main className="bg-bg text-primary">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Listing unavailable
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold text-primary sm:text-5xl">
          Property not found
        </h1>
        <p className="mt-4 max-w-xl font-body text-base leading-7 text-muted">
          This listing may have been removed or the link may be incorrect. You
          can keep browsing verified homes instead.
        </p>
        <Link
          href="/tenant/browse"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Browse other listings
        </Link>
      </section>
    </main>
  );
}

export default function PropertyPageClient({
  id,
  initialProperty,
}: PropertyPageClientProps): ReactElement {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const authentication = useAuthentication();
  const [loadingState, setLoadingState] = useState<LoadingState>(
    initialProperty ? "ready" : "loading",
  );
  const [property, setProperty] = useState<PropertyDetail | null>(
    initialProperty,
  );
  // Spent on the first pass only, so navigating to another listing still fetches
  const unusedInitialProperty = useRef(initialProperty);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [openRentalRequest, setOpenRentalRequest] = useState<Booking | null>(
    null,
  );
  const [rentalRequestLoadState, setRentalRequestLoadState] =
    useState<RentalRequestLoadState>("idle");
  const [rentalRequestPropertyId, setRentalRequestPropertyId] = useState<
    number | null
  >(null);
  const [rentalRequestRetryKey, setRentalRequestRetryKey] = useState(0);
  const [isReporting, setIsReporting] = useState(false);
  const [viewingDialogState, setViewingDialogState] = useState<
    "idle" | "open" | "closed"
  >("idle");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isSavedLoading, setIsSavedLoading] = useState(true);
  const isSaved = property ? savedIds.has(property.id) : false;
  const [isSaving, setIsSaving] = useState(false);
  const lightboxRef = useDialogFocus<HTMLDivElement>(lightboxIndex !== null);

  useEffect(() => {
    let active = true;

    async function loadProperty(): Promise<void> {
      const seeded = unusedInitialProperty.current;

      unusedInitialProperty.current = null;

      if (!seeded) {
        setLoadingState("loading");
      }

      const nextProperty = seeded ?? (await getPropertyById(id));

      if (!active) {
        return;
      }

      setProperty(nextProperty);

      if (nextProperty) {
        void getPropertyReviews(nextProperty.publicId ?? nextProperty.id).then(
          (result) => {
            const published = result.data.filter((review) => !review.pending);

            if (!active || published.length === 0) {
              return;
            }

            setProperty((current) =>
              current === null
                ? current
                : {
                    ...current,
                    reviews: {
                      averageRating:
                        published.reduce(
                          (total, review) => total + review.rating,
                          0,
                        ) / published.length,
                      count: published.length,
                      items: published.map((review) => ({
                        id: String(review.id),
                        reviewerName: review.reviewer?.name ?? "A tenant",
                        rating: review.rating,
                        comment: review.comment ?? "",
                        // Older reviews carry no date; the publication date stands in when there is one
                        createdAt: review.createdAt ?? review.publishedAt ?? "",
                        reply: review.reply ?? undefined,
                      })),
                    },
                  },
            );
          },
        );
      }

      // An old numeric link or an outdated slug moves to the canonical address, so
      // the link people copy from here is the one that survives a rename. Only a
      // published listing resolves publicly, so a host previewing an unpublished
      // one stays where they are.
      if (nextProperty?.publicId && nextProperty.verified) {
        const canonical = canonicalSegment({
          id: nextProperty.id,
          publicId: nextProperty.publicId,
          slug: nextProperty.slug,
        });

        if (canonical !== id) {
          router.replace(
            `/property/${canonical}${window.location.search}${window.location.hash}`,
            { scroll: false },
          );
        }
      }
      setLoadingState(nextProperty ? "ready" : "not-found");
    }

    void loadProperty();

    return () => {
      active = false;
    };
  }, [id, router]);

  useEffect(() => {
    if (authentication.status === "checking") {
      return;
    }

    if (
      authentication.status === "authenticated" &&
      authentication.user?.role !== "TENANT"
    ) {
      return;
    }

    let active = true;

    async function loadSavedState(): Promise<void> {
      const result = await getSavedListings();

      if (active) {
        setSavedIds(new Set(result.data.map((listing) => String(listing.id))));
        setIsSavedLoading(false);
      }
    }

    void loadSavedState();

    return () => {
      active = false;
    };
  }, [authentication.status, authentication.user?.role]);

  useEffect(() => {
    const propertyId = Number(property?.id);
    const shouldLoad =
      authentication.status === "authenticated" &&
      authentication.user?.role === "TENANT" &&
      property?.rentalMode !== "SHORT_STAY" &&
      Number.isSafeInteger(propertyId) &&
      propertyId > 0;

    if (!shouldLoad) {
      return;
    }

    let active = true;
    const controller = new AbortController();

    const loadRentalRequest = async (): Promise<void> => {
      setRentalRequestPropertyId(propertyId);
      setRentalRequestLoadState("loading");
      const result = await getOpenRentalRequest(propertyId, controller.signal);

      if (!active) {
        return;
      }

      setOpenRentalRequest(result.data);
      setRentalRequestLoadState(result.message ? "error" : "ready");
    };

    void loadRentalRequest();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    authentication.status,
    authentication.user?.role,
    property?.id,
    property?.rentalMode,
    rentalRequestRetryKey,
  ]);

  useEffect(() => {
    if (lightboxIndex === null || !property) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) => {
          if (current === null) {
            return current;
          }

          return current === 0 ? property.images.length - 1 : current - 1;
        });
        return;
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((current) => {
          if (current === null) {
            return current;
          }

          return current === property.images.length - 1 ? 0 : current + 1;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, property]);

  const closeLightbox = (): void => {
    setLightboxIndex(null);
  };

  const openLightbox = (index: number): void => {
    setLightboxIndex(index);
  };

  const showPreviousImage = (): void => {
    setLightboxIndex((current) => {
      if (current === null || !property) {
        return current;
      }

      return current === 0 ? property.images.length - 1 : current - 1;
    });
  };

  const showNextImage = (): void => {
    setLightboxIndex((current) => {
      if (current === null || !property) {
        return current;
      }

      return current === property.images.length - 1 ? 0 : current + 1;
    });
  };

  const handleLightboxTouchEnd = (event: TouchEvent<HTMLDivElement>): void => {
    if (touchStartX === null) {
      return;
    }

    const deltaX = event.changedTouches[0].clientX - touchStartX;

    setTouchStartX(null);

    if (Math.abs(deltaX) < 48) {
      return;
    }

    if (deltaX > 0) {
      showPreviousImage();
      return;
    }

    showNextImage();
  };

  const openPrimaryFlow = (): void => {
    setIsBookingOpen(true);
  };

  const handleShare = async (): Promise<void> => {
    const shareData = {
      title: property?.title ?? "Rello property",
      text: property
        ? `Take a look at ${property.title} on Rello.`
        : "Take a look at this property on Rello.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      notify({ title: "Link copied", variant: "success" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      notify({ title: "This listing could not be shared", variant: "error" });
    }
  };

  const handleSaveToggle = async (): Promise<void> => {
    if (!property || !/^\d+$/.test(property.id) || isSavedLoading || isSaving) {
      return;
    }

    setIsSaving(true);
    const result = await (
      isSaved
        ? removeSavedListing(Number(property.id))
        : saveListing(Number(property.id))
    ).finally(() => setIsSaving(false));

    if (!result.data) {
      notify({
        title: result.message ?? "This listing could not be updated",
        variant: "error",
      });
      return;
    }

    const savedPropertyId = property.id;
    setSavedIds((current) => {
      const next = new Set(current);
      if (isSaved) next.delete(savedPropertyId);
      else next.add(savedPropertyId);
      return next;
    });
    notify({
      title: isSaved ? "Removed from saved homes" : "Saved to your homes",
      variant: "success",
    });
  };

  if (loadingState === "loading") {
    return <PropertyDetailSkeleton />;
  }

  if (!property) {
    return <PropertyNotFound />;
  }

  const galleryImages: GalleryImage[] = property.images.map((image, index) => ({
    src: image,
    index,
  }));
  const visibleGalleryImages = galleryImages.slice(0, 5);
  const sideGalleryImages = visibleGalleryImages.slice(1);
  const mobileThumbnails = galleryImages.slice(1, 5);
  const hasTour = Boolean(
    property.tour.videoUrl || property.tour.matterportUrl,
  );
  const hostRole = formatHostRole(property.host.role);
  const primaryCta =
    property?.rentalMode === "SHORT_STAY"
      ? "Check availability"
      : "Request to rent";
  const viewerRole = authentication.user?.role ?? null;
  const isHostViewer = viewerRole === "LANDLORD" || viewerRole === "AGENT";
  const isOwner =
    isHostViewer &&
    String(authentication.user?.id) === property.host.id &&
    viewerRole === property.host.role;
  const showTenantActions =
    authentication.status === "unauthenticated" || viewerRole === "TENANT";
  const ownerBasePath = isOwner ? `/${viewerRole.toLowerCase()}` : null;
  const manageListingHref = ownerBasePath
    ? `${ownerBasePath}/listings/${property.id}`
    : null;
  const editListingHref = ownerBasePath
    ? `${ownerBasePath}/listings/create?draft=${property.id}`
    : null;
  const showMobileActionBar = showTenantActions || isOwner;
  const shouldCheckRentalRequest =
    viewerRole === "TENANT" && property.rentalMode !== "SHORT_STAY";
  const hasCurrentRentalRequestState =
    rentalRequestPropertyId === Number(property.id);
  const currentOpenRentalRequest = hasCurrentRentalRequestState
    ? openRentalRequest
    : null;
  const isRentalRequestLoading =
    shouldCheckRentalRequest &&
    (!hasCurrentRentalRequestState ||
      rentalRequestLoadState === "idle" ||
      rentalRequestLoadState === "loading");
  const showChargeReassurance =
    !shouldCheckRentalRequest ||
    (rentalRequestLoadState === "ready" && !currentOpenRentalRequest);

  const renderPrimaryAction = (className: string): ReactElement => {
    if (currentOpenRentalRequest) {
      return (
        <Link href="/tenant/bookings" className={className}>
          {currentOpenRentalRequest.status === "CONFIRMED"
            ? "View tenancy"
            : "Request pending"}
        </Link>
      );
    }

    if (isRentalRequestLoading) {
      return (
        <button type="button" disabled className={className}>
          <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" />
          Checking request...
        </button>
      );
    }

    if (shouldCheckRentalRequest && rentalRequestLoadState === "error") {
      return (
        <button
          type="button"
          onClick={() => setRentalRequestRetryKey((current) => current + 1)}
          className={className}
        >
          Retry request status
        </button>
      );
    }

    return (
      <TenantVerificationGate
        intent={property.status === "FOR_RENT" ? "booking" : "offer"}
        onVerifiedAction={openPrimaryFlow}
      >
        {(requestAction) => (
          <button type="button" onClick={requestAction} className={className}>
            {primaryCta}
          </button>
        )}
      </TenantVerificationGate>
    );
  };

  return (
    <main className="bg-bg text-primary">
      <div
        className={`mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pb-10 lg:pt-4 ${
          showMobileActionBar || authentication.status === "checking"
            ? "pb-32"
            : "pb-10"
        }`}
      >
        <BackButton
          fallbackHref="/tenant/browse"
          roleFallbacks={{
            ADMIN: "/admin/dashboard",
            AGENT: "/agent/saved-listings",
            LANDLORD: "/landlord/saved-listings",
            TENANT: "/tenant/browse",
          }}
          className="mb-2 hidden min-h-11 items-center gap-2 rounded-full font-body text-sm font-bold text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:inline-flex"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to results
        </BackButton>

        <div className="mb-4 hidden items-end justify-between gap-8 lg:flex">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-bold leading-tight text-primary">
                {property.title}
              </h1>
              {property.verified ? <VerifiedBadge size="sm" /> : null}
            </div>
            <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
              <MapPin
                size={16}
                className="text-accent-alt"
                aria-hidden="true"
              />
              {property.location.area}, {property.location.city}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-sm">
              <p className="font-bold text-primary">
                <PropertyPrice
                  value={property.price}
                  listingType={property.status}
                  rentalMode={property.rentalMode}
                />
              </p>
              <span
                className="h-1 w-1 rounded-full bg-border"
                aria-hidden="true"
              />
              <p className="text-muted">
                {getRentalPeriodLabel(property.rentalMode)}
              </p>
              {property.availableUnitCount > 0 ? (
                <>
                  <span
                    className="h-1 w-1 rounded-full bg-border"
                    aria-hidden="true"
                  />
                  <p className="font-medium text-primary">
                    {formatCount(
                      property.availableUnitCount,
                      "unit available",
                      "units available",
                    )}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-bg px-4 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-primary/30 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Share2 size={16} aria-hidden="true" />
              Share
            </button>
            {showTenantActions && /^\d+$/.test(property.id) ? (
              <button
                type="button"
                onClick={() => void handleSaveToggle()}
                disabled={isSavedLoading || isSaving}
                aria-pressed={isSaved}
                aria-busy={isSaving}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-bg px-4 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-primary/30 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
              >
                {isSavedLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <AsyncButtonContent
                    isPending={isSaving}
                    pendingLabel={
                      isSaved ? "Removing saved home…" : "Saving home…"
                    }
                  >
                    <Heart
                      size={16}
                      fill={isSaved ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                    {isSaved ? "Saved" : "Save"}
                  </AsyncButtonContent>
                )}
              </button>
            ) : null}
            {isOwner && manageListingHref && editListingHref ? (
              <>
                <Link
                  href={editListingHref}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-bg px-4 font-body text-sm font-bold text-primary transition-colors hover:border-primary/30 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Edit listing
                </Link>
                <Link
                  href={manageListingHref}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Manage listing
                </Link>
              </>
            ) : null}
          </div>
        </div>

        <section aria-label="Property photos">
          <div
            className={`relative hidden gap-1 overflow-hidden rounded-2xl lg:grid ${getMosaicClass(
              property.images.length,
            )}`}
          >
            {visibleGalleryImages[0] ? (
              <div
                className={`group relative min-h-0 overflow-hidden bg-surface-soft ${getOuterCornerClass(
                  visibleGalleryImages.length,
                  0,
                  property.images.length,
                )}`}
              >
                <button
                  type="button"
                  onClick={() => openLightbox(visibleGalleryImages[0].index)}
                  className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  aria-label={`Open ${property.title} photo 1`}
                >
                  <Image
                    src={visibleGalleryImages[0].src}
                    alt={property.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover transition-all duration-300 ease-in-out group-hover:scale-[1.02]"
                    style={{ objectFit: "cover" }}
                  />
                </button>
              </div>
            ) : null}

            {sideGalleryImages.length > 0 ? (
              <div
                className={`grid min-h-0 gap-1 ${getSideGridClass(property.images.length)}`}
              >
                {sideGalleryImages.map((image, sideIndex) => {
                  const cellIndex = sideIndex + 1;

                  return (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => openLightbox(image.index)}
                      className={`group relative min-h-0 overflow-hidden bg-surface-soft ${getOuterCornerClass(
                        visibleGalleryImages.length,
                        cellIndex,
                        property.images.length,
                      )} ${getSideCellClass(property.images.length, sideIndex)}`}
                      aria-label={`Open ${property.title} photo ${image.index + 1}`}
                    >
                      <Image
                        src={image.src}
                        alt={`${property.title} photo ${image.index + 1}`}
                        fill
                        sizes="(min-width: 1024px) 20vw, 50vw"
                        className="object-cover transition-all duration-300 ease-in-out group-hover:scale-[1.02]"
                        style={{ objectFit: "cover" }}
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="absolute bottom-4 right-4 z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/70 bg-bg/95 px-4 font-body text-sm font-bold text-primary shadow-md backdrop-blur-sm transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Images size={17} aria-hidden="true" />
              View all {formatCount(property.images.length, "photo", "photos")}
            </button>
          </div>

          <div className="lg:hidden">
            <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-soft shadow-sm">
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                aria-label={`Open ${property.title} photo 1`}
              >
                <Image
                  src={property.images[0]}
                  alt={property.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover transition-all duration-300 ease-in-out group-hover:scale-[1.02]"
                  style={{ objectFit: "cover" }}
                />
              </button>
              <BackButton
                fallbackHref="/tenant/browse"
                roleFallbacks={{
                  ADMIN: "/admin/dashboard",
                  AGENT: "/agent/saved-listings",
                  LANDLORD: "/landlord/saved-listings",
                  TENANT: "/tenant/browse",
                }}
                aria-label="Go back"
                className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-all duration-200 ease-in-out hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ArrowLeft size={19} aria-hidden="true" />
              </BackButton>
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  aria-label="Share this property"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-bg/95 text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Share2 size={18} aria-hidden="true" />
                </button>
                {showTenantActions && /^[0-9]+$/.test(property.id) ? (
                  <button
                    type="button"
                    onClick={() => void handleSaveToggle()}
                    disabled={isSavedLoading || isSaving}
                    aria-label={
                      isSaving
                        ? isSaved
                          ? "Removing from saved homes"
                          : "Saving this property"
                        : isSaved
                          ? "Remove from saved homes"
                          : "Save this property"
                    }
                    aria-busy={isSaving}
                    aria-pressed={isSaved}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-bg/95 text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                  >
                    {isSavedLoading || isSaving ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Heart
                        size={18}
                        fill={isSaved ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="absolute bottom-4 right-4 z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/70 bg-bg/95 px-4 font-body text-xs font-bold text-primary shadow-sm backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Images size={16} aria-hidden="true" />
                View all {property.images.length}
              </button>
            </div>

            {mobileThumbnails.length > 0 ? (
              <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2">
                {mobileThumbnails.map((image) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => openLightbox(image.index)}
                    className="relative aspect-[4/3] min-w-28 snap-start overflow-hidden rounded-lg bg-surface-soft"
                    aria-label={`Open ${property.title} photo ${image.index + 1}`}
                  >
                    <Image
                      src={image.src}
                      alt={`${property.title} thumbnail ${image.index + 1}`}
                      fill
                      sizes="112px"
                      className="object-cover"
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <OverlayPortal>
          <AnimatePresence>
            {lightboxIndex !== null ? (
              <motion.div
                ref={lightboxRef}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black px-4 py-6"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                role="dialog"
                aria-modal="true"
                aria-label="Property photo gallery"
                onTouchStart={(event) =>
                  setTouchStartX(event.touches[0].clientX)
                }
                onTouchEnd={handleLightboxTouchEnd}
              >
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label="Close photo gallery"
                  className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white transition-all duration-200 ease-in-out hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={21} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={showPreviousImage}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white transition-all duration-200 ease-in-out hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex"
                >
                  <ArrowLeft size={22} aria-hidden="true" />
                </button>

                <motion.div
                  key={lightboxIndex}
                  className="relative aspect-video max-h-[82vh] w-full max-w-6xl"
                  initial={reduceMotion ? false : { opacity: 0.7, scale: 0.98 }}
                  animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                  exit={
                    reduceMotion ? undefined : { opacity: 0.7, scale: 0.98 }
                  }
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <Image
                    src={property.images[lightboxIndex]}
                    alt={`${property.title} photo ${lightboxIndex + 1}`}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    style={{ objectFit: "contain" }}
                  />
                </motion.div>

                <button
                  type="button"
                  onClick={showNextImage}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white transition-all duration-200 ease-in-out hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex"
                >
                  <ArrowRight size={22} aria-hidden="true" />
                </button>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-2 font-body text-sm font-bold text-white">
                  {lightboxIndex + 1} / {property.images.length}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </OverlayPortal>

        <div
          className={`mt-8 grid gap-10 lg:items-start ${
            showTenantActions
              ? "lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14"
              : "lg:grid-cols-1"
          }`}
        >
          <section
            className={showTenantActions ? "min-w-0" : "min-w-0 max-w-4xl"}
          >
            <div className="lg:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold leading-tight text-primary">
                  {property.title}
                </h1>
                {property.verified ? <VerifiedBadge size="sm" /> : null}
              </div>
              <p className="mt-1 flex items-center gap-2 font-body text-sm text-muted">
                <MapPin
                  size={16}
                  className="text-accent-alt"
                  aria-hidden="true"
                />
                {property.location.area}, {property.location.city}
              </p>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="font-display text-2xl font-bold text-primary">
                  <PropertyPrice
                    value={property.price}
                    listingType={property.status}
                    rentalMode={property.rentalMode}
                  />
                </p>
                <p className="font-body text-sm text-muted">
                  {getRentalPeriodLabel(property.rentalMode)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-y-3 border-y border-border/70 py-4 font-body text-sm text-muted lg:mt-0">
              <span className="inline-flex min-h-11 items-center gap-2 pr-4">
                <BedDouble
                  size={17}
                  className="text-accent-alt"
                  aria-hidden="true"
                />
                {formatCount(property.bedrooms, "bedroom", "bedrooms")}
              </span>
              <span className="h-5 w-px bg-border" aria-hidden="true" />
              <span className="inline-flex min-h-11 items-center gap-2 px-4">
                <Bath
                  size={17}
                  className="text-accent-alt"
                  aria-hidden="true"
                />
                {formatCount(property.bathrooms, "bathroom", "bathrooms")}
              </span>
              {property.rentalMode === "SHORT_STAY" &&
              property.maximumGuests ? (
                <>
                  <span className="h-5 w-px bg-border" aria-hidden="true" />
                  <span className="inline-flex min-h-11 items-center gap-2 px-4">
                    <Users
                      size={17}
                      className="text-accent-alt"
                      aria-hidden="true"
                    />
                    Sleeps {property.maximumGuests}
                  </span>
                </>
              ) : null}
              {property.availableUnitCount > 0 ? (
                <>
                  <span className="h-5 w-px bg-border" aria-hidden="true" />
                  <span className="inline-flex min-h-11 items-center px-4 font-bold text-primary">
                    {formatCount(
                      property.availableUnitCount,
                      "unit available",
                      "units available",
                    )}
                  </span>
                </>
              ) : null}
              {property.sqft ? (
                <>
                  <span className="h-5 w-px bg-border" aria-hidden="true" />
                  <span className="inline-flex min-h-11 items-center gap-2 px-4">
                    <Ruler
                      size={17}
                      className="text-accent-alt"
                      aria-hidden="true"
                    />
                    {property.sqft.toLocaleString("en-NG")} sqft
                  </span>
                </>
              ) : null}
            </div>

            {showTenantActions ? (
              <button
                type="button"
                onClick={() => setViewingDialogState("open")}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:border-primary/30 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
              >
                Request a viewing
              </button>
            ) : null}

            <div className="my-6 border-t border-border" />

            <section>
              <h2 className="font-display text-xl font-bold text-primary">
                About this property
              </h2>
              <p className="mt-3 font-body text-base leading-relaxed text-muted">
                {property.description}
              </p>
            </section>

            <div className="my-6 border-t border-border" />

            <section>
              <h2 className="font-display text-xl font-bold text-primary">
                What this place offers
              </h2>
              {property.amenities.length > 0 ? (
                <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
                  {property.amenities.map((amenity) => {
                    const Icon = getAmenityIcon(amenity);

                    return (
                      <div
                        key={amenity}
                        className="flex min-h-11 items-center gap-3 font-body text-sm text-primary"
                      >
                        <Icon
                          size={18}
                          className="text-accent-alt"
                          aria-hidden="true"
                        />
                        {amenity}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 font-body text-sm text-muted">
                  Amenities have not been added to this listing yet.
                </p>
              )}
            </section>

            <div className="my-6 border-t border-border" />

            <section aria-labelledby="property-host-heading">
              <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                Listed by
              </p>
              <div className="mt-3 flex items-center gap-3">
                {property.host.avatarUrl ? (
                  <Image
                    src={property.host.avatarUrl}
                    alt={property.host.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-body text-sm font-bold text-white">
                    {getInitials(property.host.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="property-host-heading">
                      <Link
                        href={hostPath(property.host)}
                        className="font-display text-xl font-bold text-primary transition-colors hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {property.host.name}
                      </Link>
                    </h2>
                    {property.host.verified ? (
                      <VerifiedBadge size="sm" />
                    ) : null}
                  </div>
                  <p className="mt-1 font-body text-sm text-muted">
                    {hostRole}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                {showTenantActions ? (
                  <MessageHostButton
                    hostId={property.host.id}
                    hostName={property.host.name}
                    hostRole={property.host.role}
                    propertyId={property.id}
                    propertyName={property.title}
                  />
                ) : null}
                <Link
                  href={hostPath(property.host)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 font-body text-sm font-medium text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  See all homes from this {hostRole.toLowerCase()}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </section>

            {showTenantActions && isBookingOpen ? (
              <BookingRequestDialog
                hostName={property.host.name}
                hostRole={hostRole}
                maximumGuests={property.maximumGuests}
                minimumNights={property.minimumNights}
                onClose={() => setIsBookingOpen(false)}
                onRentalRequestRejected={() => {
                  setRentalRequestLoadState("loading");
                  setRentalRequestRetryKey((current) => current + 1);
                }}
                onRentalRequestSubmitted={(booking) => {
                  setOpenRentalRequest(booking);
                  setRentalRequestPropertyId(booking.propertyId);
                  setRentalRequestLoadState("ready");
                }}
                open={isBookingOpen}
                price={property.price}
                propertyId={property.id}
                propertyPublicId={property.publicId}
                propertyTitle={property.title}
                rentalMode={property.rentalMode}
              />
            ) : null}

            {showTenantActions && viewingDialogState !== "idle" ? (
              <ViewingRequestDialog
                allowVirtual={hasTour}
                onClose={() => setViewingDialogState("closed")}
                open={viewingDialogState === "open"}
                propertyId={property.id}
                propertyTitle={property.title}
              />
            ) : null}

            {hasTour ? (
              <>
                <div className="my-6 border-t border-border" />
                <section id="virtual-tour" className="scroll-mt-24">
                  <p className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-alt">
                    See it for yourself
                  </p>
                  <h2 className="mt-2 font-display text-xl font-bold text-primary">
                    Walk through this home
                  </h2>
                  <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                    Filmed at the property, so what you see is the home you
                    would be renting.
                  </p>
                  <div className="mt-4 overflow-hidden rounded-2xl bg-surface-soft shadow-sm">
                    {property.tour.videoUrl ? (
                      <video
                        src={property.tour.videoUrl}
                        className="aspect-video w-full bg-primary object-cover"
                        controls
                      />
                    ) : null}
                    {!property.tour.videoUrl && property.tour.matterportUrl ? (
                      <iframe
                        src={property.tour.matterportUrl}
                        title={`${property.title} virtual tour`}
                        className="aspect-video w-full"
                        allow="fullscreen; xr-spatial-tracking"
                      />
                    ) : null}
                  </div>
                </section>
              </>
            ) : null}

            {!hasTour && property.publicId ? (
              <>
                <div className="my-6 border-t border-border" />
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-primary">
                    Virtual tour
                  </h2>
                  <Link
                    href={`/tours/${property.publicId}`}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    View full tour
                  </Link>
                </div>
                <PropertyTourEmbed publicId={property.publicId} />
              </>
            ) : null}

            <div className="my-6 border-t border-border" />

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-primary">
                  Reviews
                </h2>
                {property.reviews.count > 0 ? (
                  <p className="flex items-center gap-2 font-body text-sm font-bold text-primary">
                    <Star
                      size={17}
                      className="text-accent-alt"
                      fill="currentColor"
                    />
                    {property.reviews.averageRating.toFixed(1)} ·{" "}
                    {property.reviews.count}{" "}
                    {property.reviews.count === 1 ? "review" : "reviews"}
                  </p>
                ) : null}
              </div>
              {property.reviews.count > 0 ? (
                <div className="mt-4 divide-y divide-border">
                  {property.reviews.items.map((review) => (
                    <article
                      key={review.id}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-body text-sm font-bold text-primary">
                            {review.reviewerName}
                          </h3>
                          {review.createdAt ? (
                            <p className="mt-1 font-body text-xs text-muted">
                              {formatRelativeDate(review.createdAt)}
                            </p>
                          ) : null}
                        </div>
                        <p className="flex items-center gap-1 font-body text-sm font-bold text-primary">
                          <Star
                            size={15}
                            className="text-accent-alt"
                            fill="currentColor"
                          />
                          {review.rating.toFixed(1)}
                        </p>
                      </div>
                      <p className="mt-3 font-body text-sm leading-6 text-muted">
                        {review.comment}
                      </p>
                      {review.reply ? (
                        <p className="mt-3 border-l-2 border-accent pl-3 font-body text-sm leading-6 text-muted">
                          <span className="font-bold text-primary">
                            Host reply:{" "}
                          </span>
                          {review.reply}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 font-body text-sm text-muted">
                  No reviews yet.
                </p>
              )}
            </section>

            {authentication.status !== "checking" && !isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsReporting(true)}
                  className="mt-6 inline-flex min-h-11 items-center rounded-lg px-1 font-body text-xs font-semibold text-muted underline-offset-4 hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Report this listing
                </button>
                <ReportDialog
                  open={isReporting}
                  onClose={() => setIsReporting(false)}
                  target={{
                    type: "LISTING",
                    listingId: property.publicId ?? property.id,
                  }}
                />
              </>
            ) : null}
          </section>

          {showTenantActions ? (
            <aside className="hidden rounded-xl border border-border/70 bg-bg p-5 shadow-[0_16px_45px_-36px_rgba(1,57,81,0.42)] lg:sticky lg:top-4 lg:block">
              <p className="font-body text-xs font-bold uppercase tracking-[0.16em] text-muted">
                {property.status === "FOR_RENT"
                  ? "Rental price"
                  : "Asking price"}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="font-display text-3xl font-bold text-primary">
                  <PropertyPrice
                    value={property.price}
                    listingType={property.status}
                    rentalMode={property.rentalMode}
                    showRentalSuffix={false}
                  />
                </p>
                {property.status === "FOR_RENT" ? (
                  <p className="font-body text-sm font-medium text-muted">
                    {getRentalUnitLabel(property.rentalMode)}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 font-body text-sm">
                {property.availableUnitCount > 0 ? (
                  <p className="flex items-center gap-2 font-semibold text-primary">
                    <span
                      className="h-2 w-2 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    {formatCount(
                      property.availableUnitCount,
                      "unit available",
                      "units available",
                    )}
                  </p>
                ) : null}
                {property.rentalMode === "SHORT_STAY" &&
                property.minimumNights ? (
                  <p className="text-muted">
                    Minimum{" "}
                    {formatCount(property.minimumNights, "night", "nights")}
                  </p>
                ) : null}
              </div>

              {renderPrimaryAction(
                "mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-5 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70",
              )}
              {showChargeReassurance ? (
                <p className="mt-2 text-center font-body text-xs text-muted">
                  You will not be charged yet.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => setViewingDialogState("open")}
                className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 font-body text-sm font-bold text-muted transition-colors hover:bg-surface-soft hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Request a viewing
              </button>
            </aside>
          ) : null}
        </div>
      </div>

      {showTenantActions ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 px-4 pt-3 shadow-[0_-12px_30px_-24px_rgba(1,57,81,0.55)] backdrop-blur-md lg:hidden">
          <div
            className="mx-auto flex max-w-7xl items-center gap-3"
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                {getRentalPeriodLabel(property.rentalMode)}
              </p>
              <p className="truncate font-display text-lg font-bold text-primary">
                <PropertyPrice
                  value={property.price}
                  listingType={property.status}
                  rentalMode={property.rentalMode}
                />
              </p>
            </div>
            {renderPrimaryAction(
              "inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-accent px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70",
            )}
          </div>
        </div>
      ) : null}
      {isOwner && manageListingHref && editListingHref ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 px-4 pt-3 shadow-[0_-12px_30px_-24px_rgba(1,57,81,0.55)] backdrop-blur-md lg:hidden">
          <div
            className="mx-auto flex max-w-7xl items-center gap-2"
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <Link
              href={editListingHref}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Edit listing
            </Link>
            <Link
              href={manageListingHref}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-primary px-4 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Manage listing
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}
