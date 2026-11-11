import { getSessionToken } from "@/app/api/_session";
import cityCatalogueData from "@/data/nigerian-cities.json";
import {
  searchCityCatalogue,
  type CityCatalogue,
} from "@/lib/cityCatalogue";

const MINIMUM_QUERY_LENGTH = 2;
const MAXIMUM_QUERY_LENGTH = 80;
const cityCatalogue = cityCatalogueData as CityCatalogue;

function normalizeQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function GET(request: Request): Promise<Response> {
  const token = await getSessionToken();

  if (!token) {
    return Response.json(
      { message: "Authentication is required to search for cities." },
      { status: 401 },
    );
  }

  const query = normalizeQuery(new URL(request.url).searchParams.get("q") ?? "");

  if (
    query.length < MINIMUM_QUERY_LENGTH ||
    query.length > MAXIMUM_QUERY_LENGTH
  ) {
    return Response.json(
      { message: "Enter between 2 and 80 characters to search for a city." },
      { status: 400 },
    );
  }

  return Response.json(
    { data: searchCityCatalogue(cityCatalogue.places, query) },
    {
      headers: {
        "Cache-Control": "private, max-age=3600",
      },
    },
  );
}
