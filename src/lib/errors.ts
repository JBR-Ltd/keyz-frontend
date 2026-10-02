// src/lib/errors.ts

// === Types

/**
 * Mirrors ErrorCode on the backend. Codes are the contract; the wording
 * below is ours. Never rename a member without changing the enum in the
 * backend to match.
 */
export type ApiErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "EMAIL_ALREADY_REGISTERED"
  | "RESET_CODE_INVALID"
  | "VERIFICATION_CODE_INVALID"
  | "OLD_PASSWORD_INCORRECT"
  | "SESSION_EXPIRED"
  | "IDENTITY_NOT_VERIFIED"
  | "IDENTITY_NAME_MISMATCH"
  | "NIN_CHECK_FAILED"
  | "BVN_CHECK_FAILED"
  | "SELFIE_CHECK_FAILED"
  | "PAYOUT_NAME_MISMATCH"
  | "PAYOUT_CODES_INVALID"
  | "LISTING_ROLE_MISMATCH"
  | "LISTING_NOT_OWNED"
  | "LISTING_COORDINATES_MISSING"
  | "LISTING_PROOF_NO_GPS"
  | "LISTING_PROOF_TOO_FAR"
  | "LISTING_PHOTO_DUPLICATE"
  | "LISTING_BILL_MISMATCH"
  | "BOOKING_DATES_INVALID"
  | "REVIEW_REQUIRES_COMPLETED_STAY"
  // Virtual tour
  | "TOUR_PANORAMA_REJECTED"
  | "TOUR_PANORAMA_TOO_LARGE"
  | "TOUR_VALIDATOR_UNAVAILABLE"
  | "TOUR_DOOR_FIXED"
  | "TOUR_DOOR_CROSS_FLOOR"
  | "TOUR_DOOR_DUPLICATE"
  | "TOUR_PLAN_INVALID"
  | "TOUR_NOT_PUBLISHABLE"
  // Generic
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiErrorPayload {
  code?: ApiErrorCode;
  message?: string;
  data?: unknown;
  success?: boolean;
}

// === Copy

const GENERIC_MESSAGE = "Something went wrong. Try again in a moment.";

const ERROR_COPY: Record<ApiErrorCode, string> = {
  INVALID_CREDENTIALS: "Incorrect login credentials. Check your email and password and try again.",
  EMAIL_NOT_VERIFIED: "Verify your email address before logging in. Check your inbox for the code.",
  EMAIL_ALREADY_REGISTERED: "An account already uses that email. Log in instead.",
  RESET_CODE_INVALID: "That reset code is wrong or has expired. Request a new one.",
  VERIFICATION_CODE_INVALID: "That code is wrong or has expired. Request a new one.",
  OLD_PASSWORD_INCORRECT: "Your current password is wrong. Try again.",
  SESSION_EXPIRED: "Your session ended. Log in again to continue.",

  IDENTITY_NOT_VERIFIED: "Finish your identity check before you can do this.",
  IDENTITY_NAME_MISMATCH: "The name on that ID does not match your account name.",
  NIN_CHECK_FAILED: "We could not verify that NIN. Check the number and try again.",
  BVN_CHECK_FAILED: "We could not verify that BVN. Check the number and try again.",
  SELFIE_CHECK_FAILED: "That selfie did not pass the liveness check. Try again in good lighting.",
  PAYOUT_NAME_MISMATCH: "The name on that bank account does not match your verified name.",
  PAYOUT_CODES_INVALID: "Those amounts do not match the deposits we sent. Check your statement.",

  LISTING_ROLE_MISMATCH: "Your account cannot create this kind of listing.",
  LISTING_NOT_OWNED: "This listing belongs to someone else.",
  LISTING_COORDINATES_MISSING: "Set the property location on the listing before verifying it.",
  LISTING_PROOF_NO_GPS: "That photo has no location attached. Take it in the app with location turned on.",
  LISTING_PROOF_TOO_FAR: "Take the photo while standing at the property.",
  LISTING_PHOTO_DUPLICATE: "This photo already appears on another listing. Upload photos you took yourself.",
  LISTING_BILL_MISMATCH: "The name and address on that bill do not match this listing.",

  BOOKING_DATES_INVALID: "Choose an end date that comes after the start date.",
  REVIEW_REQUIRES_COMPLETED_STAY: "You can review a property once your stay is complete.",

  TOUR_PANORAMA_REJECTED: "That photo was not accepted. Read the reason above and try again.",
  TOUR_PANORAMA_TOO_LARGE: "That image is too large. Photos up to 25 MB are accepted.",
  TOUR_VALIDATOR_UNAVAILABLE: "The image check is offline right now. Try again in a moment.",
  TOUR_DOOR_FIXED: "The entry door cannot be moved, relinked or removed.",
  TOUR_DOOR_CROSS_FLOOR: "Doors can only link two rooms on the same floor.",
  TOUR_DOOR_DUPLICATE: "This room already has a door to that room.",
  TOUR_PLAN_INVALID: "That floor plan is not valid. Check for overlapping or unplaced rooms.",
  TOUR_NOT_PUBLISHABLE: "This tour is not ready to publish yet. Check the blockers above.",

  NOT_FOUND: "We could not find that.",
  FORBIDDEN: "You do not have access to this.",
  VALIDATION_FAILED: "Check the highlighted fields and try again.",
  RATE_LIMITED: "Too many attempts. Wait a minute and try again.",
  INTERNAL_ERROR: GENERIC_MESSAGE,
};

// === Helpers

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && value in ERROR_COPY;
}

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return value !== null && typeof value === "object";
}

/**
 * Turns whatever the API returned into a sentence worth showing someone.
 * Prefers the backend message when it carries a known code, because those
 * are already written for humans and may include a computed detail. Anything
 * without a recognised code is treated as untrusted internal text and never
 * shown.
 */
export function resolveApiError(
  payload: unknown,
  fallback: string = GENERIC_MESSAGE,
): string {
  if (!isApiErrorPayload(payload)) {
    return fallback;
  }

  const code = "code" in payload ? payload.code : undefined;

  if (!isApiErrorCode(code)) {
    // No code but a message: use it only if it looks user-facing.
    const message = "message" in payload ? payload.message : undefined;
    if (typeof message === "string" && message.trim() && message.length < 300) {
      return message;
    }
    return fallback;
  }

  const fieldReasons = collectFieldReasons(
    "data" in payload ? payload.data : undefined,
  );

  if (fieldReasons) {
    return fieldReasons;
  }

  const message = "message" in payload ? payload.message : undefined;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return ERROR_COPY[code];
}

/** Bean validation answers with a field-to-reason map. Anything else is not one. */
function collectFieldReasons(value: unknown): string | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const reasons = Object.values(value).filter(
    (reason): reason is string => typeof reason === "string" && !!reason.trim(),
  );

  return reasons.length > 0 ? reasons.join(" ") : null;
}

export function getErrorCopy(code: ApiErrorCode): string {
  return ERROR_COPY[code];
}
