"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarOff,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ImagePlus,
  Loader2,
  MapPin,
  ShieldQuestion,
  Star,
  Trash2,
} from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";
import ConfirmActionModal from "@/components/settings/ConfirmActionModal";
import TourSummaryPanel from "@/components/tour/TourSummaryPanel";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { DateRangePicker } from "@/components/ui/date-picker";
import {
  StatusBadge,
  type StatusBadgeProps,
} from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getTourSummary } from "@/lib/api/tours/publish";
import {
  blockDates,
  getPropertyAvailability,
  unblockDates,
  type UnavailableRange,
} from "@/lib/availability";
import {
  getBackendPropertyById,
  type BackendProperty,
} from "@/lib/hostListings";
import {
  addGalleryImage,
  deleteGalleryImage,
  getGallery,
  reorderGallery,
  type GalleryImage,
} from "@/lib/propertyGallery";
import { propertyPath } from "@/lib/publicIds";
import {
  getPropertyUnits,
  updatePropertyUnitStatus,
  type PropertyUnit,
} from "@/lib/propertyUnits";
import {
  getPropertyVerificationStatus,
  type PropertyVerificationResult,
  type PropertyVerificationState,
} from "@/lib/propertyVerification";
import type { TourSummary } from "@/lib/types/tour";

interface ManageListingViewProps {
  propertyId: string;
  role: "agent" | "landlord";
}

type ManagementSection = "availability" | "photos" | "tour";
type LoadStatus = "idle" | "loading" | "ready" | "error";
type HeaderVerificationState = PropertyVerificationState | "UNAVAILABLE";

interface ManagementTab {
  id: ManagementSection;
  label: string;
}

interface VerificationPresentation {
  icon: typeof CheckCircle2;
  label: string;
  tone: NonNullable<StatusBadgeProps["tone"]>;
}

const MANAGEMENT_TABS: ManagementTab[] = [
  { id: "availability", label: "Availability" },
  { id: "photos", label: "Photos" },
  { id: "tour", label: "Virtual tour" },
];

const VERIFICATION_PRESENTATIONS: Record<
  HeaderVerificationState,
  VerificationPresentation
> = {
  NOT_SUBMITTED: {
    icon: ShieldQuestion,
    label: "Ready to verify",
    tone: "accent",
  },
  PENDING_REVIEW: {
    icon: Clock3,
    label: "Under review",
    tone: "primary",
  },
  REJECTED: {
    icon: CircleAlert,
    label: "Needs changes",
    tone: "danger",
  },
  VERIFIED: {
    icon: CheckCircle2,
    label: "Live",
    tone: "primary",
  },
  UNAVAILABLE: {
    icon: CircleAlert,
    label: "Status unavailable",
    tone: "neutral",
  },
};

