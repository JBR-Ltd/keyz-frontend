"use client";

import type { ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Video,
  Bath,
  BedDouble,
  Check,
  ChefHat,
  CircleParking,
  Dumbbell,
  Home,
  MapPin,
  Ruler,
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
import Link from "next/link";
import { TouchEvent, use, useEffect, useState } from "react";
import BackButton from "@/components/navigation/BackButton";
import OverlayPortal from "@/components/ui/OverlayPortal";
import MessageHostButton from "@/components/property/MessageHostButton";
import BookingRequestDialog from "@/components/property/BookingRequestDialog";
import PropertyPrice from "@/components/property/PropertyPrice";
import PropertyTourViewer from "@/components/property/PropertyTourViewer";
import ViewingRequestDialog from "@/components/property/ViewingRequestDialog";
import TenantVerificationGate from "@/components/tenant/TenantVerificationGate";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { getPropertyById, PropertyDetail } from "@/lib/propertyDetails";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

type LoadingState = "loading" | "ready" | "not-found";

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
    return "h-[480px] grid-cols-1";
  }

  if (imageCount === 2) {
    return "h-[480px] grid-cols-2";
  }

  return "h-[480px] grid-cols-[minmax(0,3fr)_minmax(0,2fr)]";
}

function getSideGridClass(imageCount: number): string {
  if (imageCount === 3) {
    return "grid-rows-2";
  }

  if (imageCount === 4) {
    return "grid-rows-3";
  }

  return "grid-cols-2 grid-rows-2";
}

function getAmenityIcon(amenity: string): typeof Check {
  return (
    AMENITY_ICONS[amenity.toLowerCase() as keyof typeof AMENITY_ICONS] ?? Check
  );
}

function PropertyDetailSkeleton(): ReactElement {
  return (
    <main className="bg-bg pt-6 text-primary">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-[min(58vw,38rem)] animate-pulse rounded-2xl bg-skeleton-strong" />
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
    </main>
  );
}

