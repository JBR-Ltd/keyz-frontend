const WAITLIST_ENDPOINT =
  process.env.WAITLIST_ENDPOINT || "https://waiting-list-backend-1.onrender.com";

function getWaitlistUrl(): string {
  const normalized = WAITLIST_ENDPOINT.replace(/\/$/, "");
  if (normalized.endsWith("/api/subscribe")) {
    return normalized;
  }
  if (normalized.endsWith("/api")) {
    return `${normalized}/subscribe`;
  }
  return `${normalized}/api/subscribe`;
}

type WaitlistPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  role: string;
};

function isWaitlistPayload(value: unknown): value is WaitlistPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.firstName === "string" &&
    typeof payload.lastName === "string" &&
    typeof payload.email === "string" &&
    typeof payload.phone === "string" &&
    typeof payload.city === "string" &&
    typeof payload.role === "string" &&
    payload.firstName.trim().length > 0 &&
    payload.lastName.trim().length > 0 &&
    payload.email.trim().length > 0 &&
    payload.phone.trim().length > 0 &&
    payload.city.trim().length > 0 &&
    payload.role.trim().length > 0
  );
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  if (response.headers.get("Content-Type")?.includes("text/html")) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function POST(request: Request): Promise<Response> {
  const waitlistUrl = getWaitlistUrl();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (!isWaitlistPayload(body)) {
    return Response.json(
      { message: "Please provide your name, email, phone, city, and role." },
      { status: 400 },
    );
  }

  const payload = {
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    city: body.city.trim(),
    role: body.role.trim(),
  };

  try {
    const response = await fetch(waitlistUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await readResponseBody(response);

    if (!response.ok) {
      let errorMessage = "Unable to join the waitlist right now.";
      if (data && typeof data === "object") {
        if ("error" in data && typeof data.error === "string") {
          errorMessage = data.error;
        } else if ("message" in data && typeof data.message === "string") {
          errorMessage = data.message;
        }
      }

      return Response.json(
        { message: errorMessage },
        { status: response.status },
      );
    }

    return Response.json(data ?? { message: "Joined waitlist successfully." });
  } catch {
    return Response.json(
      { message: "Unable to reach the waitlist server right now." },
      { status: 502 },
    );
  }
}
