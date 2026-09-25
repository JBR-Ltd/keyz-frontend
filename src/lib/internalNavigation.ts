const HISTORY_KEY = "rello_internal_navigation_v1";
const PENDING_DESTINATION_KEY = "rello_internal_navigation_pending_v1";
const HISTORY_LIFETIME_MS = 12 * 60 * 60 * 1000;
const MAX_HISTORY_ENTRIES = 30;

interface InternalNavigationEntry {
  href: string;
  visitedAt: number;
}

type DashboardRole = "admin" | "agent" | "landlord" | "tenant";

function isInternalHref(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  );
}

function isHistoryEntry(value: unknown): value is InternalNavigationEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return isInternalHref(entry.href) && typeof entry.visitedAt === "number";
}

function readHistory(): InternalNavigationEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value: unknown = JSON.parse(
      window.sessionStorage.getItem(HISTORY_KEY) ?? "[]",
    );

    if (!Array.isArray(value)) {
      return [];
    }

    const oldestAllowedVisit = Date.now() - HISTORY_LIFETIME_MS;
    return value.filter(
      (entry): entry is InternalNavigationEntry =>
        isHistoryEntry(entry) && entry.visitedAt >= oldestAllowedVisit,
    );
  } catch {
    return [];
  }
}

function writeHistory(history: InternalNavigationEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history.slice(-MAX_HISTORY_ENTRIES)),
  );
}

function getDashboardRole(href: string): DashboardRole | null {
  const match = href.match(/^\/(admin|agent|landlord|tenant)(?:\/|$)/);
  return (match?.[1] as DashboardRole | undefined) ?? null;
}

function isAuthenticationRoute(href: string): boolean {
  return /^\/(?:forgot-password|login|register|reset-password|verify-email)(?:\/|$)/.test(
    href,
  );
}

function isCompatibleDestination(
  currentHref: string,
  candidateHref: string,
): boolean {
  const currentRole = getDashboardRole(currentHref);
  const candidateRole = getDashboardRole(candidateHref);

  if (currentRole && candidateRole && currentRole !== candidateRole) {
    return false;
  }

  return !(currentRole && isAuthenticationRoute(candidateHref));
}

export function recordInternalRoute(href: string): void {
  if (typeof window === "undefined" || !isInternalHref(href)) {
    return;
  }

  const pendingDestination = window.sessionStorage.getItem(
    PENDING_DESTINATION_KEY,
  );

  if (pendingDestination === href) {
    window.sessionStorage.removeItem(PENDING_DESTINATION_KEY);
    return;
  }

  const history = readHistory();
  const lastEntry = history.at(-1);

  if (lastEntry?.href === href) {
    lastEntry.visitedAt = Date.now();
    writeHistory(history);
    return;
  }

  history.push({ href, visitedAt: Date.now() });
  writeHistory(history);
}

export function getInternalBackDestination(
  currentHref: string,
  fallbackHref: string,
): string {
  if (typeof window === "undefined") {
    return fallbackHref;
  }

  const history = readHistory();

  while (history.at(-1)?.href === currentHref) {
    history.pop();
  }

  let destination = fallbackHref;

  while (history.length > 0) {
    const candidate = history.at(-1);

    if (candidate && isCompatibleDestination(currentHref, candidate.href)) {
      destination = candidate.href;
      break;
    }

    history.pop();
  }

  writeHistory(history);
  window.sessionStorage.setItem(PENDING_DESTINATION_KEY, destination);
  return destination;
}

export function clearInternalNavigationHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(HISTORY_KEY);
  window.sessionStorage.removeItem(PENDING_DESTINATION_KEY);
}
