import { clearSessionCookie, getSessionToken } from "@/app/api/_session";

const API_BASE_URL = process.env.API_BASE_URL;

export async function GET(): Promise<Response> {
  const token = await getSessionToken();
  const headers = { "Cache-Control": "no-store" };

  if (!token) {
    return Response.json(
      { authenticated: false, user: null },
      { headers },
    );
  }

  if (!API_BASE_URL) {
    return Response.json(
      { authenticated: false, message: "Network error. Please try again later.", user: null },
      { status: 500, headers },
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/users/me`,
      {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.status === 401) {
      await clearSessionCookie();
      return Response.json(
        { authenticated: false, user: null },
        { headers },
      );
    }

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return Response.json(
        {
          authenticated: false,
          message: "Network error. Please try again later.",
          user: null,
        },
        { status: response.status, headers },
      );
    }

    const user =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    if (user === null || typeof user !== "object") {
      return Response.json(
        {
          authenticated: false,
          message: "Network error. Please try again later.",
          user: null,
        },
        { status: 502, headers },
      );
    }

    const safeUser = {
      email: "email" in user ? user.email : null,
      firstName: "firstName" in user ? user.firstName : null,
      id: "id" in user ? user.id : null,
      lastName: "lastName" in user ? user.lastName : null,
      role: "role" in user ? user.role : null,
    };

    return Response.json(
      { authenticated: true, user: safeUser },
      { headers },
    );
  } catch {
    return Response.json(
      {
        authenticated: false,
        message: "Network error. Please try again later.",
        user: null,
      },
      { status: 502, headers },
    );
  }
}
