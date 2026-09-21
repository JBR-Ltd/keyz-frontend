"use client";

import type {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  ReactElement,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Home,
  ImagePlus,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from "@/components/navigation/BackButton";
import { Select, toSelectOptions } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  getHostListingById,
  saveHostListingDraft,
  submitHostListing,
  type HostListingInput,
  type HostListingPhoto,
  type HostListingRole,
  type RentalMode,
} from "@/lib/hostListings";
import type { PropertyListingStatus } from "@/lib/propertyDetails";
import {
  readDeviceLocation,
  submitPropertyProof,
  type ProofCapture,
} from "@/lib/propertyVerification";
import { cn } from "@/lib/utils";
import { getMandates, type Mandate } from "@/lib/marketplace";

interface CreateListingFormProps {
  experience?: ListingFormExperience;
  initialListingId?: string;
  role: HostListingRole;
}

interface ListingFormValues {
  title: string;
  description: string;
  price: string;
  city: string;
  area: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: string;
  amenities: string[];
  rentalMode: RentalMode;
  /** Shortlets only, kept as strings so the inputs stay controlled while empty. */
  minimumNights: string;
  maximumGuests: string;
  cleaningFee: string;
  /** Refundable. Nigerian lettings call it a caution fee. */
  securityDeposit: string;
  /** Yearly lets only. */
  instalmentsAllowed: boolean;
  maxInstalments: string;
  unitCount: number;
  mandateId: string;
}

const RENTAL_MODE_OPTIONS: { label: string; value: RentalMode }[] = [
  { label: "Per year, paid up front", value: "ANNUAL" },
  { label: "Per month", value: "MONTHLY" },
  { label: "Per night (shortlet)", value: "SHORT_STAY" },
];

/** The price field means something different in each mode, so it says which. */
const PRICE_LABELS: Record<RentalMode, string> = {
  ANNUAL: "Rent per year",
  MONTHLY: "Rent per month",
  SHORT_STAY: "Price per night",
};

const PRICE_PERIOD_LABELS: Record<RentalMode, string> = {
  ANNUAL: "year",
  MONTHLY: "month",
  SHORT_STAY: "night",
};

interface ListingFormErrors {
  title?: string;
  description?: string;
  price?: string;
  city?: string;
  area?: string;
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  photos?: string;
  unitCount?: string;
  mandateId?: string;
}

interface EditablePhoto extends HostListingPhoto {
  uploading: boolean;
}

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

interface MoneyInputProps {
  helperText: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

interface NumericStepperFieldProps {
  helperText: string;
  label: string;
  max?: number;
  min: number;
  onChange: (value: string) => void;
  placeholder: string;
  unit: string;
  value: string;
}

interface FormSectionHeadingProps {
  id: string;
  index: string;
  title: string;
  description: string;
}

interface ListingStepOption {
  id: ListingStep;
  label: string;
}

type ListingFormExperience = "classic" | "guided";

type ListingStep =
  | "basics"
  | "location"
  | "details"
  | "pricing"
  | "photos"
  | "verify"
  | "review";

const AMENITIES = [
  "Parking",
  "Security",
  "Generator",
  "Water Supply",
  "Elevator",
  "Balcony",
  "Garden",
  "Wifi",
  "Air Conditioning",
  "Furnished",
];

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Other"];

const LISTING_STEPS: ListingStepOption[] = [
  { id: "basics", label: "Basics" },
  { id: "location", label: "Location" },
  { id: "details", label: "Details" },
  { id: "pricing", label: "Pricing" },
  { id: "photos", label: "Photos" },
  { id: "verify", label: "Verification" },
  { id: "review", label: "Review" },
];

const INITIAL_VALUES: ListingFormValues = {
  title: "",
  description: "",
  price: "",
  city: "",
  area: "",
  address: "",
  bedrooms: 0,
  bathrooms: 0,
  squareFootage: "",
  amenities: [],
  // Annual up front is the Nigerian default, so a host who ignores this still
  // gets the right pricing rather than a nightly rate
  rentalMode: "ANNUAL",
  minimumNights: "2",
  maximumGuests: "",
  cleaningFee: "",
  securityDeposit: "",
  instalmentsAllowed: false,
  maxInstalments: "4",
  unitCount: 1,
  mandateId: "",
};

const INPUT_CLASS_NAME =
  "mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30";

function createPhotoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function validateForm(
  values: ListingFormValues,
  photos: EditablePhoto[],
  role: HostListingRole,
): ListingFormErrors {
  const errors: ListingFormErrors = {};

  if (!values.title.trim()) errors.title = "Enter a listing title.";
  if (!values.description.trim()) {
    errors.description = "Add a property description.";
  }
  if (!values.price || Number(values.price) <= 0) {
    errors.price = "Enter a price greater than zero.";
  }
  if (!values.city) errors.city = "Select a city.";
  if (!values.area.trim()) errors.area = "Enter an area or neighborhood.";
  if (!values.address.trim()) errors.address = "Enter the property address.";
  if (values.bedrooms < 1) errors.bedrooms = "Add at least one bedroom.";
  if (values.bathrooms < 1) errors.bathrooms = "Add at least one bathroom.";
  if (photos.length === 0)
    errors.photos = "Add at least one photo to continue.";
  if (photos.some((photo) => photo.uploading)) {
    errors.photos = "Wait for photo uploads to finish.";
  }
  if (values.unitCount < 1 || values.unitCount > 500) {
    errors.unitCount = "Enter between 1 and 500 identical units.";
  }
  if (role === "agent" && !values.mandateId) {
    errors.mandateId = "Choose the landlord mandate for this listing.";
  }

  return errors;
}

function hasErrors(errors: ListingFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function validateListingStep(
  values: ListingFormValues,
  photos: EditablePhoto[],
  step: ListingStep,
  role: HostListingRole,
): ListingFormErrors {
  const errors = validateForm(values, photos, role);

  if (step === "basics") {
    return {
      title: errors.title,
      description: errors.description,
      unitCount: errors.unitCount,
      mandateId: errors.mandateId,
    };
  }

  if (step === "location") {
    return {
      city: errors.city,
      area: errors.area,
      address: errors.address,
    };
  }

  if (step === "details") {
    return {
      bedrooms: errors.bedrooms,
      bathrooms: errors.bathrooms,
    };
  }

  if (step === "pricing") return { price: errors.price };

  if (step === "photos") {
    return { photos: errors.photos };
  }

  return {};
}

function formatPreviewPrice(value: string, rentalMode: RentalMode): string {
  const amount = Number(value);

  const suffix: Record<RentalMode, string> = {
    ANNUAL: "/yr",
    MONTHLY: "/month",
    SHORT_STAY: "/night",
  };

  return amount > 0
    ? `₦${amount.toLocaleString("en-NG")}${suffix[rentalMode]}`
    : "Price not set";
}

function formatCurrencyInput(value: string): string {
  const amount = Number(value);

  return value && Number.isFinite(amount) ? amount.toLocaleString("en-NG") : "";
}

function digitsOnly(value: string, maximumLength = 15): string {
  return value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, maximumLength);
}

function FormSectionHeading({
  id,
  index,
  title,
  description,
}: FormSectionHeadingProps): ReactElement {
  return (
    <div className="mb-6 flex items-start gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-body text-xs font-bold text-white">
        {index}
      </span>
      <div>
        <h2 id={id} className="font-display text-2xl font-bold text-primary">
          {title}
        </h2>
        <p className="mt-1 font-body text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  onChange,
  error,
}: NumberStepperProps): ReactElement {
  return (
    <div>
      <span className="font-body text-sm font-bold text-primary">{label}</span>
      <div className="mt-2 grid min-h-12 grid-cols-[3rem_1fr_3rem] overflow-hidden rounded-lg border border-border bg-bg focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex items-center justify-center border-r border-border text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus size={17} aria-hidden="true" />
        </button>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) =>
            onChange(Math.max(0, Number(event.target.value)))
          }
          className="min-w-0 bg-bg text-center font-body text-base font-bold text-primary outline-none"
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex items-center justify-center border-l border-border text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus size={17} aria-hidden="true" />
        </button>
      </div>
      {error ? (
        <p className="mt-2 font-body text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MoneyInput({
  helperText,
  label,
  onChange,
  value,
}: MoneyInputProps): ReactElement {
  return (
    <label>
      <span className="font-body text-sm font-bold text-primary">{label}</span>
      <span className="mt-2 flex min-h-12 items-center overflow-hidden rounded-lg border border-border bg-bg transition-all duration-200 ease-in-out focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
        <span className="flex min-h-12 items-center border-r border-border px-4 font-body text-base font-bold text-primary">
          ₦
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={formatCurrencyInput(value)}
          onChange={(event) => onChange(digitsOnly(event.target.value))}
          className="min-h-12 min-w-0 flex-1 bg-transparent px-4 font-body text-base text-primary outline-none placeholder:text-primary/45"
          placeholder="0"
          aria-label={`${label} in naira`}
        />
      </span>
      <span className="mt-2 block font-body text-xs leading-5 text-muted">
        {helperText}
      </span>
    </label>
  );
}

function NumericStepperField({
  helperText,
  label,
  max,
  min,
  onChange,
  placeholder,
  unit,
  value,
}: NumericStepperFieldProps): ReactElement {
  const parsedValue = value ? Number(value) : null;
  const hasValue = parsedValue !== null && Number.isFinite(parsedValue);
  const currentValue = hasValue ? parsedValue : min;
  const decrementDisabled = !hasValue || currentValue <= min;
  const incrementDisabled = max !== undefined && currentValue >= max;

  const setBoundedValue = (nextValue: number): void => {
    const boundedValue = Math.min(Math.max(nextValue, min), max ?? nextValue);
    onChange(String(boundedValue));
  };

  return (
    <div>
      <span className="font-body text-sm font-bold text-primary">{label}</span>
      <div className="mt-2 grid min-h-12 grid-cols-[3rem_minmax(0,1fr)_auto_3rem] overflow-hidden rounded-lg border border-border bg-bg transition-all duration-200 ease-in-out focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
        <button
          type="button"
          onClick={() => setBoundedValue(currentValue - 1)}
          disabled={decrementDisabled}
          className="flex items-center justify-center border-r border-border text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-not-allowed disabled:text-muted/35"
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => {
            const nextValue = digitsOnly(event.target.value, 2);

            if (!nextValue) {
              onChange("");
              return;
            }

            setBoundedValue(Number(nextValue));
          }}
          className="min-w-0 bg-transparent px-3 text-right font-body text-base font-bold text-primary outline-none placeholder:text-primary/45"
          placeholder={placeholder}
          aria-label={label}
        />
        <span className="flex items-center pr-3 font-body text-xs font-medium text-muted">
          {unit}
        </span>
        <button
          type="button"
          onClick={() => setBoundedValue(hasValue ? currentValue + 1 : min)}
          disabled={incrementDisabled}
          className="flex items-center justify-center border-l border-border text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-not-allowed disabled:text-muted/35"
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <span className="mt-2 block font-body text-xs leading-5 text-muted">
        {helperText}
      </span>
    </div>
  );
}

