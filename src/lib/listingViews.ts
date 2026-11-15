import { apiRequest } from "@/lib/apiRequest";

const COUNTED_KEY_PREFIX = "rello_listing_viewed_";

/**
 * Counts one visit to a listing for the host's weekly summary. Once per browser tab
 * session, so refreshing or going back to the page does not inflate the number.
 */
export function recordListingView(publicId: string): void {
  const key = COUNTED_KEY_PREFIX + publicId;

  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage can be blocked; counting then is still better than not counting
  }

  void apiRequest(`/api/properties/public/${publicId}/views`, {
    method: "POST",
  }).catch(() => undefined);
}
