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
  /** A tenant now proves the face behind the booking, as a host already does. */
  selfie: VerificationStepStatus;
}

export interface TenantVerificationSnapshot {
  state: TenantVerificationState;
  verifiedAt: string | null;
}

const DEFAULT_TENANT_VERIFICATION_STATE: TenantVerificationState = {
  nin: "not_started",
  bvn: "not_started",
  selfie: "not_started",
};

const DEFAULT_TENANT_VERIFICATION_SNAPSHOT: TenantVerificationSnapshot = {
  state: DEFAULT_TENANT_VERIFICATION_STATE,
  verifiedAt: null,
};

let cachedSnapshot = DEFAULT_TENANT_VERIFICATION_SNAPSHOT;
const listeners = new Set<() => void>();

function emitTenantVerificationChange(): void {
  listeners.forEach((listener) => listener());
}

function subscribeToTenantVerification(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
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

export function getTenantVerificationSnapshot(): TenantVerificationSnapshot {
  return cachedSnapshot;
}

export function saveTenantVerificationState(
  state: TenantVerificationState,
): TenantVerificationSnapshot {
  const current = getTenantVerificationSnapshot();
  cachedSnapshot = {
    state,
    verifiedAt:
      isTenantVerified(state) && !current.verifiedAt
        ? new Date().toISOString()
        : isTenantVerified(state)
          ? current.verifiedAt
          : null,
  };

  emitTenantVerificationChange();

  return cachedSnapshot;
}

export function useTenantVerificationSnapshot(): TenantVerificationSnapshot {
  return useSyncExternalStore(
    subscribeToTenantVerification,
    getTenantVerificationSnapshot,
    () => DEFAULT_TENANT_VERIFICATION_SNAPSHOT,
  );
}
