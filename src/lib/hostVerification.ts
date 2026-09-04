export type HostVerificationRole = "landlord" | "agent";

export type HostIdentityStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected"
  | "failed";

export type HostPayoutStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "failed";

export interface HostIdentityVerification {
  status: HostIdentityStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
}

export interface HostPayoutVerification {
  status: HostPayoutStatus;
  setupAt: string | null;
  approvedAt: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  payoutId: number | null;
  depositsReady?: boolean;
}

export interface HostVerificationSnapshot {
  identity: HostIdentityVerification;
  payout: HostPayoutVerification;
}

export interface HostPayoutInput {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface HostIdentityStatusResponse {
  bvnVerified: boolean;
  emailVerified: boolean;
  identityVerified: boolean;
  ninVerified: boolean;
  outstanding: string[];
  required: string[];
  role: string;
  selfieVerified: boolean;
}

export interface HostVerificationApiResult<TValue> {
  data: TValue | null;
  message: string;
  success: boolean;
}

interface ApiEnvelope {
  data: unknown;
  message: string;
  success: boolean;
}

const DEFAULT_HOST_VERIFICATION_SNAPSHOT: HostVerificationSnapshot = {
  identity: {
    status: "not_started",
    submittedAt: null,
    approvedAt: null,
    rejectedReason: null,
  },
  payout: {
    status: "not_started",
    setupAt: null,
    approvedAt: null,
    bankName: null,
    accountNumber: null,
    accountName: null,
    payoutId: null,
  },
};

const HOST_VERIFICATION_EVENT = "rello-host-verification-change";

function getStorageKey(role: HostVerificationRole): string {
  return `rello_${role}_verification`;
}

function isHostIdentityStatus(value: unknown): value is HostIdentityStatus {
  return (
    value === "not_started" ||
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "failed"
  );
}

function isHostPayoutStatus(value: unknown): value is HostPayoutStatus {
  return (
    value === "not_started" ||
    value === "pending" ||
    value === "approved" ||
    value === "failed"
  );
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    typeof value.success === "boolean" &&
    "message" in value &&
    typeof value.message === "string" &&
    "data" in value
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isHostIdentityStatusResponse(
  value: unknown,
): value is HostIdentityStatusResponse {
  return (
    value !== null &&
    typeof value === "object" &&
    "role" in value &&
    typeof value.role === "string" &&
    "emailVerified" in value &&
    typeof value.emailVerified === "boolean" &&
    "identityVerified" in value &&
    typeof value.identityVerified === "boolean" &&
    "ninVerified" in value &&
    typeof value.ninVerified === "boolean" &&
    "bvnVerified" in value &&
    typeof value.bvnVerified === "boolean" &&
    "selfieVerified" in value &&
    typeof value.selfieVerified === "boolean" &&
    "required" in value &&
    isStringArray(value.required) &&
    "outstanding" in value &&
    isStringArray(value.outstanding)
  );
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

async function parseApiEnvelope(response: Response): Promise<ApiEnvelope> {
  const value: unknown = await response.json().catch(() => null);

  if (!isApiEnvelope(value)) {
    throw new Error("The verification server returned an invalid response.");
  }

  if (!response.ok || !value.success) {
    throw new Error(value.message || "Verification failed. Try again.");
  }

  return value;
}

async function authenticatedVerificationRequest(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Your session has expired. Log in again.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return parseApiEnvelope(await fetch(path, { ...init, headers }));
}

function emitHostVerificationChange(): void {
  window.dispatchEvent(new Event(HOST_VERIFICATION_EVENT));
}

function isHostVerificationSnapshot(
  value: unknown,
): value is HostVerificationSnapshot {
  if (value === null || typeof value !== "object") {
    return false;
  }

  if (!("identity" in value) || !("payout" in value)) {
    return false;
  }

  const { identity, payout } = value;

  if (identity === null || typeof identity !== "object") {
    return false;
  }

  if (payout === null || typeof payout !== "object") {
    return false;
  }

  return (
    "status" in identity &&
    isHostIdentityStatus(identity.status) &&
    "submittedAt" in identity &&
    isNullableString(identity.submittedAt) &&
    "approvedAt" in identity &&
    isNullableString(identity.approvedAt) &&
    "rejectedReason" in identity &&
    isNullableString(identity.rejectedReason) &&
    "status" in payout &&
    isHostPayoutStatus(payout.status) &&
    "setupAt" in payout &&
    isNullableString(payout.setupAt) &&
    "approvedAt" in payout &&
    isNullableString(payout.approvedAt) &&
    "bankName" in payout &&
    isNullableString(payout.bankName) &&
    "accountNumber" in payout &&
    isNullableString(payout.accountNumber) &&
    "accountName" in payout &&
    isNullableString(payout.accountName) &&
    "payoutId" in payout &&
    (typeof payout.payoutId === "number" || payout.payoutId === null)
  );
}

export function getHostVerificationSnapshot(
  role: HostVerificationRole,
): HostVerificationSnapshot {
  if (typeof window === "undefined") {
    return DEFAULT_HOST_VERIFICATION_SNAPSHOT;
  }

  const storedValue = localStorage.getItem(getStorageKey(role));

  if (!storedValue) {
    return DEFAULT_HOST_VERIFICATION_SNAPSHOT;
  }

  try {
    const parsed: unknown = JSON.parse(storedValue);

    if (isHostVerificationSnapshot(parsed)) {
      return parsed;
    }
  } catch {
    return DEFAULT_HOST_VERIFICATION_SNAPSHOT;
  }

  return DEFAULT_HOST_VERIFICATION_SNAPSHOT;
}

export function saveHostIdentityVerification(
  role: HostVerificationRole,
  identity: HostIdentityVerification,
): HostVerificationSnapshot {
  const current = getHostVerificationSnapshot(role);
  const nextSnapshot = {
    ...current,
    identity,
  };

  localStorage.setItem(getStorageKey(role), JSON.stringify(nextSnapshot));
  emitHostVerificationChange();

  return nextSnapshot;
}

export function saveHostPayoutVerification(
  role: HostVerificationRole,
  payout: HostPayoutVerification,
): HostVerificationSnapshot {
  const current = getHostVerificationSnapshot(role);
  const nextSnapshot = {
    ...current,
    payout,
  };

  localStorage.setItem(getStorageKey(role), JSON.stringify(nextSnapshot));
  emitHostVerificationChange();

  return nextSnapshot;
}

export function submitLandlordIdentityReview(
  role: HostVerificationRole,
): HostVerificationSnapshot {
  return saveHostIdentityVerification(role, {
    status: "pending",
    submittedAt: new Date().toISOString(),
    approvedAt: null,
    rejectedReason: null,
  });
}

export function approveAgentIdentity(
  role: HostVerificationRole,
): HostVerificationSnapshot {
  return saveHostIdentityVerification(role, {
    status: "approved",
    submittedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    rejectedReason: null,
  });
}

export function setupHostPayout(
  role: HostVerificationRole,
  input: HostPayoutInput,
): HostVerificationSnapshot {
  return saveHostPayoutVerification(role, {
    status: "pending",
    setupAt: new Date().toISOString(),
    approvedAt: null,
    bankName: input.bankName,
    accountNumber: input.accountNumber,
    accountName: input.accountName,
    payoutId: 1,
    depositsReady: false,
  });
}

export function approveHostPayout(
  role: HostVerificationRole,
): HostVerificationSnapshot {
  const current = getHostVerificationSnapshot(role);

  return saveHostPayoutVerification(role, {
    ...current.payout,
    status: "approved",
    approvedAt: new Date().toISOString(),
  });
}

export function maskAccountNumber(accountNumber: string | null): string {
  if (!accountNumber || accountNumber.length < 4) {
    return "Account ending unavailable";
  }

  return `•••• ${accountNumber.slice(-4)}`;
}


export async function getHostIdentityStatus(): Promise<
  HostVerificationApiResult<HostIdentityStatusResponse>
> {
  try {
    const envelope = await authenticatedVerificationRequest(
      "/api/verification/status",
    );

    if (!isHostIdentityStatusResponse(envelope.data)) {
      throw new Error("The verification server returned invalid status data.");
    }

    return {
      data: envelope.data,
      message: envelope.message,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Verification status could not be loaded.",
      success: false,
    };
  }
}

export async function verifyHostNin(nin: string): Promise<void> {
  const query = new URLSearchParams({ nin });

  await authenticatedVerificationRequest(
    `/api/verification/dojah/nin?${query.toString()}`,
    { method: "POST" },
  );
}

export async function verifyHostSelfie(selfiePreview: string): Promise<void> {
  const imageResponse = await fetch(selfiePreview);

  if (!imageResponse.ok) {
    throw new Error("The selected selfie could not be prepared for upload.");
  }

  const image = await imageResponse.blob();
  const extension = image.type === "image/png" ? "png" : "jpg";
  const formData = new FormData();
  formData.append("selfie", image, `landlord-selfie.${extension}`);

  await authenticatedVerificationRequest("/api/verification/dojah/selfie", {
    method: "POST",
    body: formData,
  });
}
