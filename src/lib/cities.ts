export interface CitySuggestion {
  id: string;
  name: string;
  region: string;
}

export interface CitySearchResult {
  data: CitySuggestion[];
  message?: string;
}

function isCitySuggestion(value: unknown): value is CitySuggestion {
  if (!value || typeof value !== "object") return false;

  const suggestion = value as Record<string, unknown>;

  return (
    typeof suggestion.id === "string" &&
    typeof suggestion.name === "string" &&
    typeof suggestion.region === "string"
  );
}

function readMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const message = (value as Record<string, unknown>).message;
  return typeof message === "string" ? message : undefined;
}

export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<CitySearchResult> {
  const response = await fetch(
    `/api/locations/cities?q=${encodeURIComponent(query)}`,
    { signal },
  );
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      readMessage(payload) ??
        "City search is unavailable right now. Please try again.",
    );
  }

  if (!payload || typeof payload !== "object") {
    return { data: [] };
  }

  const data = (payload as Record<string, unknown>).data;

  return {
    data: Array.isArray(data) ? data.filter(isCitySuggestion) : [],
  };
}
