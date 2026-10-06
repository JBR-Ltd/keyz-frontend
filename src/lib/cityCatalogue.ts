import type { CitySuggestion } from "./cities";

export interface CityCataloguePlace extends CitySuggestion {
  population: number;
  searchNames: string[];
}

export interface CityCatalogue {
  places: CityCataloguePlace[];
  source: {
    countryArchiveUrl: string;
    licence: string;
    licenceUrl: string;
    name: string;
    sourceModifiedDate: string;
    websiteUrl: string;
  };
}

interface RankedCity {
  place: CityCataloguePlace;
  rank: number;
}

export function normalizeCitySearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function rankPlace(place: CityCataloguePlace, query: string): number | null {
  const canonicalName = normalizeCitySearch(place.name);

  if (canonicalName === query) return 0;
  if (canonicalName.startsWith(query)) return 1;
  if (place.searchNames.some((name) => name.startsWith(query))) return 2;

  return null;
}

export function searchCityCatalogue(
  places: CityCataloguePlace[],
  query: string,
  limit = 8,
): CitySuggestion[] {
  const normalizedQuery = normalizeCitySearch(query);
  if (!normalizedQuery || limit <= 0) return [];

  const ranked = places.reduce<RankedCity[]>((results, place) => {
    const rank = rankPlace(place, normalizedQuery);
    if (rank !== null) results.push({ place, rank });
    return results;
  }, []);

  ranked.sort(
    (left, right) =>
      left.rank - right.rank ||
      right.place.population - left.place.population ||
      left.place.name.localeCompare(right.place.name, "en") ||
      left.place.region.localeCompare(right.place.region, "en"),
  );

  const seen = new Set<string>();
  const suggestions: CitySuggestion[] = [];

  for (const { place } of ranked) {
    const duplicateKey = `${normalizeCitySearch(place.name)}::${normalizeCitySearch(place.region)}`;
    if (seen.has(duplicateKey)) continue;

    seen.add(duplicateKey);
    suggestions.push({ id: place.id, name: place.name, region: place.region });
    if (suggestions.length === limit) break;
  }

  return suggestions;
}