function PropertyNotFound(): ReactElement {
  return (
    <main className="bg-bg pt-6 text-primary">
      <section className="mx-auto flex min-h-[32rem] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
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

export default function PropertyPage({
  params,
}: PropertyPageProps): ReactElement {
  const { id } = use(params);
  const reduceMotion = useReducedMotion();
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isViewingOpen, setIsViewingOpen] = useState(false);
  const lightboxRef = useDialogFocus<HTMLDivElement>(lightboxIndex !== null);

  useEffect(() => {
    let active = true;

    async function loadProperty(): Promise<void> {
      setLoadingState("loading");
      const nextProperty = await getPropertyById(id);

      if (!active) {
        return;
      }

      setProperty(nextProperty);
      setLoadingState(nextProperty ? "ready" : "not-found");
    }

    void loadProperty();

    return () => {
      active = false;
    };
  }, [id]);

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
  const remainingPhotoCount = Math.max(property.images.length - 5, 0);
  const mobileThumbnails = galleryImages.slice(1);
  const hasTour = Boolean(
    property.tour.videoUrl || property.tour.matterportUrl,
  );
  const hostRole = formatHostRole(property.host.role);
  const primaryCta =
    property?.rentalMode === "SHORT_STAY"
      ? "Check availability"
      : "Request to rent";

  return (
    <main className="bg-bg pt-6 text-primary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {hasTour ? (
          <a
            href="#virtual-tour"
            className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Video size={16} aria-hidden="true" />
            Walk through this home
          </a>
        ) : null}

        <section aria-label="Property photos">
          <div
            className={`hidden gap-1 overflow-hidden rounded-2xl lg:grid ${getMosaicClass(
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
                <BackButton
                  fallbackHref="/tenant/browse"
                  roleFallbacks={{
                    AGENT: "/agent/saved-listings",
                    LANDLORD: "/landlord/saved-listings",
                  }}
                  aria-label="Go back"
                  className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-all duration-200 ease-in-out hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ArrowLeft size={19} aria-hidden="true" />
                </BackButton>
                {property.verified ? (
                  <span className="absolute right-4 top-4">
                    <VerifiedBadge />
                  </span>
                ) : null}
              </div>
            ) : null}

            {sideGalleryImages.length > 0 ? (
              <div
                className={`grid min-h-0 gap-1 ${getSideGridClass(property.images.length)}`}
              >
                {sideGalleryImages.map((image, sideIndex) => {
                  const cellIndex = sideIndex + 1;
                  const showMoreOverlay =
                    cellIndex === visibleGalleryImages.length - 1 &&
                    remainingPhotoCount > 0;

                  return (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => openLightbox(image.index)}
                      className={`group relative min-h-0 overflow-hidden bg-surface-soft ${getOuterCornerClass(
                        visibleGalleryImages.length,
                        cellIndex,
                        property.images.length,
                      )}`}
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
                      {showMoreOverlay ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 px-4 text-center font-body text-base font-bold text-white">
                          +{remainingPhotoCount} more photos
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
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
                  AGENT: "/agent/saved-listings",
                  LANDLORD: "/landlord/saved-listings",
                }}
                aria-label="Go back"
                className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-all duration-200 ease-in-out hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ArrowLeft size={19} aria-hidden="true" />
              </BackButton>
              {property.verified ? (
                <span className="absolute right-4 top-4">
                  <VerifiedBadge size="sm" />
                </span>
              ) : null}
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

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <section className="min-w-0">
            <h1 className="font-display text-3xl font-bold leading-tight text-primary">
              {property.title}
            </h1>
            <p className="mt-1 flex items-center gap-2 font-body text-sm text-muted">
              <MapPin
                size={16}
                className="text-accent-alt"
                aria-hidden="true"
              />
              {property.location.area}, {property.location.city}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 font-body text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <BedDouble
                  size={17}
                  className="text-accent-alt"
                  aria-hidden="true"
                />
                {property.bedrooms} bedrooms
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="inline-flex items-center gap-2">
                <Bath
                  size={17}
                  className="text-accent-alt"
                  aria-hidden="true"
                />
                {property.bathrooms} bathrooms
              </span>
              {property.sqft ? (
                <>
                  <span className="h-4 w-px bg-border" />
                  <span className="inline-flex items-center gap-2">
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
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {property.amenities.map((amenity) => {
                  const Icon = getAmenityIcon(amenity);

                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 rounded-lg p-3 font-body text-sm text-primary shadow-sm"
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
            </section>

            <BookingRequestDialog
              minimumNights={property.minimumNights}
              onClose={() => setIsBookingOpen(false)}
              open={isBookingOpen}
              price={property.price}
              propertyId={property.id}
              propertyTitle={property.title}
              rentalMode={property.rentalMode}
            />

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

            {/^\d+$/.test(property.id) ? (
              <>
                <div className="my-6 border-t border-border" />
                <PropertyTourViewer propertyId={Number(property.id)} />
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
                    {property.reviews.count} reviews
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
                          <p className="mt-1 font-body text-xs text-muted">
                            {formatRelativeDate(review.createdAt)}
                          </p>
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
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 font-body text-sm text-muted">
                  No reviews yet.
                </p>
              )}
            </section>
          </section>

          <aside className="rounded-xl bg-[var(--color-bg)] p-6 shadow-sm lg:sticky lg:top-24">
            <p className="font-display text-3xl font-bold text-primary">
              <PropertyPrice
                value={property.price}
                listingType={property.status}
                rentalMode={property.rentalMode}
              />
            </p>
            <div className="mt-6 flex items-center gap-3">
              {property.host.avatarUrl ? (
                <Image
                  src={property.host.avatarUrl}
                  alt={property.host.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-body text-sm font-bold text-white">
                  {getInitials(property.host.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/host/${property.host.id}`}
                  className="block truncate font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {property.host.name}
                </Link>
                <p className="mt-1 font-body text-xs text-muted">{hostRole}</p>
              </div>
              {property.host.verified ? <VerifiedBadge size="sm" /> : null}
            </div>

            <Link
              href={`/host/${property.host.id}`}
              className="mt-4 inline-flex items-center gap-2 font-body text-sm font-medium text-muted transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              See all homes from this {hostRole.toLowerCase()}
              <ArrowUpRight size={15} />
            </Link>

            <div className="my-6 border-t border-border" />

            <TenantVerificationGate
              intent={property.status === "FOR_RENT" ? "booking" : "offer"}
              onVerifiedAction={openPrimaryFlow}
            >
              {(requestAction) => (
                <button
                  type="button"
                  onClick={requestAction}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-accent px-6 py-4 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {primaryCta}
                </button>
              )}
            </TenantVerificationGate>

            <MessageHostButton
              hostId={property.host.id}
              hostName={property.host.name}
              hostRole={property.host.role}
              propertyId={property.id}
              propertyName={property.title}
            />

            <button
              type="button"
              onClick={() => setIsViewingOpen(true)}
              className="mt-4 w-full font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Request a viewing
            </button>

            <ViewingRequestDialog
              allowVirtual={hasTour}
              onClose={() => setIsViewingOpen(false)}
              open={isViewingOpen}
              propertyId={property.id}
              propertyTitle={property.title}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