export default function CreateListingForm({
  experience = "classic",
  initialListingId,
  role,
}: CreateListingFormProps): ReactElement {
  const router = useRouter();
  const { notify } = useToast();
  const [values, setValues] = useState<ListingFormValues>(INITIAL_VALUES);
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(
    Boolean(initialListingId),
  );
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [listingStep, setListingStep] = useState<ListingStep>("basics");
  const [furthestStepIndex, setFurthestStepIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [proofCapture, setProofCapture] = useState<ProofCapture | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [mandatesLoading, setMandatesLoading] = useState(role === "agent");
  // Rentals only for now, for landlords and agents alike. Sale reopens with the backend flag.
  const listingType: PropertyListingStatus = "FOR_RENT";
  const typeLabel = "Rental listing";
  const typeHelper =
    role === "agent"
      ? "You are listing this rental on the owner's behalf."
      : "Your account is set up for rental listings.";
  const priceLabel = PRICE_LABELS[values.rentalMode];
  const isShortStay = values.rentalMode === "SHORT_STAY";
  const canSubmit = !hasErrors(validateForm(values, photos, role));
  const listingStepIndex = LISTING_STEPS.findIndex(
    (step) => step.id === listingStep,
  );
  const coverPhoto = photos[0];

  useEffect(() => {
    if (role !== "agent") {
      return;
    }

    let active = true;

    void getMandates().then((result) => {
      if (!active) return;
      setMandates(result.data.filter((mandate) => mandate.status === "ACTIVE"));
      setMandatesLoading(false);
    });

    return () => {
      active = false;
    };
  }, [role]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent): void => {
      if (!isDirty || isSubmitting) return;

      event.preventDefault();
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty, isSubmitting]);

  useEffect(() => {
    if (!initialListingId) {
      return;
    }

    let active = true;

    const loadDraft = async (): Promise<void> => {
      const result = await getHostListingById(initialListingId);

      if (!active) {
        return;
      }

      setStorageUnavailable(result.unavailable);

      if (!result.data || result.data.ownerRole !== role) {
        notify({
          title: "Listing could not be opened",
          description: result.message ?? "This listing is unavailable.",
          variant: "error",
        });
        setIsLoadingDraft(false);
        return;
      }

      setDraftId(result.data.id);
      setValues({
        title: result.data.title,
        description: result.data.description,
        price: result.data.price > 0 ? String(result.data.price) : "",
        city: result.data.city,
        area: result.data.area,
        address: result.data.address,
        bedrooms: result.data.bedrooms,
        bathrooms: result.data.bathrooms,
        squareFootage: result.data.squareFootage
          ? String(result.data.squareFootage)
          : "",
        amenities: result.data.amenities,
        rentalMode: result.data.rentalMode ?? "ANNUAL",
        minimumNights:
          result.data.minimumNights === undefined ||
          result.data.minimumNights === null
            ? "2"
            : String(result.data.minimumNights),
        maximumGuests:
          result.data.maximumGuests === undefined ||
          result.data.maximumGuests === null
            ? ""
            : String(result.data.maximumGuests),
        securityDeposit:
          result.data.securityDeposit === undefined ||
          result.data.securityDeposit === null
            ? ""
            : String(result.data.securityDeposit),
        cleaningFee:
          result.data.cleaningFee === undefined ||
          result.data.cleaningFee === null
            ? ""
            : String(result.data.cleaningFee),
        instalmentsAllowed: result.data.instalmentsAllowed === true,
        maxInstalments: String(result.data.maxInstalments ?? 4),
        unitCount: result.data.unitCount ?? 1,
        mandateId: result.data.mandateId ? String(result.data.mandateId) : "",
      });
      setPhotos(
        result.data.photos.map((photo) => ({ ...photo, uploading: false })),
      );
      setIsDirty(false);
      setIsLoadingDraft(false);
    };

    void loadDraft();

    return () => {
      active = false;
    };
  }, [initialListingId, notify, role]);

  const updateValue = <TKey extends keyof ListingFormValues>(
    key: TKey,
    value: ListingFormValues[TKey],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setIsDirty(true);
  };

  /**
   * How the listing is priced, plus the two fields that only apply to a shortlet.
   *
   * Rendered in both the guided flow and the single-page layout from one place, so
   * the two cannot fall out of step.
   */
  const renderRentalModeFields = (): ReactElement => (
    <>
      <label className="sm:col-span-2">
        <span className="font-body text-sm font-bold text-primary">
          How is this let?
        </span>
        <Select
          value={values.rentalMode}
          onValueChange={(mode) =>
            updateValue("rentalMode", mode as RentalMode)
          }
          className={INPUT_CLASS_NAME}
          ariaLabel="How is this let"
          options={RENTAL_MODE_OPTIONS}
        />
        <span className="mt-2 block font-body text-xs leading-5 text-muted">
          {isShortStay
            ? "Guests book by the night and pay for the whole stay up front."
            : "Tenants pay for the full period up front, held in escrow until they move in."}
        </span>
      </label>

      <MoneyInput
        label={isShortStay ? "Refundable damage deposit" : "Refundable deposit"}
        value={values.securityDeposit}
        onChange={(value) => updateValue("securityDeposit", value)}
        helperText={
          isShortStay
            ? "Held by Rello and returned to the guest after checkout if no approved damage claim is made. Leave it empty if you ask for none."
            : "The caution fee, held by Rello and returned to the tenant when the tenancy ends. You can claim against it for damage, with evidence. Leave it empty if you ask for none."
        }
      />

      {values.rentalMode === "ANNUAL" ? (
        <div className="sm:col-span-2 rounded-lg border border-border p-4">
          <label className="flex items-start gap-3">
            <input
              id="listing-instalments-allowed"
              type="checkbox"
              checked={values.instalmentsAllowed}
              onChange={(event) =>
                updateValue("instalmentsAllowed", event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block font-body text-sm font-bold text-primary">
                Let tenants pay the rent in parts
              </span>
              <span className="mt-1 block font-body text-xs leading-5 text-muted">
                Many tenants cannot raise a full year up front. The deposit is
                paid with the first part, each later part is collected through
                Rello, and you are paid a few days after each one lands.
              </span>
            </span>
          </label>
          {values.instalmentsAllowed ? (
            <label className="mt-4 block">
              <span className="font-body text-sm font-bold text-primary">
                Most parts you will accept
              </span>
              <Select
                value={values.maxInstalments}
                onValueChange={(value) => updateValue("maxInstalments", value)}
                className={INPUT_CLASS_NAME}
                ariaLabel="Most instalments"
                options={[
                  { label: "2 parts, every 6 months", value: "2" },
                  { label: "4 parts, every quarter", value: "4" },
                  { label: "12 parts, every month", value: "12" },
                ]}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {isShortStay ? (
        <>
          <NumericStepperField
            label="Minimum nights"
            value={values.minimumNights}
            min={1}
            placeholder="2"
            unit="nights"
            onChange={(value) => updateValue("minimumNights", value)}
            helperText="The shortest stay you will take."
          />

          <NumericStepperField
            label="Maximum guests"
            value={values.maximumGuests}
            min={1}
            max={50}
            placeholder="4"
            unit="guests"
            onChange={(value) => updateValue("maximumGuests", value)}
            helperText="How many people the home sleeps. Guests cannot book for more."
          />

          <MoneyInput
            label="Cleaning fee"
            value={values.cleaningFee}
            onChange={(value) => updateValue("cleaningFee", value)}
            helperText="Added once to the stay, not per night."
          />
        </>
      ) : null}
    </>
  );

  const renderListingPartiesAndUnits = (): ReactElement => (
    <>
      {role === "agent" ? (
        <label className="sm:col-span-2">
          <span className="font-body text-sm font-bold text-primary">
            Property owner
          </span>
          <Select
            value={values.mandateId}
            onValueChange={(value) => updateValue("mandateId", value)}
            className={INPUT_CLASS_NAME}
            ariaLabel="Property owner mandate"
            disabled={mandatesLoading}
            placeholder={
              mandatesLoading ? "Loading landlords..." : "Choose a landlord"
            }
            options={mandates.map((mandate) => ({
              label: `${mandate.landlordName ?? mandate.landlordEmail} · ${mandate.agentFeePercent}% fee`,
              value: String(mandate.id),
            }))}
          />
          <span className="mt-2 block font-body text-xs leading-5 text-muted">
            The landlord remains the legal owner and payout recipient. You
            remain the listing manager.
          </span>
          {errors.mandateId ? (
            <span className="mt-2 block font-body text-sm font-medium text-red-700">
              {errors.mandateId}
            </span>
          ) : null}
        </label>
      ) : null}

      <label className="sm:col-span-2">
        <span className="font-body text-sm font-bold text-primary">
          How many identical units are available?
        </span>
        <input
          type="number"
          min="1"
          max="500"
          value={values.unitCount}
          onChange={(event) =>
            updateValue(
              "unitCount",
              Math.min(Math.max(Number(event.target.value) || 1, 1), 500),
            )
          }
          className={INPUT_CLASS_NAME}
          aria-invalid={Boolean(errors.unitCount)}
        />
        <span className="mt-2 block font-body text-xs leading-5 text-muted">
          Renters see one listing. Rello tracks each identical unit separately
          and assigns one when a request is accepted.
        </span>
        {errors.unitCount ? (
          <span className="mt-2 block font-body text-sm font-medium text-red-700">
            {errors.unitCount}
          </span>
        ) : null}
      </label>
    </>
  );

  const buildListingInput = (): HostListingInput => ({
    id: draftId ?? undefined,
    ownerRole: role,
    listingType,
    title: values.title.trim(),
    description: values.description.trim(),
    price: Number(values.price) || 0,
    city: values.city,
    area: values.area.trim(),
    address: values.address.trim(),
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    squareFootage: values.squareFootage
      ? Number(values.squareFootage)
      : undefined,
    amenities: values.amenities,
    rentalMode: values.rentalMode,
    minimumNights:
      values.rentalMode === "SHORT_STAY"
        ? Math.max(Number(values.minimumNights) || 1, 1)
        : undefined,
    maximumGuests:
      values.rentalMode === "SHORT_STAY" && values.maximumGuests
        ? Math.min(Math.max(Number(values.maximumGuests) || 1, 1), 50)
        : undefined,
    securityDeposit: values.securityDeposit
      ? Math.max(Number(values.securityDeposit) || 0, 0)
      : undefined,
    instalmentsAllowed:
      values.rentalMode === "ANNUAL" ? values.instalmentsAllowed : undefined,
    maxInstalments:
      values.rentalMode === "ANNUAL" && values.instalmentsAllowed
        ? Number(values.maxInstalments)
        : undefined,
    cleaningFee:
      values.rentalMode === "SHORT_STAY"
        ? Math.max(Number(values.cleaningFee) || 0, 0)
        : undefined,
    unitCount: values.unitCount,
    mandateId: values.mandateId ? Number(values.mandateId) : undefined,
    photos: photos.map((photo) => ({
      id: photo.id,
      dataUrl: photo.dataUrl,
      name: photo.name,
      type: photo.type,
    })),
  });

  const addFiles = async (files: File[]): Promise<void> => {
    const remainingSlots = Math.max(20 - photos.length, 0);
    const imageFiles = files
      .filter(
        (file) => file.type.startsWith("image/") && file.size <= 10_000_000,
      )
      .slice(0, remainingSlots);

    if (imageFiles.length === 0) {
      setErrors((current) => ({
        ...current,
        photos:
          remainingSlots === 0
            ? "You can add up to 20 photos."
            : "Choose an image smaller than 10 MB.",
      }));
      return;
    }

    if (imageFiles.length < files.length) {
      notify({
        title: "Some photos were not added",
        description: "Use image files under 10 MB, with no more than 20 total.",
        variant: "error",
      });
    }

    try {
      const nextPhotos = await Promise.all(
        imageFiles.map(
          async (file): Promise<EditablePhoto> => ({
            id: createPhotoId(),
            dataUrl: await readFileAsDataUrl(file),
            name: file.name,
            type: file.type,
            uploading: false,
          }),
        ),
      );

      setPhotos((current) => [...current, ...nextPhotos]);
      setIsDirty(true);
      setErrors((current) => ({ ...current, photos: undefined }));
    } catch {
      setErrors((current) => ({
        ...current,
        photos: "One or more photos could not be read.",
      }));
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>): void => {
    void addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleProofCapture = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsCapturing(true);

    try {
      // Read the fix and the photo together so the location belongs to this capture
      const [dataUrl, fix] = await Promise.all([
        readFileAsDataUrl(file),
        readDeviceLocation(),
      ]);

      setProofCapture({
        capturedAt: new Date().toISOString(),
        dataUrl,
        fix,
        name: file.name || "proof.jpg",
        type: file.type || "image/jpeg",
      });
      setIsDirty(true);

      if (!fix) {
        notify({
          title: "Location unavailable",
          description:
            "Turn on location for your browser, then take the photo again.",
          variant: "error",
        });
      }
    } catch {
      notify({
        title: "Photo could not be read",
        description: "Take the photo again.",
        variant: "error",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>): void => {
    event.preventDefault();
    void addFiles(Array.from(event.dataTransfer.files));
  };

  const handleDropKeyDown = (event: KeyboardEvent<HTMLLabelElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLInputElement>("input")?.click();
    }
  };

  const toggleAmenity = (amenity: string): void => {
    updateValue(
      "amenities",
      values.amenities.includes(amenity)
        ? values.amenities.filter((item) => item !== amenity)
        : [...values.amenities, amenity],
    );
  };

  const removePhoto = (photoId: string): void => {
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    setIsDirty(true);
  };

  const makeCover = (photoId: string): void => {
    setPhotos((current) => {
      const selected = current.find((photo) => photo.id === photoId);
      return selected
        ? [selected, ...current.filter((photo) => photo.id !== photoId)]
        : current;
    });
    setIsDirty(true);
  };

  const movePhoto = (photoId: string, offset: -1 | 1): void => {
    setPhotos((current) => {
      const index = current.findIndex((photo) => photo.id === photoId);
      const nextIndex = index + offset;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const reordered = [...current];
      [reordered[index], reordered[nextIndex]] = [
        reordered[nextIndex],
        reordered[index],
      ];
      return reordered;
    });
    setIsDirty(true);
  };

  const moveToListingStep = (step: ListingStep): void => {
    setErrors({});
    setListingStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContinue = (): void => {
    const nextErrors = validateListingStep(values, photos, listingStep, role);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      notify({
        title: "Complete this step",
        description: "Review the highlighted fields before continuing.",
        variant: "error",
      });
      return;
    }

    const nextStep = LISTING_STEPS[listingStepIndex + 1];

    if (nextStep) {
      setFurthestStepIndex((current) =>
        Math.max(current, listingStepIndex + 1),
      );
      moveToListingStep(nextStep.id);
    }
  };

  const handleBack = (): void => {
    const previousStep = LISTING_STEPS[listingStepIndex - 1];

    if (previousStep) {
      moveToListingStep(previousStep.id);
    }
  };

  const handleSaveDraft = async (): Promise<void> => {
    setIsSavingDraft(true);
    const result = await saveHostListingDraft(buildListingInput());
    setIsSavingDraft(false);
    setStorageUnavailable(result.unavailable);

    if (!result.data) {
      notify({
        title: "Draft could not be saved",
        description: result.message ?? "Local listing storage is unavailable.",
        variant: "error",
      });
      return;
    }

    setDraftId(result.data.id);
    setIsDirty(false);
    notify({ title: "Draft saved", variant: "success" });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const nextErrors = validateForm(values, photos, role);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      notify({
        title: "Complete the required fields",
        description: "Review the highlighted fields before submitting.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await submitHostListing(buildListingInput());
    setIsSubmitting(false);
    setStorageUnavailable(result.unavailable);

    if (!result.data) {
      notify({
        title: "Listing could not be saved",
        description: result.message ?? "The property server is unavailable.",
        variant: "error",
      });
      return;
    }

    setIsDirty(false);

    // The proof needs the listing's real id, so it can only go up once the listing exists
    const propertyId = Number(result.data.id);

    if (proofCapture && Number.isFinite(propertyId)) {
      const proofResult = await submitPropertyProof(propertyId, proofCapture);

      notify({
        title: proofResult.success
          ? "Listing verified and live"
          : "Listing saved, not yet verified",
        description: proofResult.success
          ? proofResult.message
          : `${proofResult.message} You can verify with a utility bill instead.`,
        variant: proofResult.success ? "success" : "error",
      });

      // A failed location check used to leave the host at their listings with no
      // other way to go live, so it lands on the bill route instead
      router.push(
        proofResult.success
          ? `/${role}/saved-listings`
          : `/${role}/listings/${propertyId}/verify`,
      );
      return;
    }

    notify({
      title: draftId
        ? "Listing updated successfully."
        : "Listing saved. Verify it at the property to go live.",
      description: result.message,
      variant: "success",
    });
    router.push(`/${role}/saved-listings`);
  };

  if (isLoadingDraft) {
    return (
      <main
        className="min-h-screen px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14"
        role="status"
        aria-label="Opening listing draft"
      >
        <div className="mx-auto max-w-5xl">
          <Skeleton className="h-5 w-36" />
          <div className="mt-8 flex items-end justify-between gap-5">
            <div className="flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-10 w-3/5" />
              <Skeleton className="mt-4 h-5 w-4/5" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
          <section className="mt-10 rounded-2xl border border-border bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14 sm:col-span-2" />
              <Skeleton className="h-32 sm:col-span-2" />
            </div>
          </section>
          <div className="mt-8 flex justify-end">
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </div>
        <span className="sr-only">Opening listing draft</span>
      </main>
    );
  }

  if (experience === "guided") {
    return (
      <main className="min-h-screen overflow-x-clip px-5 pb-0 pt-12 sm:px-8 lg:px-10 lg:pt-16 xl:px-14">
        <div className="mx-auto max-w-7xl">
          <header className="pb-8">
            {listingStepIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Back
              </button>
            ) : (
              <BackButton
                fallbackHref={`/${role}/saved-listings`}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Back to listings
              </BackButton>
            )}

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
                  {draftId ? "Editing Draft" : "New Listing"}
                </p>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-primary">
                  {draftId ? "Continue your listing" : "Create your listing"}
                </h1>
                <p className="mt-3 max-w-2xl font-body text-base leading-7 text-muted">
                  Build a complete rental listing one focused step at a time.
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-sm font-bold text-primary">
                  {LISTING_STEPS[listingStepIndex]?.label}
                </p>
                <p className="mt-1 font-body text-xs text-muted">
                  Step {listingStepIndex + 1} of {LISTING_STEPS.length}
                </p>
              </div>
            </div>
          </header>

          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-soft lg:hidden"
            role="progressbar"
            aria-label={`Listing creation step ${listingStepIndex + 1} of ${LISTING_STEPS.length}`}
            aria-valuemin={1}
            aria-valuemax={LISTING_STEPS.length}
            aria-valuenow={listingStepIndex + 1}
          >
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-in-out"
              style={{
                width: `${((listingStepIndex + 1) / LISTING_STEPS.length) * 100}%`,
              }}
            />
          </div>

          {storageUnavailable ? (
            <p className="mt-6 rounded-lg border border-red-500/40 bg-bg px-4 py-3 font-body text-sm font-bold text-red-700">
              Local listing storage is unavailable in this browser session.
            </p>
          ) : null}

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,44rem)_15rem]">
            <aside
              className="sticky top-24 hidden lg:block"
              aria-label="Listing steps"
            >
              <ol className="space-y-1">
                {LISTING_STEPS.map((step, index) => {
                  const current = index === listingStepIndex;
                  const complete =
                    index < listingStepIndex || index < furthestStepIndex;
                  const available = index <= furthestStepIndex;

                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => available && moveToListingStep(step.id)}
                        disabled={!available}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-body text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                          current
                            ? "bg-primary text-white"
                            : available
                              ? "text-primary hover:bg-surface-soft"
                              : "cursor-not-allowed text-muted/60",
                        )}
                        aria-current={current ? "step" : undefined}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                            current
                              ? "border-accent bg-accent text-primary"
                              : complete
                                ? "border-accent text-accent-alt"
                                : "border-current/25",
                          )}
                        >
                          {complete && !current ? (
                            <Check size={14} aria-hidden="true" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        {step.label}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </aside>

            <form
              className="min-w-0"
              noValidate
              onSubmit={(event) => {
                if (listingStep !== "review") {
                  event.preventDefault();
                  handleContinue();
                  return;
                }

                void handleSubmit(event);
              }}
            >
              <div
                key={listingStep}
                className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-2xl border border-border bg-bg p-5 shadow-sm duration-300 motion-reduce:animate-none sm:p-8 lg:p-10"
              >
                {listingStep === "basics" ? (
                  <section aria-labelledby="guided-listing-basics">
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Property basics
                    </p>
                    <h2
                      id="guided-listing-basics"
                      className="mt-2 font-display text-2xl font-bold text-primary"
                    >
                      Start with the essentials
                    </h2>
                    <p className="mt-2 font-body text-sm leading-6 text-muted">
                      Give renters a clear first impression of the home.
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <p className="font-body text-sm font-bold text-primary">
                          Listing Type
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3">
                          <span className="rounded-full border border-accent/40 px-3 py-1.5 font-body text-xs font-bold text-primary">
                            {typeLabel}
                          </span>
                          <span className="font-body text-sm text-muted">
                            {typeHelper}
                          </span>
                        </div>
                      </div>

                      {renderListingPartiesAndUnits()}

                      <label className="sm:col-span-2">
                        <span className="font-body text-sm font-bold text-primary">
                          Title{" "}
                          <span className="font-normal text-muted">
                            (required)
                          </span>
                        </span>
                        <input
                          value={values.title}
                          onChange={(event) =>
                            updateValue("title", event.target.value)
                          }
                          className={INPUT_CLASS_NAME}
                          placeholder="e.g. GRA Family Duplex"
                          aria-invalid={Boolean(errors.title)}
                        />
                        {errors.title ? (
                          <span className="mt-2 block font-body text-sm font-medium text-red-700">
                            {errors.title}
                          </span>
                        ) : null}
                      </label>

                      <label className="sm:col-span-2">
                        <span className="font-body text-sm font-bold text-primary">
                          Description{" "}
                          <span className="font-normal text-muted">
                            (required)
                          </span>
                        </span>
                        <textarea
                          value={values.description}
                          onChange={(event) =>
                            updateValue("description", event.target.value)
                          }
                          className={`${INPUT_CLASS_NAME} min-h-36 resize-y`}
                          placeholder="Describe what makes this property stand out."
                          aria-invalid={Boolean(errors.description)}
                        />
                        {errors.description ? (
                          <span className="mt-2 block font-body text-sm font-medium text-red-700">
                            {errors.description}
                          </span>
                        ) : null}
                      </label>
                    </div>
                  </section>
                ) : null}

                {listingStep === "location" ? (
                  <section aria-labelledby="guided-listing-property">
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Property location
                    </p>
                    <h2
                      id="guided-listing-property"
                      className="mt-2 font-display text-2xl font-bold text-primary"
                    >
                      Where is the property?
                    </h2>
                    <p className="mt-2 font-body text-sm leading-6 text-muted">
                      Add the location renters will use to understand the area.
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <label>
                        <span className="font-body text-sm font-bold text-primary">
                          City{" "}
                          <span className="font-normal text-muted">
                            (required)
                          </span>
                        </span>
                        <Select
                          value={values.city}
                          onValueChange={(city) => updateValue("city", city)}
                          className={INPUT_CLASS_NAME}
                          invalid={Boolean(errors.city)}
                          ariaLabel="City"
                          placeholder="Select a city"
                          options={toSelectOptions(CITIES)}
                        />
                        {errors.city ? (
                          <span className="mt-2 block font-body text-sm font-medium text-red-700">
                            {errors.city}
                          </span>
                        ) : null}
                      </label>

                      <label>
                        <span className="font-body text-sm font-bold text-primary">
                          Area or neighborhood{" "}
                          <span className="font-normal text-muted">
                            (required)
                          </span>
                        </span>
                        <input
                          value={values.area}
                          onChange={(event) =>
                            updateValue("area", event.target.value)
                          }
                          className={INPUT_CLASS_NAME}
                          placeholder="e.g. Lekki Phase 1"
                          aria-invalid={Boolean(errors.area)}
                        />
                        {errors.area ? (
                          <span className="mt-2 block font-body text-sm font-medium text-red-700">
                            {errors.area}
                          </span>
                        ) : null}
                      </label>

                      <label className="sm:col-span-2">
                        <span className="font-body text-sm font-bold text-primary">
                          Full address{" "}
                          <span className="font-normal text-muted">
                            (required)
                          </span>
                        </span>
                        <input
                          value={values.address}
                          onChange={(event) =>
                            updateValue("address", event.target.value)
                          }
                          className={INPUT_CLASS_NAME}
                          placeholder="Street and property number"
                          aria-invalid={Boolean(errors.address)}
                        />
                        {errors.address ? (
                          <span className="mt-2 block font-body text-sm font-medium text-red-700">
                            {errors.address}
                          </span>
                        ) : null}
                        <span className="mt-2 block font-body text-xs leading-5 text-muted">
                          Only shown to verified interested parties.
                        </span>
                      </label>
                    </div>
                  </section>
                ) : null}

                {listingStep === "details" ? (
                  <section aria-labelledby="guided-listing-amenities">
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Property details
                    </p>
                    <h2
                      id="guided-listing-amenities"
                      className="mt-2 font-display text-2xl font-bold text-primary"
                    >
                      Help renters compare the home
                    </h2>
                    <p className="mt-2 font-body text-sm leading-6 text-muted">
                      Add the room count, size, and features included.
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <NumberStepper
                        label="Bedrooms"
                        value={values.bedrooms}
                        onChange={(value) => updateValue("bedrooms", value)}
                        error={errors.bedrooms}
                      />
                      <NumberStepper
                        label="Bathrooms"
                        value={values.bathrooms}
                        onChange={(value) => updateValue("bathrooms", value)}
                        error={errors.bathrooms}
                      />
                      <label className="sm:col-span-2">
                        <span className="font-body text-sm font-bold text-primary">
                          Square footage{" "}
                          <span className="font-normal text-muted">
                            (optional)
                          </span>
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={values.squareFootage}
                          onChange={(event) =>
                            updateValue("squareFootage", event.target.value)
                          }
                          className={INPUT_CLASS_NAME}
                          placeholder="e.g. 1,800"
                        />
                      </label>
                    </div>

                    <p className="mt-8 font-body text-sm font-bold text-primary">
                      Amenities{" "}
                      <span className="font-normal text-muted">(optional)</span>
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {AMENITIES.map((amenity) => {
                        const selected = values.amenities.includes(amenity);

                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={cn(
                              "flex min-h-12 items-center justify-between rounded-xl border bg-transparent px-4 py-3 text-left font-body text-sm font-medium text-primary transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                              selected
                                ? "border-accent shadow-sm"
                                : "border-primary/15 hover:border-accent/70",
                            )}
                            aria-pressed={selected}
                          >
                            {amenity}
                            {selected ? (
                              <Check
                                className="h-4 w-4 text-accent"
                                aria-hidden="true"
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {listingStep === "pricing" ? (
                  <section aria-labelledby="guided-listing-pricing">
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Rental terms
                    </p>
                    <h2
                      id="guided-listing-pricing"
                      className="mt-2 font-display text-2xl font-bold text-primary"
                    >
                      Set the price
                    </h2>
                    <p className="mt-2 font-body text-sm leading-6 text-muted">
                      Choose how the home is let and enter the amount renters
                      will see.
                    </p>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      {renderRentalModeFields()}
                      <label className="sm:col-span-2">
                        <span className="flex items-center justify-between gap-4">
                          <span className="font-body text-sm font-bold text-primary">
                            {priceLabel}
                          </span>
                          <span className="font-body text-xs text-muted">
                            Enter the exact amount
                          </span>
                        </span>
                        <span
                          className={cn(
                            "mt-2 flex min-h-20 items-center overflow-hidden rounded-xl border bg-surface-soft/40 transition-all focus-within:border-accent focus-within:bg-bg focus-within:ring-2 focus-within:ring-accent/30",
                            errors.price ? "border-red-500" : "border-border",
                          )}
                        >
                          <span className="pl-5 font-display text-3xl font-bold text-primary sm:pl-6">
                            ₦
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatCurrencyInput(values.price)}
                            onChange={(event) => {
                              const digits = event.target.value
                                .replace(/\D/g, "")
                                .replace(/^0+(?=\d)/, "");
                              updateValue("price", digits.slice(0, 15));
                            }}
                            className="min-h-20 min-w-0 flex-1 bg-transparent px-2 font-display text-3xl font-bold text-primary outline-none placeholder:text-muted/60 sm:px-3"
                            placeholder="1,500,000"
                            aria-invalid={Boolean(errors.price)}
                            aria-describedby={
                              errors.price
                                ? "guided-price-error guided-price-help"
                                : "guided-price-help"
                            }
                          />
                          <span className="mr-5 shrink-0 border-l border-border pl-4 font-body text-sm font-bold text-muted sm:mr-6">
                            / {PRICE_PERIOD_LABELS[values.rentalMode]}
                          </span>
                        </span>
                        {errors.price ? (
                          <span
                            id="guided-price-error"
                            className="mt-2 block font-body text-sm font-medium text-red-700"
                          >
                            {errors.price}
                          </span>
                        ) : null}
                        <span
                          id="guided-price-help"
                          className="mt-3 flex flex-wrap items-center justify-between gap-2 font-body text-xs text-muted"
                        >
                          <span>
                            This is the amount renters will see on your listing.
                          </span>
                          {values.price ? (
                            <span className="font-bold text-primary">
                              ₦{Number(values.price).toLocaleString("en-NG")}{" "}
                              per {PRICE_PERIOD_LABELS[values.rentalMode]}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </div>
                  </section>
                ) : null}

                {listingStep === "photos" ? (
                  <section aria-labelledby="guided-listing-photos">
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Property photography
                    </p>
                    <h2
                      id="guided-listing-photos"
                      className="mt-2 font-display text-2xl font-bold text-primary"
                    >
                      Show renters around
                    </h2>
                    <p className="mt-2 font-body text-sm leading-6 text-muted">
                      Add clear photos and choose the image renters see first.
                    </p>

                    <label
                      className="mt-6 flex min-h-32 cursor-pointer items-center justify-center gap-4 rounded-xl border border-dashed border-primary/25 bg-transparent px-5 py-6 text-left transition-all duration-200 hover:border-accent hover:shadow-sm focus-within:ring-2 focus-within:ring-accent"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleDrop}
                      onKeyDown={handleDropKeyDown}
                      tabIndex={0}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/15 text-primary">
                        <Upload size={20} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block font-body text-sm font-bold text-primary">
                          Drop photos here or click to upload
                        </span>
                        <span className="mt-1 block font-body text-xs text-muted">
                          JPG, PNG, or WEBP. Up to 20 photos, 10 MB each.
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleFileInput}
                      />
                    </label>

                    {errors.photos ? (
                      <p className="mt-3 font-body text-sm font-medium text-red-700">
                        {errors.photos}
                      </p>
                    ) : null}

                    {coverPhoto ? (
                      <div className="mt-6">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-body text-sm font-bold text-primary">
                            Cover photo
                          </p>
                          <p className="font-body text-xs text-muted">
                            {photos.length} photo
                            {photos.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-border bg-surface-soft">
                          <Image
                            src={coverPhoto.dataUrl}
                            alt={coverPhoto.name}
                            fill
                            unoptimized
                            sizes="(min-width: 1024px) 60vw, 100vw"
                            className="object-cover"
                          />
                          {coverPhoto.uploading ? (
                            <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                              <Loader2
                                className="h-6 w-6 animate-spin"
                                aria-hidden="true"
                              />
                              <span className="mt-2 font-body text-xs font-bold">
                                Preparing
                              </span>
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {photos.map((photo, index) => (
                            <div
                              key={photo.id}
                              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface-soft"
                            >
                              <Image
                                src={photo.dataUrl}
                                alt={photo.name}
                                fill
                                unoptimized
                                sizes="(min-width: 1024px) 16vw, 50vw"
                                className="object-cover"
                              />
                              {index === 0 ? (
                                <span className="absolute left-2 top-2 rounded-full border border-accent bg-bg px-2.5 py-1 font-body text-[11px] font-bold text-primary">
                                  Cover
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => removePhoto(photo.id)}
                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                aria-label={`Remove ${photo.name}`}
                              >
                                <X size={15} aria-hidden="true" />
                              </button>
                              {photo.uploading ? (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                                  <Loader2
                                    className="h-5 w-5 animate-spin"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : index > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => makeCover(photo.id)}
                                  className="absolute bottom-2 left-2 rounded-full border border-primary/15 bg-bg px-3 py-1.5 font-body text-xs font-bold text-primary shadow-sm transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                >
                                  Make Cover
                                </button>
                              ) : null}
                              {!photo.uploading ? (
                                <span className="absolute bottom-2 right-2 flex overflow-hidden rounded-full border border-white/40 bg-bg shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => movePhoto(photo.id, -1)}
                                    disabled={index === 0}
                                    className="flex h-8 w-8 items-center justify-center text-primary hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label={`Move ${photo.name} earlier`}
                                  >
                                    <ChevronLeft size={15} aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => movePhoto(photo.id, 1)}
                                    disabled={index === photos.length - 1}
                                    className="flex h-8 w-8 items-center justify-center border-l border-border text-primary hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label={`Move ${photo.name} later`}
                                  >
                                    <ChevronRight
                                      size={15}
                                      aria-hidden="true"
                                    />
                                  </button>
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-muted">
                        <ImagePlus size={19} aria-hidden="true" />
                        <span className="font-body text-sm">
                          No photos selected yet.
                        </span>
                      </div>
                    )}
                  </section>
                ) : null}

                {listingStep === "verify" ? (
                  <section aria-labelledby="guided-listing-verify">
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Proof of property
                    </p>
                    <h2
                      id="guided-listing-verify"
                      className="mt-2 font-display text-2xl font-bold text-primary"
                    >
                      Take one photo at the property
                    </h2>
                    <p className="mt-2 font-body text-sm leading-6 text-muted">
                      Stand at the property and take this photo now. Rello
                      checks where it was taken, and the listing goes live once
                      it matches the address.
                    </p>

                    <label className="mt-6 flex min-h-32 cursor-pointer items-center justify-center gap-4 rounded-xl border border-dashed border-primary/25 bg-transparent px-5 py-6 text-left transition-all duration-200 hover:border-accent hover:shadow-sm focus-within:ring-2 focus-within:ring-accent">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/15 text-primary">
                        {isCapturing ? (
                          <Loader2
                            className="h-5 w-5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Camera size={20} aria-hidden="true" />
                        )}
                      </span>
                      <span>
                        <span className="block font-body text-sm font-bold text-primary">
                          {proofCapture
                            ? "Take the photo again"
                            : "Open camera and take the photo"}
                        </span>
                        <span className="mt-1 block font-body text-xs text-muted">
                          {isCapturing
                            ? "Reading your location..."
                            : "Your camera opens directly, so the photo cannot be picked from your gallery"}
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={(event) => void handleProofCapture(event)}
                      />
                    </label>

                    {proofCapture ? (
                      <div className="mt-6">
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface-soft">
                          <Image
                            src={proofCapture.dataUrl}
                            alt="Photo taken at the property"
                            fill
                            sizes="(min-width: 1024px) 640px, 100vw"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="mt-3 flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                          <MapPin
                            size={18}
                            aria-hidden="true"
                            className={
                              proofCapture.fix
                                ? "text-accent-alt"
                                : "text-muted"
                            }
                          />
                          <span className="font-body text-sm text-primary">
                            {proofCapture.fix
                              ? `Location captured, accurate to about ${Math.round(proofCapture.fix.accuracy)} metres.`
                              : "No location captured. Turn on location access and take the photo again."}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-muted">
                        <MapPin size={19} aria-hidden="true" />
                        <span className="font-body text-sm">
                          You can skip this and verify later from your listings.
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (proofCapture) setIsDirty(true);
                        setProofCapture(null);
                        handleContinue();
                      }}
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary transition-colors hover:border-accent"
                    >
                      Verify later
                    </button>
                  </section>
                ) : null}

                {listingStep === "review" ? (
                  <section aria-labelledby="guided-listing-review">
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Final review
                    </p>
                    <h2
                      id="guided-listing-review"
                      className="mt-2 font-display text-2xl font-bold text-primary"
                    >
                      Preview your listing
                    </h2>
                    <p className="mt-2 font-body text-sm leading-6 text-muted">
                      This is how the key information will appear to renters.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          label: "Listing basics",
                          step: "basics" as const,
                          value: values.title,
                        },
                        {
                          label: "Location",
                          step: "location" as const,
                          value: [values.area, values.city]
                            .filter(Boolean)
                            .join(", "),
                        },
                        {
                          label: "Property details",
                          step: "details" as const,
                          value: `${values.bedrooms} bedrooms, ${values.bathrooms} bathrooms`,
                        },
                        {
                          label: "Pricing",
                          step: "pricing" as const,
                          value: formatPreviewPrice(
                            values.price,
                            values.rentalMode,
                          ),
                        },
                        {
                          label: "Photos",
                          step: "photos" as const,
                          value: `${photos.length} added`,
                        },
                        {
                          label: "Verification",
                          step: "verify" as const,
                          value: proofCapture
                            ? "Ready to submit"
                            : "Complete later",
                        },
                      ].map((item) => (
                        <div
                          key={item.step}
                          className="flex items-center gap-3 rounded-xl border border-border p-4"
                        >
                          <CircleCheck
                            className="shrink-0 text-accent-alt"
                            size={18}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-body text-xs font-bold text-primary">
                              {item.label}
                            </p>
                            <p className="mt-1 truncate font-body text-xs text-muted">
                              {item.value || "Not added"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => moveToListingStep(item.step)}
                            className="font-body text-xs font-bold text-primary underline decoration-accent underline-offset-4"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>

                    <article className="mt-6 overflow-hidden rounded-xl border border-border bg-bg shadow-sm">
                      <div className="relative aspect-video bg-surface-soft">
                        {coverPhoto ? (
                          <Image
                            src={coverPhoto.dataUrl}
                            alt={values.title || "Property cover"}
                            fill
                            unoptimized
                            sizes="(min-width: 1024px) 60vw, 100vw"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-muted">
                            <Home size={32} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="font-display text-2xl font-bold text-primary">
                              {values.title || "Untitled property"}
                            </h3>
                            <p className="mt-2 font-body text-sm text-muted">
                              {[values.area, values.city]
                                .filter(Boolean)
                                .join(", ") || "Location not set"}
                            </p>
                          </div>
                          <p className="shrink-0 font-display text-xl font-bold text-primary">
                            {formatPreviewPrice(
                              values.price,
                              values.rentalMode,
                            )}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-4 border-y border-border py-4 font-body text-sm text-primary">
                          <span>{values.bedrooms} bedrooms</span>
                          <span>{values.bathrooms} bathrooms</span>
                          {values.squareFootage ? (
                            <span>{values.squareFootage} sq ft</span>
                          ) : null}
                        </div>

                        <p className="mt-5 font-body text-sm leading-6 text-muted">
                          {values.description}
                        </p>

                        {values.amenities.length > 0 ? (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {values.amenities.map((amenity) => (
                              <span
                                key={amenity}
                                className="rounded-full border border-primary/15 px-3 py-1.5 font-body text-xs font-medium text-primary"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>

                    <div className="mt-5 flex items-start gap-3 rounded-lg border border-accent/40 px-4 py-3">
                      <Home
                        className="mt-0.5 shrink-0 text-accent"
                        size={18}
                        aria-hidden="true"
                      />
                      <p className="font-body text-sm leading-6 text-primary">
                        Submitted listings remain private and show as Pending
                        Verification until the property verification process is
                        complete.
                      </p>
                    </div>
                  </section>
                ) : null}
              </div>

              <footer className="sticky bottom-0 z-20 mt-6 rounded-t-2xl border border-border bg-bg/95 p-4 shadow-[0_-12px_32px_rgba(3,58,78,0.08)] backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={listingStepIndex === 0}
                    className="hidden min-h-12 items-center justify-center gap-2 rounded-full px-4 font-body text-sm font-bold text-primary transition-colors hover:bg-surface-soft disabled:invisible sm:inline-flex"
                  >
                    <ArrowLeft size={17} aria-hidden="true" />
                    Back
                  </button>

                  <p className="mr-auto hidden text-center font-body text-xs text-muted lg:block">
                    {isSavingDraft
                      ? "Saving draft..."
                      : isDirty
                        ? "Unsaved changes"
                        : draftId
                          ? "Draft saved"
                          : "Not saved yet"}
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleSaveDraft()}
                    disabled={isSavingDraft || isSubmitting}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-primary/20 bg-transparent px-4 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-6"
                  >
                    {isSavingDraft ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        Saving...
                      </span>
                    ) : draftId ? (
                      "Update Draft"
                    ) : (
                      "Save as Draft"
                    )}
                  </button>

                  {listingStep === "review" ? (
                    <button
                      type="submit"
                      aria-disabled={!canSubmit || isSubmitting}
                      disabled={isSubmitting}
                      className={cn(
                        "inline-flex min-h-12 flex-1 items-center justify-center rounded-full px-5 py-3 font-body text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-7",
                        canSubmit
                          ? "bg-accent text-primary hover:bg-primary hover:text-white"
                          : "bg-border text-muted",
                      )}
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Creating listing...
                        </span>
                      ) : (
                        "Submit Listing"
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none sm:px-7"
                    >
                      Continue
                      <ArrowRight size={17} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </footer>
            </form>

            <aside className="sticky top-24 hidden rounded-2xl border border-border bg-bg p-5 xl:block">
              <p className="font-body text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Listing summary
              </p>
              <h2 className="mt-3 line-clamp-2 font-display text-lg font-bold text-primary">
                {values.title || "Untitled rental"}
              </h2>
              <p className="mt-2 font-body text-sm text-muted">
                {[values.area, values.city].filter(Boolean).join(", ") ||
                  "Location not added"}
              </p>
              <p className="mt-4 font-display text-lg font-bold text-primary">
                {formatPreviewPrice(values.price, values.rentalMode)}
              </p>
              <div className="mt-5 border-t border-border pt-5">
                <p className="font-body text-xs text-muted">
                  {photos.length} photo{photos.length === 1 ? "" : "s"} added
                </p>
                <p className="mt-2 font-body text-xs text-muted">
                  {values.amenities.length} amenit
                  {values.amenities.length === 1 ? "y" : "ies"} selected
                </p>
                <p className="mt-2 flex items-center gap-2 font-body text-xs text-muted">
                  <CircleCheck
                    size={14}
                    className="text-accent-alt"
                    aria-hidden="true"
                  />
                  {proofCapture
                    ? "Verification photo ready"
                    : "Verification can be completed later"}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-5 pb-0 pt-12 sm:px-8 lg:px-10 lg:pt-16 xl:px-14">
      <div className="mx-auto max-w-5xl">
        <header className="pb-10">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {draftId ? "Editing Draft" : "New Listing"}
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-primary">
            {draftId ? "Continue your listing" : "Create your listing"}
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
            Add the property information and photos required for verification.
          </p>
        </header>

        {storageUnavailable ? (
          <p className="mb-6 rounded-lg border border-red-500/40 bg-bg px-4 py-3 font-body text-sm font-bold text-red-700">
            Local listing storage is unavailable in this browser session.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm">
            <section className="p-5 sm:p-6" aria-labelledby="listing-basics">
              <FormSectionHeading
                id="listing-basics"
                index="01"
                title="Basics"
                description="Start with the information people use to understand the property."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="font-body text-sm font-bold text-primary">
                    Property Type
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-soft px-4 py-3">
                    <span className="inline-flex rounded-full bg-primary px-3 py-1.5 font-body text-xs font-bold text-white">
                      {typeLabel}
                    </span>
                    <span className="font-body text-sm text-muted">
                      {typeHelper}
                    </span>
                  </div>
                </div>

                {renderListingPartiesAndUnits()}

                <label className="sm:col-span-2">
                  <span className="font-body text-sm font-bold text-primary">
                    Title
                  </span>
                  <input
                    value={values.title}
                    onChange={(event) =>
                      updateValue("title", event.target.value)
                    }
                    className={INPUT_CLASS_NAME}
                    placeholder="e.g. GRA Family Duplex"
                    aria-invalid={Boolean(errors.title)}
                  />
                  {errors.title ? (
                    <span className="mt-2 block font-body text-sm font-medium text-red-700">
                      {errors.title}
                    </span>
                  ) : null}
                </label>

                <label className="sm:col-span-2">
                  <span className="font-body text-sm font-bold text-primary">
                    Description
                  </span>
                  <textarea
                    value={values.description}
                    onChange={(event) =>
                      updateValue("description", event.target.value)
                    }
                    className={`${INPUT_CLASS_NAME} min-h-32 resize-y`}
                    placeholder="Describe what makes this property stand out."
                    aria-invalid={Boolean(errors.description)}
                  />
                  {errors.description ? (
                    <span className="mt-2 block font-body text-sm font-medium text-red-700">
                      {errors.description}
                    </span>
                  ) : null}
                </label>

                {renderRentalModeFields()}

                <label className="sm:col-span-2">
                  <span className="font-body text-sm font-bold text-primary">
                    {priceLabel}
                  </span>
                  <span className="mt-2 flex min-h-12 items-center rounded-lg border border-border bg-bg focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
                    <span className="border-r border-border px-4 font-body text-base font-bold text-primary">
                      ₦
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={values.price}
                      onChange={(event) =>
                        updateValue("price", event.target.value)
                      }
                      className="min-h-12 min-w-0 flex-1 bg-bg px-4 font-body text-base text-primary outline-none placeholder:text-muted"
                      placeholder="0"
                      aria-invalid={Boolean(errors.price)}
                    />
                  </span>
                  {errors.price ? (
                    <span className="mt-2 block font-body text-sm font-medium text-red-700">
                      {errors.price}
                    </span>
                  ) : null}
                </label>
              </div>
            </section>

            <section
              className="border-t border-border p-5 sm:p-6"
              aria-labelledby="listing-location"
            >
              <FormSectionHeading
                id="listing-location"
                index="02"
                title="Location"
                description="Give interested parties enough context while keeping the exact address private."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="font-body text-sm font-bold text-primary">
                    City
                  </span>
                  <Select
                    value={values.city}
                    onValueChange={(city) => updateValue("city", city)}
                    className={INPUT_CLASS_NAME}
                    invalid={Boolean(errors.city)}
                    ariaLabel="City"
                    placeholder="Select a city"
                    options={toSelectOptions(CITIES)}
                  />
                  {errors.city ? (
                    <span className="mt-2 block font-body text-sm font-medium text-red-700">
                      {errors.city}
                    </span>
                  ) : null}
                </label>

                <label>
                  <span className="font-body text-sm font-bold text-primary">
                    Area/Neighborhood
                  </span>
                  <input
                    value={values.area}
                    onChange={(event) =>
                      updateValue("area", event.target.value)
                    }
                    className={INPUT_CLASS_NAME}
                    placeholder="e.g. Lekki Phase 1"
                    aria-invalid={Boolean(errors.area)}
                  />
                  {errors.area ? (
                    <span className="mt-2 block font-body text-sm font-medium text-red-700">
                      {errors.area}
                    </span>
                  ) : null}
                </label>

                <label className="sm:col-span-2">
                  <span className="font-body text-sm font-bold text-primary">
                    Full Address
                  </span>
                  <input
                    value={values.address}
                    onChange={(event) =>
                      updateValue("address", event.target.value)
                    }
                    className={INPUT_CLASS_NAME}
                    placeholder="Street and property number"
                    aria-invalid={Boolean(errors.address)}
                  />
                  {errors.address ? (
                    <span className="mt-2 block font-body text-sm font-medium text-red-700">
                      {errors.address}
                    </span>
                  ) : null}
                  <span className="mt-2 block font-body text-xs leading-5 text-muted">
                    Only shown to verified interested parties, not displayed
                    publicly.
                  </span>
                </label>
              </div>
            </section>

            <section
              className="border-t border-border p-5 sm:p-6"
              aria-labelledby="listing-details"
            >
              <FormSectionHeading
                id="listing-details"
                index="03"
                title="Details"
                description="Add the core dimensions people need when comparing properties."
              />
              <div className="grid gap-5 sm:grid-cols-3">
                <NumberStepper
                  label="Bedrooms"
                  value={values.bedrooms}
                  onChange={(value) => updateValue("bedrooms", value)}
                  error={errors.bedrooms}
                />
                <NumberStepper
                  label="Bathrooms"
                  value={values.bathrooms}
                  onChange={(value) => updateValue("bathrooms", value)}
                  error={errors.bathrooms}
                />
                <label>
                  <span className="font-body text-sm font-bold text-primary">
                    Square Footage
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={values.squareFootage}
                    onChange={(event) =>
                      updateValue("squareFootage", event.target.value)
                    }
                    className={INPUT_CLASS_NAME}
                    placeholder="Optional"
                  />
                </label>
              </div>
            </section>

            <section
              className="border-t border-border p-5 sm:p-6"
              aria-labelledby="listing-amenities"
            >
              <FormSectionHeading
                id="listing-amenities"
                index="04"
                title="Amenities"
                description="Select the practical features included with this property."
              />
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((amenity) => {
                  const selected = values.amenities.includes(amenity);

                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 font-body text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        selected
                          ? "bg-accent text-primary"
                          : "border border-primary/20 bg-bg text-primary hover:bg-surface-soft"
                      }`}
                      aria-pressed={selected}
                    >
                      {selected ? <Check size={15} aria-hidden="true" /> : null}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              className="border-t border-border p-5 sm:p-6"
              aria-labelledby="listing-photos"
            >
              <FormSectionHeading
                id="listing-photos"
                index="05"
                title="Photos"
                description="Upload clear images and choose the photo people see first."
              />
              <label
                className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-bg px-5 py-8 text-center transition-all duration-200 ease-in-out hover:border-accent hover:bg-surface-soft focus-within:ring-2 focus-within:ring-accent"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                onKeyDown={handleDropKeyDown}
                tabIndex={0}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-primary">
                  <Upload size={22} aria-hidden="true" />
                </span>
                <span className="mt-4 font-body text-sm font-bold text-primary">
                  Drop photos here or click to upload
                </span>
                <span className="mt-2 font-body text-xs text-muted">
                  Select multiple JPG, PNG, or WEBP images
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFileInput}
                />
              </label>

              <p className="mt-3 font-body text-xs text-muted">
                Add at least one photo to continue.
              </p>
              {errors.photos ? (
                <p className="mt-2 font-body text-sm font-medium text-red-700">
                  {errors.photos}
                </p>
              ) : null}

              {photos.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface-soft"
                    >
                      <Image
                        src={photo.dataUrl}
                        alt={photo.name}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 20vw, 50vw"
                        className="object-cover"
                      />
                      {index === 0 ? (
                        <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 font-body text-[11px] font-bold text-white">
                          Cover Photo
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label={`Remove ${photo.name}`}
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                      {photo.uploading ? (
                        <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                          <Loader2
                            className="h-6 w-6 animate-spin"
                            aria-hidden="true"
                          />
                          <span className="mt-2 font-body text-xs font-bold">
                            Uploading
                          </span>
                        </span>
                      ) : index > 0 ? (
                        <button
                          type="button"
                          onClick={() => makeCover(photo.id)}
                          className="absolute bottom-2 left-2 rounded-full bg-bg px-3 py-1.5 font-body text-xs font-bold text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Make Cover
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-surface-soft px-4 py-3 text-muted">
                  <ImagePlus size={19} aria-hidden="true" />
                  <span className="font-body text-sm">
                    No photos selected yet.
                  </span>
                </div>
              )}
            </section>

            <section
              className="border-t border-border p-5 sm:p-6"
              aria-labelledby="listing-review"
            >
              <FormSectionHeading
                id="listing-review"
                index="06"
                title="Review & Submit"
                description="Save your work or submit the listing for property verification."
              />
              <div className="flex items-start gap-3 rounded-lg border border-accent bg-surface-soft px-4 py-3">
                <Home
                  className="mt-0.5 shrink-0 text-primary"
                  size={18}
                  aria-hidden="true"
                />
                <p className="font-body text-sm leading-6 text-primary">
                  Submitted listings remain private and show as Pending
                  Verification until the property verification process is
                  complete.
                </p>
              </div>
            </section>
          </div>

          <footer className="sticky bottom-0 z-20 mt-6 border-t border-border bg-bg py-4 shadow-xl">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => void handleSaveDraft()}
                disabled={isSavingDraft || isSubmitting}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary/30 bg-bg px-6 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingDraft ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Saving...
                  </span>
                ) : draftId ? (
                  "Update Draft"
                ) : (
                  "Save as Draft"
                )}
              </button>
              <button
                type="submit"
                aria-disabled={!canSubmit || isSubmitting}
                disabled={isSubmitting}
                className={`inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 font-body text-sm font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                  canSubmit
                    ? "bg-accent text-primary hover:bg-primary hover:text-white"
                    : "bg-border text-muted"
                }`}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Creating listing...
                  </span>
                ) : (
                  "Submit Listing"
                )}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
