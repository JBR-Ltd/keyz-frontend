import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";

const COUNTRY_ARCHIVE_URL =
  "https://download.geonames.org/export/dump/NG.zip";
const ADMIN_CODES_URL =
  "https://download.geonames.org/export/dump/admin1CodesASCII.txt";
const DATASET_PATH = resolve("src/data/nigerian-cities.json");
const ADMINISTRATIVE_SEATS = new Set([
  "PPLC",
  "PPLA",
  "PPLA2",
  "PPLA3",
  "PPLA4",
]);
const REQUIRED_CITIES = ["Abuja", "Lagos", "Port Harcourt"];

function findEndOfCentralDirectory(archive) {
  const signature = 0x06054b50;
  const minimumOffset = Math.max(0, archive.length - 65_557);

  for (let offset = archive.length - 22; offset >= minimumOffset; offset -= 1) {
    if (archive.readUInt32LE(offset) === signature) return offset;
  }

  throw new Error("The GeoNames archive has no ZIP directory.");
}

function extractZipEntry(archive, expectedName) {
  const directoryEnd = findEndOfCentralDirectory(archive);
  const entryCount = archive.readUInt16LE(directoryEnd + 10);
  let directoryOffset = archive.readUInt32LE(directoryEnd + 16);

  for (let index = 0; index < entryCount; index += 1) {
    if (archive.readUInt32LE(directoryOffset) !== 0x02014b50) {
      throw new Error("The GeoNames ZIP directory is invalid.");
    }

    const compressionMethod = archive.readUInt16LE(directoryOffset + 10);
    const compressedSize = archive.readUInt32LE(directoryOffset + 20);
    const filenameLength = archive.readUInt16LE(directoryOffset + 28);
    const extraLength = archive.readUInt16LE(directoryOffset + 30);
    const commentLength = archive.readUInt16LE(directoryOffset + 32);
    const localHeaderOffset = archive.readUInt32LE(directoryOffset + 42);
    const filename = archive
      .subarray(directoryOffset + 46, directoryOffset + 46 + filenameLength)
      .toString("utf8");

    if (filename === expectedName) {
      if (archive.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
        throw new Error("The GeoNames ZIP entry is invalid.");
      }

      const localFilenameLength = archive.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = archive.readUInt16LE(localHeaderOffset + 28);
      const dataOffset =
        localHeaderOffset + 30 + localFilenameLength + localExtraLength;
      const compressed = archive.subarray(
        dataOffset,
        dataOffset + compressedSize,
      );

      if (compressionMethod === 0) return compressed;
      if (compressionMethod === 8) return inflateRawSync(compressed);

      throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
    }

    directoryOffset += 46 + filenameLength + extraLength + commentLength;
  }

  throw new Error(`The GeoNames archive does not contain ${expectedName}.`);
}

function normalizeSearchValue(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseAdminRegions(source) {
  const regions = new Map();

  for (const line of source.split("\n")) {
    const [code, name] = line.split("\t");
    if (code?.startsWith("NG.") && name?.trim()) {
      regions.set(code, name.trim());
    }
  }

  if (regions.size !== 37) {
    throw new Error(`Expected 37 Nigerian regions, received ${regions.size}.`);
  }

  return regions;
}

function shouldIncludePlace(featureCode, population) {
  return (
    ADMINISTRATIVE_SEATS.has(featureCode) ||
    (featureCode === "PPL" && population >= 500)
  );
}

function buildCatalogue(source, regions) {
  const places = [];
  const ids = new Set();
  let sourceModifiedDate = "";

  for (const line of source.split("\n")) {
    if (!line) continue;

    const columns = line.split("\t");
    const id = columns[0]?.trim();
    const name = columns[1]?.trim();
    const asciiName = columns[2]?.trim();
    const alternateNames = columns[3]?.split(",") ?? [];
    const featureClass = columns[6];
    const featureCode = columns[7];
    const countryCode = columns[8];
    const adminCode = columns[10];
    const population = Number(columns[14] ?? 0);
    const modificationDate = columns[18]?.trim() ?? "";

    if (
      featureClass !== "P" ||
      countryCode !== "NG" ||
      !shouldIncludePlace(featureCode, population)
    ) {
      continue;
    }

    if (
      !id ||
      !name ||
      !Number.isSafeInteger(Number(id)) ||
      !Number.isSafeInteger(population) ||
      population < 0
    ) {
      throw new Error(`Invalid GeoNames place record: ${line}`);
    }
    if (ids.has(id)) throw new Error(`Duplicate GeoNames ID: ${id}`);

    const region = regions.get(`NG.${adminCode}`);
    if (!region) throw new Error(`Missing Nigerian region for ${name}.`);

    const canonicalSearchName = normalizeSearchValue(name);
    const searchNames = [asciiName, ...alternateNames]
      .map(normalizeSearchValue)
      .filter(
        (searchName, index, values) =>
          searchName &&
          searchName !== canonicalSearchName &&
          values.indexOf(searchName) === index,
      )
      .sort((left, right) => left.localeCompare(right, "en"));

    ids.add(id);
    sourceModifiedDate =
      modificationDate > sourceModifiedDate
        ? modificationDate
        : sourceModifiedDate;
    places.push({ id, name, population, region, searchNames });
  }

  places.sort(
    (left, right) =>
      left.name.localeCompare(right.name, "en") ||
      left.region.localeCompare(right.region, "en") ||
      left.id.localeCompare(right.id, "en"),
  );

  for (const city of REQUIRED_CITIES) {
    if (!places.some((place) => place.name === city)) {
      throw new Error(`Required Nigerian city is missing: ${city}`);
    }
  }

  if (places.length < 800 || places.length > 1_500) {
    throw new Error(`Unexpected Nigerian city count: ${places.length}.`);
  }

  return {
    source: {
      countryArchiveUrl: COUNTRY_ARCHIVE_URL,
      licence: "Creative Commons Attribution 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
      name: "GeoNames",
      sourceModifiedDate,
      websiteUrl: "https://www.geonames.org/",
    },
    places,
  };
}

async function download(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Rello city catalogue updater" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`GeoNames download failed with HTTP ${response.status}.`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function writeCatalogue(catalogue) {
  const output = `${JSON.stringify(catalogue, null, 2)}\n`;
  const current = await readFile(DATASET_PATH, "utf8").catch(() => "");

  if (current === output) {
    process.stdout.write("Nigerian city catalogue is already current.\n");
    return;
  }

  await writeFile(DATASET_PATH, output, "utf8");
  process.stdout.write(
    `Updated ${catalogue.places.length} Nigerian city records.\n`,
  );
}

async function main() {
  const [archive, adminCodes] = await Promise.all([
    download(COUNTRY_ARCHIVE_URL),
    download(ADMIN_CODES_URL),
  ]);
  const countryData = extractZipEntry(archive, "NG.txt").toString("utf8");
  const regions = parseAdminRegions(adminCodes.toString("utf8"));

  await writeCatalogue(buildCatalogue(countryData, regions));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`City catalogue update failed: ${message}\n`);
  process.exitCode = 1;
});
