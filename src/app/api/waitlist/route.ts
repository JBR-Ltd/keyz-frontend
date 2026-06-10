const WAITLIST_ENDPOINT =
  "https://waiting-list-backend-h3xn.onrender.com/api/subscribe";

type WaitlistPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
    payload.firstName.trim().length > 0 &&
    payload.lastName.trim().length > 0 &&
    payload.email.trim().length > 0 &&
    payload.phone.trim().length > 0
  );
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (!isWaitlistPayload(body)) {
    return Response.json(
      { message: "Please provide your first name, last name, email, and phone." },
      { status: 400 },
    );
  }

  const payload: WaitlistPayload = {
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
  };

  try {
    const response = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await readResponseBody(response);

    if (!response.ok) {
      return Response.json(
        {
          message:
            data && typeof data === "object" && "message" in data
              ? data.message
              : "Unable to join the waitlist right now.",
        },
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