function isManagementSection(value: string | null): value is ManagementSection {
  return MANAGEMENT_TABS.some((tab) => tab.id === value);
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

function locationLabel(property: BackendProperty): string {
  return [property.area, property.city].filter(Boolean).join(", ") || property.address;
}

function rentalPeriodLabel(property: BackendProperty): string {
  if (property.status === "FOR_SALE") return "For sale";
  if (property.rentalMode === "MONTHLY") return "Monthly rent";
  if (property.rentalMode === "SHORT_STAY") return "Nightly rate";
  return "Annual rent";
}

function verificationActionLabel(state: HeaderVerificationState): string {
  if (state === "PENDING_REVIEW") return "View verification status";
  if (state === "REJECTED") return "Review and resubmit";
  if (state === "UNAVAILABLE") return "View verification";
  return "Verify property";
}

export default function ManageListingView({
  propertyId,
  role,
}: ManageListingViewProps): ReactElement {
  const { notify } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const numericId = Number(propertyId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const requestedSection = searchParams.get("section");
  const activeSection = isManagementSection(requestedSection)
    ? requestedSection
    : "availability";

  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [verification, setVerification] =
    useState<PropertyVerificationResult | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [pageReloadKey, setPageReloadKey] = useState(0);

  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [unitsStatus, setUnitsStatus] = useState<LoadStatus>("idle");
  const [unitsError, setUnitsError] = useState("");
  const [busyUnitId, setBusyUnitId] = useState<string | null>(null);

  const [photos, setPhotos] = useState<GalleryImage[]>([]);
  const [photosStatus, setPhotosStatus] = useState<LoadStatus>("idle");
  const [photosError, setPhotosError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [busyPhotoKey, setBusyPhotoKey] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<GalleryImage | null>(null);

  const [ranges, setRanges] = useState<UnavailableRange[]>([]);
  const [availabilityStatus, setAvailabilityStatus] =
    useState<LoadStatus>("idle");
  const [availabilityError, setAvailabilityError] = useState("");
  const [busyBlockId, setBusyBlockId] = useState<number | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const [tourSummary, setTourSummary] = useState<TourSummary | null>(null);
  const [tourStatus, setTourStatus] = useState<LoadStatus>("idle");
  const [tourError, setTourError] = useState("");

  const loadUnits = useCallback(async (): Promise<void> => {
    setUnitsStatus("loading");
    setUnitsError("");
    const result = await getPropertyUnits(numericId);

    if (result.message) {
      setUnits([]);
      setUnitsError(result.message);
      setUnitsStatus("error");
      return;
    }

    setUnits(result.data);
    setUnitsStatus("ready");
  }, [numericId]);

  const loadAvailability = useCallback(async (): Promise<void> => {
    setAvailabilityStatus("loading");
    setAvailabilityError("");
    const result = await getPropertyAvailability(numericId);

    if (result.message) {
      setRanges([]);
      setAvailabilityError(result.message);
      setAvailabilityStatus("error");
      return;
    }

    setRanges(result.data);
    setAvailabilityStatus("ready");
  }, [numericId]);

  const loadPhotos = useCallback(async (): Promise<void> => {
    setPhotosStatus("loading");
    setPhotosError("");
    const result = await getGallery(numericId);

    if (result.message) {
      setPhotos([]);
      setPhotosError(result.message);
      setPhotosStatus("error");
      return;
    }

    setPhotos(result.data);
    setPhotosStatus("ready");
  }, [numericId]);

  const loadTourSummary = useCallback(async (): Promise<void> => {
    setTourStatus("loading");
    setTourError("");

    try {
      const summary = await getTourSummary(numericId);
      setTourSummary(summary);
      setTourStatus("ready");
    } catch (error) {
      setTourSummary(null);
      setTourError(
        error instanceof Error
          ? error.message
          : "Could not load the tour summary.",
      );
      setTourStatus("error");
    }
  }, [numericId]);

  useEffect(() => {
    let active = true;

    const loadPage = async (): Promise<void> => {
      setPageLoading(true);
      setPageError("");
      setVerificationError("");

      const [propertyResult, verificationResult] = await Promise.all([
        getBackendPropertyById(propertyId),
        getPropertyVerificationStatus(numericId),
      ]);

      if (!active) return;

      if (!propertyResult.data) {
        setProperty(null);
        setPageError(
          propertyResult.message ?? "This listing could not be loaded.",
        );
      } else {
        setProperty(propertyResult.data);
      }

      setVerification(verificationResult.data);
      setVerificationError(verificationResult.message);
      setPageLoading(false);
    };

    void loadPage();

    return () => {
      active = false;
    };
  }, [numericId, pageReloadKey, propertyId]);

  useEffect(() => {
    if (!property || activeSection !== "availability") return;

    const requests: number[] = [];

    if (unitsStatus === "idle") {
      requests.push(window.setTimeout(() => void loadUnits(), 0));
    }

    if (
      property.rentalMode === "SHORT_STAY" &&
      availabilityStatus === "idle"
    ) {
      requests.push(window.setTimeout(() => void loadAvailability(), 0));
    }

    return () => requests.forEach((request) => window.clearTimeout(request));
  }, [
    activeSection,
    availabilityStatus,
    loadAvailability,
    loadUnits,
    property,
    unitsStatus,
  ]);

  useEffect(() => {
    if (activeSection !== "photos" || photosStatus !== "idle") return;

    const request = window.setTimeout(() => void loadPhotos(), 0);
    return () => window.clearTimeout(request);
  }, [activeSection, loadPhotos, photosStatus]);

  useEffect(() => {
    if (activeSection !== "tour" || tourStatus !== "idle") return;

    const request = window.setTimeout(() => void loadTourSummary(), 0);
    return () => window.clearTimeout(request);
  }, [activeSection, loadTourSummary, tourStatus]);

  const activateSection = (section: ManagementSection): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void => {
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % MANAGEMENT_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + MANAGEMENT_TABS.length) % MANAGEMENT_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = MANAGEMENT_TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = MANAGEMENT_TABS[nextIndex];
    activateSection(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  const upload = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const remainingSlots = Math.max(0, 20 - photos.length);
    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const rejected: string[] = [];

    for (const file of selectedFiles) {
      const result = await addGalleryImage(numericId, file);

      if (result.data === null) {
        rejected.push(`${file.name}: ${result.message ?? "was not added"}`);
      } else {
        const addedPhoto = result.data;
        setPhotos((current) => [...current, addedPhoto]);
      }
    }

    if (files.length > remainingSlots) {
      rejected.push(`Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be added.`);
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

  const removePhoto = async (): Promise<void> => {
    if (!photoToDelete) return;

    setBusyPhotoKey(`${photoToDelete.id}:remove`);
    const result = await deleteGalleryImage(numericId, photoToDelete.id).finally(
      () => setBusyPhotoKey(null),
    );

    if (!result.data) {
      notify({
        title: "Photo not removed",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setPhotos((current) =>
      current.filter((item) => item.id !== photoToDelete.id),
    );
    setPhotoToDelete(null);
    notify({ title: "Photo removed", variant: "success" });
  };

  const makeCover = async (photo: GalleryImage): Promise<void> => {
    setBusyPhotoKey(`${photo.id}:cover`);
    const order = [
      photo.id,
      ...photos.filter((item) => item.id !== photo.id).map((item) => item.id),
    ];
    const result = await reorderGallery(numericId, order).finally(() =>
      setBusyPhotoKey(null),
    );

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
    ).finally(() => setIsBlocking(false));

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
    notify({ title: "Those dates are blocked", variant: "success" });
  };

  const unblock = async (range: UnavailableRange): Promise<void> => {
    setBusyBlockId(range.id);
    const result = await unblockDates(numericId, range.id).finally(() =>
      setBusyBlockId(null),
    );

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

  const toggleUnitAvailability = async (unit: PropertyUnit): Promise<void> => {
    if (unit.status === "OCCUPIED") return;

    setBusyUnitId(unit.publicId);
    const result = await updatePropertyUnitStatus(
      numericId,
      unit.publicId,
      unit.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
    ).finally(() => setBusyUnitId(null));

    if (!result.data) {
      notify({
        title: "Unit not updated",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setUnits((current) =>
      current.map((item) =>
        item.publicId === result.data?.publicId ? result.data : item,
      ),
    );
  };

  if (pageLoading) {
    return <ManagementPageSkeleton role={role} />;
  }

  if (!property) {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 xl:px-14">
        <div className="mx-auto max-w-[1440px]">
          <Link
            href={`/${role}/saved-listings`}
            className="inline-flex min-h-11 items-center gap-2 font-body text-sm font-medium text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to listings
          </Link>
          <section className="flex min-h-[28rem] flex-col items-center justify-center text-center">
            <CircleAlert size={34} className="text-red-700" aria-hidden="true" />
            <h1 className="mt-5 font-display text-3xl font-bold text-primary">
              This listing could not be loaded
            </h1>
            <p className="mt-3 max-w-md font-body text-sm leading-6 text-muted">
              {pageError || "Try loading the listing again."}
            </p>
            <button
              type="button"
              onClick={() => setPageReloadKey((current) => current + 1)}
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Try again
            </button>
          </section>
        </div>
      </main>
    );
  }

  const verificationState: HeaderVerificationState = verificationError
    ? property.verified
      ? "VERIFIED"
      : "UNAVAILABLE"
    : (verification?.state ?? (property.verified ? "VERIFIED" : "NOT_SUBMITTED"));
  const verificationPresentation =
    VERIFICATION_PRESENTATIONS[verificationState];
  const VerificationIcon = verificationPresentation.icon;
  const editHref = `/${role}/listings/create?draft=${property.id}`;
  const verificationHref = `/${role}/listings/${property.id}/verify`;
  const isLive = verificationState === "VERIFIED";
  const blocks = ranges.filter((range) => range.source === "BLOCK");
  const booked = ranges.filter((range) => range.source === "BOOKING");
  const availableUnits = units.filter(
    (unit) => unit.status === "AVAILABLE",
  ).length;

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-7 sm:px-8 lg:px-10 xl:px-14">
      <div className="mx-auto max-w-[1440px]">
        <Link
          href={`/${role}/saved-listings`}
          className="inline-flex min-h-11 items-center gap-2 font-body text-sm font-medium text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to listings
        </Link>

        <header className="flex flex-col gap-5 pb-6 pt-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate font-display text-4xl font-bold leading-none text-primary">
                {property.title}
              </h1>
              <StatusBadge
                tone={verificationPresentation.tone}
                icon={<VerificationIcon size={14} aria-hidden="true" />}
              >
                {verificationPresentation.label}
              </StatusBadge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-accent-alt" aria-hidden="true" />
                {locationLabel(property)}
              </span>
              <span className="font-bold text-primary">
                <PropertyPrice
                  value={property.price}
                  listingType={property.status === "FOR_SALE" ? "FOR_SALE" : "FOR_RENT"}
                  rentalMode={property.rentalMode ?? undefined}
                />
              </span>
              <span>{rentalPeriodLabel(property)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isLive ? (
              <Link
                href={verificationHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {verificationActionLabel(verificationState)}
              </Link>
            ) : null}
            <Link
              href={editHref}
              className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isLive
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "border border-primary/20 text-primary hover:border-accent hover:bg-surface-soft"
              }`}
            >
              Edit listing
            </Link>
            {isLive ? (
              <Link
                href={propertyPath(property)}
                target="_blank"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                View live listing
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </header>

        <div
          role="tablist"
          aria-label="Listing management sections"
          className="flex gap-1 overflow-x-auto border-y border-border py-2"
        >
          {MANAGEMENT_TABS.map((tab, index) => {
            const active = activeSection === tab.id;

            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={`management-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-controls={`management-panel-${tab.id}`}
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => activateSection(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-5 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-surface-soft hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="pb-16 pt-8">
          {activeSection === "availability" ? (
            <section
              id="management-panel-availability"
              role="tabpanel"
              aria-labelledby="management-tab-availability"
              tabIndex={0}
              className="outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">
                    Availability
                  </h2>
                  <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
                    Control which physical units renters can request.
                  </p>
                </div>
                {unitsStatus === "ready" && units.length > 0 ? (
                  <p className="font-body text-sm font-bold text-primary">
                    {availableUnits} of {units.length} available
                  </p>
                ) : null}
              </div>

              <UnitsPanel
                status={unitsStatus}
                error={unitsError}
                units={units}
                busyUnitId={busyUnitId}
                editHref={editHref}
                onRetry={loadUnits}
                onToggle={toggleUnitAvailability}
              />

              {property.rentalMode === "SHORT_STAY" ? (
                <BlockedDatesPanel
                  status={availabilityStatus}
                  error={availabilityError}
                  blocks={blocks}
                  booked={booked}
                  blockStart={blockStart}
                  blockEnd={blockEnd}
                  blockReason={blockReason}
                  busyBlockId={busyBlockId}
                  isBlocking={isBlocking}
                  onDateChange={(startDate, endDate) => {
                    setBlockStart(startDate);
                    setBlockEnd(endDate);
                  }}
                  onReasonChange={setBlockReason}
                  onBlock={block}
                  onUnblock={unblock}
                  onRetry={loadAvailability}
                />
              ) : null}
            </section>
          ) : null}

          {activeSection === "photos" ? (
            <PhotosPanel
              photos={photos}
              status={photosStatus}
              error={photosError}
              isUploading={isUploading}
              busyPhotoKey={busyPhotoKey}
              fileInputRef={fileInputRef}
              onUpload={upload}
              onRetry={loadPhotos}
              onMakeCover={makeCover}
              onDelete={setPhotoToDelete}
            />
          ) : null}

          {activeSection === "tour" ? (
            <div
              id="management-panel-tour"
              role="tabpanel"
              aria-labelledby="management-tab-tour"
              tabIndex={0}
              className="outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <TourSummaryPanel
                propertyId={numericId}
                publicId={property.publicId}
                role={role}
                status={tourStatus}
                summary={tourSummary}
                error={tourError}
                onRetry={loadTourSummary}
              />
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmActionModal
        mode="confirm"
        isOpen={photoToDelete !== null}
        title="Remove this photo?"
        description="This photo will be permanently removed from the listing and cannot be restored."
        confirmLabel="Remove photo"
        pendingLabel="Removing photo..."
        isLoading={
          photoToDelete !== null &&
          busyPhotoKey === `${photoToDelete.id}:remove`
        }
        onCancel={() => setPhotoToDelete(null)}
        onConfirm={() => void removePhoto()}
      />
    </main>
  );
}

interface UnitsPanelProps {
  busyUnitId: string | null;
  editHref: string;
  error: string;
  onRetry: () => Promise<void>;
  onToggle: (unit: PropertyUnit) => Promise<void>;
  status: LoadStatus;
  units: PropertyUnit[];
}

function UnitsPanel({
  busyUnitId,
  editHref,
  error,
  onRetry,
  onToggle,
  status,
  units,
}: UnitsPanelProps): ReactElement {
  if (status === "idle" || status === "loading") {
    return (
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading units">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-6 border-l-2 border-red-700 pl-4" role="alert">
        <p className="font-body text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void onRetry()}
          className="mt-3 inline-flex min-h-11 items-center font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Retry units
        </button>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="mt-6 flex min-h-52 flex-col items-center justify-center border-y border-border px-6 text-center">
        <Building2 size={28} className="text-primary" aria-hidden="true" />
        <h3 className="mt-4 font-display text-xl font-bold text-primary">
          No units are configured
        </h3>
        <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">
          Update the listing details to set the number of identical units.
        </p>
        <Link
          href={editHref}
          className="mt-5 inline-flex min-h-11 items-center rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Edit listing
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => {
        const occupied = unit.status === "OCCUPIED";
        const available = unit.status === "AVAILABLE";

        return (
          <li
            key={unit.publicId}
            className="flex min-h-24 items-center justify-between gap-4 rounded-xl border border-border bg-bg px-5 py-4 shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-soft text-primary">
                <Building2 size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-bold text-primary">
                  {unit.label}
                </p>
                <StatusBadge
                  tone={available ? "primary" : occupied ? "accent" : "neutral"}
                  size="sm"
                  className="mt-1.5"
                >
                  {available
                    ? "Available"
                    : occupied
                      ? "In tenancy"
                      : "Unavailable"}
                </StatusBadge>
              </div>
            </div>

            {!occupied ? (
              <button
                type="button"
                disabled={busyUnitId === unit.publicId}
                aria-busy={busyUnitId === unit.publicId}
                onClick={() => void onToggle(unit)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-primary/20 px-3 font-body text-xs font-bold text-primary hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
              >
                <AsyncButtonContent
                  isPending={busyUnitId === unit.publicId}
                  pendingLabel="Updating..."
                >
                  {available ? "Mark unavailable" : "Make available"}
                </AsyncButtonContent>
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

interface BlockedDatesPanelProps {
  blockEnd: string;
  blockReason: string;
  blocks: UnavailableRange[];
  blockStart: string;
  booked: UnavailableRange[];
  busyBlockId: number | null;
  error: string;
  isBlocking: boolean;
  onBlock: () => Promise<void>;
  onDateChange: (startDate: string, endDate: string) => void;
  onReasonChange: (value: string) => void;
  onRetry: () => Promise<void>;
  onUnblock: (range: UnavailableRange) => Promise<void>;
  status: LoadStatus;
}

function BlockedDatesPanel({
  blockEnd,
  blockReason,
  blocks,
  blockStart,
  booked,
  busyBlockId,
  error,
  isBlocking,
  onBlock,
  onDateChange,
  onReasonChange,
  onRetry,
  onUnblock,
  status,
}: BlockedDatesPanelProps): ReactElement {
  return (
    <section className="mt-10 border-t border-border pt-8" aria-labelledby="blocked-dates-heading">
      <h2 id="blocked-dates-heading" className="font-display text-2xl font-bold text-primary">
        Blocked dates
      </h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
        Hold dates for repairs or personal use. Existing guest bookings cannot be blocked.
      </p>

      <div className="mt-6 grid gap-4 rounded-xl border border-border bg-bg p-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end">
        <div>
          <p className="font-body text-sm font-bold text-primary">Date range</p>
          <DateRangePicker
            ariaLabel="Choose dates to block"
            className="mt-2"
            startDate={blockStart}
            endDate={blockEnd}
            onChange={onDateChange}
          />
        </div>
        <label className="block font-body text-sm font-bold text-primary">
          Reason <span className="font-normal text-muted">(optional)</span>
          <input
            type="text"
            value={blockReason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="For example, repairs"
            className="mt-2 min-h-12 w-full rounded-lg border border-primary/15 bg-bg px-4 font-body text-sm font-normal text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </label>
        <button
          type="button"
          onClick={() => void onBlock()}
          disabled={isBlocking || !blockStart || !blockEnd}
          aria-busy={isBlocking}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AsyncButtonContent
            isPending={isBlocking}
            pendingLabel="Blocking dates..."
          >
            <CalendarOff size={16} aria-hidden="true" />
            Block dates
          </AsyncButtonContent>
        </button>
      </div>

      {status === "idle" || status === "loading" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Loading blocked dates">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-6 border-l-2 border-red-700 pl-4" role="alert">
          <p className="font-body text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void onRetry()}
            className="mt-3 inline-flex min-h-11 items-center font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Retry dates
          </button>
        </div>
      ) : null}

      {status === "ready" ? (
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <DateRangeList
            title="Blocked by you"
            emptyMessage="You have not blocked any dates."
            ranges={blocks}
            busyBlockId={busyBlockId}
            onUnblock={onUnblock}
          />
          <DateRangeList
            title="Guest bookings"
            emptyMessage="No guest bookings are holding dates."
            ranges={booked}
          />
        </div>
      ) : null}
    </section>
  );
}

interface DateRangeListProps {
  busyBlockId?: number | null;
  emptyMessage: string;
  onUnblock?: (range: UnavailableRange) => Promise<void>;
  ranges: UnavailableRange[];
  title: string;
}

function DateRangeList({
  busyBlockId,
  emptyMessage,
  onUnblock,
  ranges,
  title,
}: DateRangeListProps): ReactElement {
  return (
    <div>
      <h3 className="font-body text-xs font-bold uppercase tracking-[0.16em] text-muted">
        {title}
      </h3>
      {ranges.length === 0 ? (
        <p className="mt-3 font-body text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {ranges.map((range) => (
            <li
              key={`${range.source}-${range.id}`}
              className="flex min-h-16 items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-body text-sm font-bold text-primary">
                  {formatRange(range)}
                </p>
                {range.reason ? (
                  <p className="mt-1 truncate font-body text-xs text-muted">
                    {range.reason}
                  </p>
                ) : null}
              </div>
              {range.source === "BLOCK" && onUnblock ? (
                <button
                  type="button"
                  onClick={() => void onUnblock(range)}
                  disabled={busyBlockId === range.id}
                  aria-busy={busyBlockId === range.id}
                  className="inline-flex min-h-11 shrink-0 items-center font-body text-xs font-bold text-accent-alt hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                >
                  <AsyncButtonContent
                    isPending={busyBlockId === range.id}
                    pendingLabel="Reopening..."
                  >
                    Reopen
                  </AsyncButtonContent>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface PhotosPanelProps {
  busyPhotoKey: string | null;
  error: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onDelete: (photo: GalleryImage) => void;
  onMakeCover: (photo: GalleryImage) => Promise<void>;
  onRetry: () => Promise<void>;
  onUpload: (files: FileList | null) => Promise<void>;
  photos: GalleryImage[];
  status: LoadStatus;
}

function PhotosPanel({
  busyPhotoKey,
  error,
  fileInputRef,
  isUploading,
  onDelete,
  onMakeCover,
  onRetry,
  onUpload,
  photos,
  status,
}: PhotosPanelProps): ReactElement {
  const limitReached = photos.length >= 20;

  return (
    <section
      id="management-panel-photos"
      role="tabpanel"
      aria-labelledby="management-tab-photos"
      tabIndex={0}
      className="outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Photos</h2>
          <p className="mt-2 font-body text-sm leading-6 text-muted">
            {photos.length} {photos.length === 1 ? "photo" : "photos"}. Add up to 20 and choose the image renters see first.
          </p>
        </div>
        <label
          className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white focus-within:ring-2 focus-within:ring-accent ${
            limitReached || isUploading
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:bg-primary/90"
          }`}
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <ImagePlus size={16} aria-hidden="true" />
          )}
          {isUploading ? "Adding photos..." : limitReached ? "Photo limit reached" : "Add photos"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isUploading || limitReached}
            onChange={(event) => void onUpload(event.target.files)}
            className="sr-only"
          />
        </label>
      </div>

      {status === "idle" || status === "loading" ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading photos">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="aspect-video w-full" />
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-6 border-l-2 border-red-700 pl-4" role="alert">
          <p className="font-body text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void onRetry()}
            className="mt-3 inline-flex min-h-11 items-center font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Retry photos
          </button>
        </div>
      ) : null}

      {status === "ready" && photos.length === 0 ? (
        <div className="mt-6 flex min-h-64 flex-col items-center justify-center border-y border-border px-6 text-center">
          <ImagePlus size={30} className="text-primary" aria-hidden="true" />
          <h3 className="mt-4 font-display text-xl font-bold text-primary">
            Add your first photo
          </h3>
          <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">
            Clear, well-lit images help renters understand the home before they request it.
          </p>
        </div>
      ) : null}

      {status === "ready" && photos.length > 0 ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm"
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
                    icon={<CheckCircle2 size={13} aria-hidden="true" />}
                    className="absolute left-3 top-3 bg-bg/95"
                  >
                    Cover photo
                  </StatusBadge>
                ) : null}
              </div>
              <div className="flex min-h-16 items-center justify-between gap-3 px-3 py-2">
                {photo.cover ? (
                  <span className="px-2 font-body text-xs text-muted">
                    Shown in search
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void onMakeCover(photo)}
                    disabled={busyPhotoKey?.startsWith(`${photo.id}:`) ?? false}
                    aria-busy={busyPhotoKey === `${photo.id}:cover`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-body text-xs font-bold text-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                  >
                    <AsyncButtonContent
                      isPending={busyPhotoKey === `${photo.id}:cover`}
                      pendingLabel="Updating..."
                    >
                      <Star size={15} aria-hidden="true" />
                      Make cover
                    </AsyncButtonContent>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(photo)}
                  disabled={busyPhotoKey?.startsWith(`${photo.id}:`) ?? false}
                  aria-label={`Remove ${photo.cover ? "cover " : ""}photo`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-red-700 hover:bg-red-700/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ManagementPageSkeleton({
  role,
}: Pick<ManageListingViewProps, "role">): ReactElement {
  return (
    <main className="min-h-screen px-5 py-7 sm:px-8 lg:px-10 xl:px-14" aria-busy="true">
      <div className="mx-auto max-w-[1440px]">
        <Link
          href={`/${role}/saved-listings`}
          className="inline-flex min-h-11 items-center gap-2 font-body text-sm font-medium text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to listings
        </Link>
        <div className="flex flex-col gap-5 pb-6 pt-3 lg:flex-row lg:items-end lg:justify-between" aria-hidden="true">
          <div>
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="mt-3 h-5 w-96 max-w-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
        <div className="flex gap-3 border-y border-border py-2" aria-hidden="true">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-24" />
          <Skeleton className="h-11 w-32" />
        </div>
        <div className="pt-8" aria-hidden="true">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-24 w-full" />
            ))}
          </div>
        </div>
        <span className="sr-only">Loading listing management</span>
      </div>
    </main>
  );
}
