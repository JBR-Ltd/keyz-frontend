"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarOff,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  blockDates,
  getPropertyAvailability,
  unblockDates,
  type UnavailableRange,
} from "@/lib/availability";
import { getBackendPropertyById, type BackendProperty } from "@/lib/hostListings";
import {
  addGalleryImage,
  deleteGalleryImage,
  getGallery,
  reorderGallery,
  type GalleryImage,
} from "@/lib/propertyGallery";

interface ManageListingViewProps {
  propertyId: string;
  role: "agent" | "landlord";
}

function formatRange(range: UnavailableRange): string {
  const format = (value: string): string =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return `${format(range.startDate)} to ${format(range.endDate)}`;
}

export default function ManageListingView({
  propertyId,
  role,
}: ManageListingViewProps): ReactElement {
  const { notify } = useToast();
  const numericId = Number(propertyId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [photos, setPhotos] = useState<GalleryImage[]>([]);
  const [ranges, setRanges] = useState<UnavailableRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<number | null>(null);
  const [busyBlockId, setBusyBlockId] = useState<number | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const loadAvailability = useCallback(async (): Promise<void> => {
    const result = await getPropertyAvailability(numericId);
    setRanges(result.data);
  }, [numericId]);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getBackendPropertyById(propertyId),
      getGallery(numericId),
      getPropertyAvailability(numericId),
    ]).then(([listing, gallery, availability]) => {
      if (!active) {
        return;
      }

      setProperty(listing.data);
      setPhotos(gallery.data);
      setRanges(availability.data);
      setLoadError(listing.message ?? gallery.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [numericId, propertyId]);

  const upload = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    const rejected: string[] = [];

    // One at a time: the server checks each photo against every other listing,
    // and a rejection has to name the photo it is about
    for (const file of Array.from(files)) {
      const result = await addGalleryImage(numericId, file);

      if (result.data === null) {
        rejected.push(`${file.name}: ${result.message ?? "was not added"}`);
        continue;
      }

      const added = result.data;

      setPhotos((current) => [...current, added]);
    }

    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (rejected.length > 0) {
      notify({
        title: "Some photos were not added",
        description: rejected.join(" · "),
        variant: "error",
      });
    }
  };

  const removePhoto = async (photo: GalleryImage): Promise<void> => {
    setBusyPhotoId(photo.id);
    const result = await deleteGalleryImage(numericId, photo.id);
    setBusyPhotoId(null);

    if (!result.data) {
      notify({
        title: "Photo not removed",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setPhotos((current) => current.filter((item) => item.id !== photo.id));
  };

  /** The cover is what every search result shows, so it is worth a single click. */
  const makeCover = async (photo: GalleryImage): Promise<void> => {
    setBusyPhotoId(photo.id);
    const order = [photo.id, ...photos.filter((item) => item.id !== photo.id).map((item) => item.id)];
    const result = await reorderGallery(numericId, order);
    setBusyPhotoId(null);

    if (result.data.length === 0) {
      notify({
        title: "Cover not changed",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setPhotos(result.data);
    notify({ title: "Cover photo updated", variant: "success" });
  };

  const block = async (): Promise<void> => {
    setIsBlocking(true);
    const result = await blockDates(
      numericId,
      blockStart,
      blockEnd,
      blockReason.trim(),
    );
    setIsBlocking(false);

    if (result.data === null) {
      notify({
        title: "Dates not blocked",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setBlockStart("");
    setBlockEnd("");
    setBlockReason("");
    await loadAvailability();
    notify({ title: "Those dates are closed", variant: "success" });
  };

  const unblock = async (range: UnavailableRange): Promise<void> => {
    setBusyBlockId(range.id);
    const result = await unblockDates(numericId, range.id);
    setBusyBlockId(null);

    if (!result.data) {
      notify({
        title: "Dates not reopened",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    await loadAvailability();
  };

  const blocks = ranges.filter((range) => range.source === "BLOCK");
  const booked = ranges.filter((range) => range.source === "BOOKING");

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <Link
        href={`/${role}/saved-listings`}
        className="inline-flex items-center gap-2 font-body text-sm font-medium text-muted transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        All listings
      </Link>

      <header className="pb-10 pt-6">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Manage
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          {property?.title ?? "This listing"}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Photos and dates, after the listing has gone live. Changes here show on
          the public page straight away.
        </p>
        {property ? (
          <Link
            href={`/property/${property.id}`}
            className="mt-4 inline-flex font-body text-sm font-medium text-accent-alt transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View the public page
          </Link>
        ) : null}
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <p className="py-16 text-center font-body text-sm text-muted">
          Loading...
        </p>
      ) : (
        <div className="grid gap-12">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">
                  Photos
                </h2>
                <p className="mt-2 font-body text-sm text-muted">
                  {photos.length} of 20. The first is the cover.
                </p>
              </div>

              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded bg-primary px-5 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus-within:ring-2 focus-within:ring-accent">
                {isUploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ImagePlus size={15} aria-hidden="true" />
                )}
                Add photos
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={isUploading}
                  onChange={(event) => void upload(event.target.files)}
                  className="sr-only"
                />
              </label>
            </div>

            {photos.length === 0 ? (
              <p className="mt-6 rounded-lg bg-surface-soft p-10 text-center font-body text-sm text-muted shadow-sm">
                This listing has no photos yet. A listing with photos is the one
                people book.
              </p>
            ) : (
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo) => (
                  <li
                    key={photo.id}
                    className="overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm"
                  >
                    <div className="relative aspect-video bg-surface-soft">
                      <Image
                        src={photo.url}
                        alt={photo.caption ?? "Listing photo"}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover"
                      />
                      {photo.cover ? (
                        <StatusBadge
                          tone="accent"
                          className="absolute left-3 top-3"
                        >
                          Cover
                        </StatusBadge>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      {photo.cover ? (
                        <span className="font-body text-xs text-muted">
                          Shown in search
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void makeCover(photo)}
                          disabled={busyPhotoId === photo.id}
                          className="inline-flex items-center gap-1.5 font-body text-xs font-bold text-primary transition-all duration-200 ease-in-out hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                        >
                          <Star size={13} aria-hidden="true" />
                          Make it the cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void removePhoto(photo)}
                        disabled={busyPhotoId === photo.id}
                        aria-label="Remove this photo"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-700 transition-all duration-200 ease-in-out hover:bg-red-700/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                      >
                        {busyPhotoId === photo.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-primary">
              Dates
            </h2>
            <p className="mt-2 max-w-2xl font-body text-sm text-muted">
              Close off dates you need for yourself, for repairs, or for a
              tenancy agreed away from Rello. Dates a guest already holds cannot
              be closed.
            </p>

            <div className="mt-6 grid gap-4 rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:grid-cols-[repeat(3,1fr)_auto] sm:items-end">
              <label className="block font-body text-sm font-bold text-primary">
                From
                <input
                  type="date"
                  value={blockStart}
                  onChange={(event) => setBlockStart(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-primary/15 bg-surface-soft px-4 font-body text-sm font-normal text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </label>
              <label className="block font-body text-sm font-bold text-primary">
                Until
                <input
                  type="date"
                  value={blockEnd}
                  onChange={(event) => setBlockEnd(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-primary/15 bg-surface-soft px-4 font-body text-sm font-normal text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </label>
              <label className="block font-body text-sm font-bold text-primary">
                Why, for your own records
                <input
                  type="text"
                  value={blockReason}
                  onChange={(event) => setBlockReason(event.target.value)}
                  placeholder="Repainting the flat"
                  className="mt-2 min-h-12 w-full rounded-lg border border-primary/15 bg-surface-soft px-4 font-body text-sm font-normal text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </label>
              <button
                type="button"
                onClick={() => void block()}
                disabled={isBlocking || !blockStart || !blockEnd}
                className="flex min-h-12 items-center justify-center gap-2 rounded bg-primary px-5 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBlocking ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CalendarOff size={15} aria-hidden="true" />
                )}
                Close these dates
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-muted">
                  Closed by you
                </h3>
                {blocks.length === 0 ? (
                  <p className="mt-3 font-body text-sm text-muted">
                    Nothing is closed off.
                  </p>
                ) : (
                  <ul className="mt-3 grid gap-3">
                    {blocks.map((range) => (
                      <li
                        key={`block-${range.id}`}
                        className="flex items-center justify-between gap-4 rounded-lg bg-[var(--color-bg)] px-5 py-4 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-body text-sm font-bold text-primary">
                            {formatRange(range)}
                          </p>
                          {range.reason ? (
                            <p className="mt-1 truncate font-body text-sm text-muted">
                              {range.reason}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void unblock(range)}
                          disabled={busyBlockId === range.id}
                          className="shrink-0 font-body text-xs font-bold text-accent-alt transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                        >
                          Reopen
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-muted">
                  Booked
                </h3>
                {booked.length === 0 ? (
                  <p className="mt-3 font-body text-sm text-muted">
                    No bookings on the calendar.
                  </p>
                ) : (
                  <ul className="mt-3 grid gap-3">
                    {booked.map((range) => (
                      <li
                        key={`booking-${range.id}`}
                        className="rounded-lg bg-surface-soft px-5 py-4 font-body text-sm text-primary shadow-sm"
                      >
                        {formatRange(range)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
