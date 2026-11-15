// === Server timestamps
//
// The API sends most times as a Java LocalDateTime, which serialises with no zone
// on the end: "2026-11-15T08:30:00.123". JavaScript reads a date-time string with
// no offset as LOCAL time, so a message sent at 08:30 UTC was read as 08:30 in the
// reader's own zone. In Lagos that put every timestamp an hour out, which is why
// "2 minutes ago" could appear on a message that had only just arrived.
//
// The server writes these in UTC, so that is what an absent zone means.

/** True when the string already says what zone it is in. */
function hasZone(value: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
}

/**
 * Reads a timestamp from the API. A value with no zone is taken as UTC, which is
 * what the server wrote, rather than as the reader's local time.
 */
export function parseServerTime(value: string): Date {
  if (!value) {
    return new Date(Number.NaN);
  }

  // A date on its own is a calendar day, not an instant, so it is left alone
  return new Date(hasZone(value) || !value.includes("T") ? value : `${value}Z`);
}

/** Milliseconds since a server timestamp, or NaN when it cannot be read. */
export function millisecondsSince(value: string): number {
  return Date.now() - parseServerTime(value).getTime();
}
