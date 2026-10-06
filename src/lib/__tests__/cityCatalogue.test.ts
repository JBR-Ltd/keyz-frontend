import { describe, expect, it } from "vitest";
import cityCatalogueData from "../../data/nigerian-cities.json";
import {
  normalizeCitySearch,
  searchCityCatalogue,
  type CityCatalogue,
  type CityCataloguePlace,
} from "../cityCatalogue";

const catalogue = cityCatalogueData as CityCatalogue;

const fixture: CityCataloguePlace[] = [
  {
    id: "1",
    name: "Lagos",
    population: 15_388_000,
    region: "Lagos",
    searchNames: ["eko"],
  },
  {
    id: "2",
    name: "Lagos Island",
    population: 0,
    region: "Lagos",
    searchNames: [],
  },
  {
    id: "3",
    name: "Lagos",
    population: 100,
    region: "Lagos",
    searchNames: [],
  },
  {
    id: "4",
    name: "Eko Ende",
    population: 20_000,
    region: "Osun State",
    searchNames: [],
  },
];

describe("normalizeCitySearch", () => {
  it("normalizes case, punctuation, spacing and diacritics", () => {
    expect(normalizeCitySearch("  Èkó--Town  ")).toBe("eko town");
  });
});

describe("searchCityCatalogue", () => {
  it("ranks exact and canonical prefix matches ahead of alternate names", () => {
    expect(searchCityCatalogue(fixture, "eko")).toEqual([
      { id: "4", name: "Eko Ende", region: "Osun State" },
      { id: "1", name: "Lagos", region: "Lagos" },
    ]);
  });

  it("deduplicates matching names within the same region", () => {
    expect(searchCityCatalogue(fixture, "lag")).toEqual([
      { id: "1", name: "Lagos", region: "Lagos" },
      { id: "2", name: "Lagos Island", region: "Lagos" },
    ]);
  });

  it("respects the result limit", () => {
    expect(searchCityCatalogue(fixture, "lag", 1)).toHaveLength(1);
  });
});

describe("generated Nigerian city catalogue", () => {
  it("contains a validated cities500-style dataset", () => {
    expect(catalogue.places.length).toBeGreaterThan(800);
    expect(catalogue.places.length).toBeLessThan(1_500);
    expect(new Set(catalogue.places.map((place) => place.id)).size).toBe(
      catalogue.places.length,
    );
  });

  it.each(["Abuja", "Lagos", "Port Harcourt"])(
    "contains %s",
    (city) => {
      expect(catalogue.places.some((place) => place.name === city)).toBe(true);
    },
  );

  it("finds Lagos through its Eko alternate name", () => {
    expect(searchCityCatalogue(catalogue.places, "Eko")).toContainEqual({
      id: "2332459",
      name: "Lagos",
      region: "Lagos",
    });
  });
});
