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
