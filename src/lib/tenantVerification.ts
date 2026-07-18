"use client";

import { useSyncExternalStore } from "react";

export type VerificationStepStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "failed";

export interface TenantVerificationState {
  nin: VerificationStepStatus;
  bvn: VerificationStepStatus;
  selfie: VerificationStepStatus;
}

export interface TenantVerificationSnapshot {
  state: TenantVerificationState;
  verifiedAt: string | null;
}

export type TenantVerificationStep = keyof TenantVerificationState;

// Placeholder until tenant verification status is returned from profile or auth responses.
const TENANT_VERIFICATION_STORAGE_KEY = "rello_tenant_verification";
const TENANT_VERIFICATION_EVENT = "rello-tenant-verification-change";

const DEFAULT_TENANT_VERIFICATION_STATE: TenantVerificationState = {
  nin: "not_started",
  bvn: "not_started",
  selfie: "not_started",
};

const DEFAULT_TENANT_VERIFICATION_SNAPSHOT: TenantVerificationSnapshot = {
  state: DEFAULT_TENANT_VERIFICATION_STATE,
  verifiedAt: null,
};

let cachedStoredValue: string | null = null;
let cachedSnapshot = DEFAULT_TENANT_VERIFICATION_SNAPSHOT;

function isVerificationStepStatus(
  value: unknown,
): value is VerificationStepStatus {
  return (
    value === "not_started" ||
    value === "pending" ||
    value === "verified" ||
    value === "failed"
  );
}

function isTenantVerificationState(
  value: unknown,
): value is TenantVerificationState {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return (
    "nin" in value &&
    isVerificationStepStatus(value.nin) &&
    "bvn" in value &&
    isVerificationStepStatus(value.bvn) &&
    "selfie" in value &&
    isVerificationStepStatus(value.selfie)
  );
}

function isTenantVerificationSnapshot(
  value: unknown,
): value is TenantVerificationSnapshot {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return (
    "state" in value &&
    isTenantVerificationState(value.state) &&
    "verifiedAt" in value &&
    (typeof value.verifiedAt === "string" || value.verifiedAt === null)
  );
}

function emitTenantVerificationChange(): void {
  window.dispatchEvent(new Event(TENANT_VERIFICATION_EVENT));
}

function subscribeToTenantVerification(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(TENANT_VERIFICATION_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TENANT_VERIFICATION_EVENT, callback);
  };
}

export function isTenantVerified(state: TenantVerificationState): boolean {
  return (
    state.nin === "verified" &&
    state.bvn === "verified" &&
    state.selfie === "verified"
  );
}

export function countVerifiedTenantSteps(
  state: TenantVerificationState,
): number {
  return [state.nin, state.bvn, state.selfie].filter(
    (status) => status === "verified",
  ).length;
}

export function getFirstIncompleteTenantVerificationStep(
  state: TenantVerificationState,
): TenantVerificationStep {
  if (state.nin !== "verified") {
    return "nin";
  }

  if (state.bvn !== "verified") {
    return "bvn";
  }

  return "selfie";
}

export function getTenantVerificationSnapshot(): TenantVerificationSnapshot {
  if (typeof window === "undefined") {
    return DEFAULT_TENANT_VERIFICATION_SNAPSHOT;
  }

  const storedValue = localStorage.getItem(TENANT_VERIFICATION_STORAGE_KEY);

  if (storedValue === cachedStoredValue) {
    return cachedSnapshot;
  }

  cachedStoredValue = storedValue;

  if (!storedValue) {
    cachedSnapshot = DEFAULT_TENANT_VERIFICATION_SNAPSHOT;
    return cachedSnapshot;
  }

  try {
    const parsed: unknown = JSON.parse(storedValue);

    if (isTenantVerificationSnapshot(parsed)) {
      cachedSnapshot = parsed;
      return cachedSnapshot;
    }
  } catch {
    cachedSnapshot = DEFAULT_TENANT_VERIFICATION_SNAPSHOT;
    return cachedSnapshot;
  }

  cachedSnapshot = DEFAULT_TENANT_VERIFICATION_SNAPSHOT;
  return cachedSnapshot;
}

export function saveTenantVerificationState(
  state: TenantVerificationState,
): TenantVerificationSnapshot {
  const current = getTenantVerificationSnapshot();
  const snapshot = {
    state,
    verifiedAt:
      isTenantVerified(state) && !current.verifiedAt
        ? new Date().toISOString()
        : isTenantVerified(state)
          ? current.verifiedAt
          : null,
  };

  localStorage.setItem(
    TENANT_VERIFICATION_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
  emitTenantVerificationChange();

  return snapshot;
}

export function saveTenantVerificationStep(
  step: TenantVerificationStep,
  status: VerificationStepStatus,
): TenantVerificationSnapshot {
  const current = getTenantVerificationSnapshot();

  return saveTenantVerificationState({
    ...current.state,
    [step]: status,
  });
}

export function useTenantVerificationSnapshot(): TenantVerificationSnapshot {
  return useSyncExternalStore(
    subscribeToTenantVerification,
    getTenantVerificationSnapshot,
    () => DEFAULT_TENANT_VERIFICATION_SNAPSHOT,
  );
}
