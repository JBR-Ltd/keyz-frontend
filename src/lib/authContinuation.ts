import type { ListingSearch } from "@/lib/hostListings";

// === Types

export type PropertyGuestAction = "message" | "rent" | "save" | "viewing";

export type PendingAuthAction =
  | {
      createdAt: number;
      kind: "open-saved-search";
    }
  | {
      createdAt: number;
      kind: "save-listing";
      propertyId: number;
      search?: ListingSearch;
    }
  | {
      createdAt: number;
      kind: "save-search";
      search: ListingSearch;
    }
  | {
      action: PropertyGuestAction;
      createdAt: number;
      kind: "property-action";
      propertyPath: string;
    };

// === Constants

const PENDING_ACTION_KEY = "rello_pending_auth_action";
const PENDING_ACTION_TTL_MS = 30 * 60 * 1000;

// === Guards

function isPropertyGuestAction(value: unknown): value is PropertyGuestAction {
  return (
    value === "message" ||
    value === "rent" ||
    value === "save" ||
    value === "viewing"
  );
}

function isPendingAuthAction(value: unknown): value is PendingAuthAction {
  if (
    value === null ||
    typeof value !== "object" ||
    !("kind" in value) ||
    !("createdAt" in value) ||
    typeof value.createdAt !== "number"
  ) {
    return false;
  }

  if (value.kind === "open-saved-search") {
    return true;
  }

  if (
    value.kind === "save-listing" &&
    "propertyId" in value &&
    typeof value.propertyId === "number"
  ) {
    return Number.isSafeInteger(value.propertyId) && value.propertyId > 0;
  }

  if (
    value.kind === "save-search" &&
    "search" in value &&
    value.search !== null &&
    typeof value.search === "object"
  ) {
    return true;
  }

  return (
    value.kind === "property-action" &&
    "action" in value &&
    isPropertyGuestAction(value.action) &&
    "propertyPath" in value &&
    typeof value.propertyPath === "string" &&
    safeReturnTo(value.propertyPath, "") === value.propertyPath
  );
}

// === Helpers

export function safeReturnTo(
  value: string | null | undefined,
  fallback = "/browse",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://rello.local");
    if (url.origin !== "https://rello.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function loginPath(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}

export function registerPath(returnTo: string): string {
  return `/register?role=TENANT&returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}

export function pendingSaveListing(
  propertyId: number,
  search?: ListingSearch,
): PendingAuthAction {
  return { createdAt: Date.now(), kind: "save-listing", propertyId, search };
}

export function pendingOpenSavedSearch(): PendingAuthAction {
  return { createdAt: Date.now(), kind: "open-saved-search" };
}

export function pendingSaveSearch(search: ListingSearch): PendingAuthAction {
  return { createdAt: Date.now(), kind: "save-search", search };
}

export function pendingPropertyAction(
  action: PropertyGuestAction,
  propertyPath: string,
): PendingAuthAction {
  return {
    action,
    createdAt: Date.now(),
    kind: "property-action",
    propertyPath: safeReturnTo(propertyPath),
  };
}

export function storePendingAuthAction(action: PendingAuthAction): void {
  sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
}

export function consumePendingAuthAction(): PendingAuthAction | null {
  const stored = sessionStorage.getItem(PENDING_ACTION_KEY);
  sessionStorage.removeItem(PENDING_ACTION_KEY);
  if (!stored) return null;

  try {
    const value: unknown = JSON.parse(stored);
    if (!isPendingAuthAction(value)) return null;
    if (Date.now() - value.createdAt > PENDING_ACTION_TTL_MS) return null;
    return value;
  } catch {
    return null;
  }
}
