import { apiRequest } from "@/lib/apiRequest";

export interface ListingImageUploadResult {
  direct: boolean;
  response: Response | null;
}

interface UploadIntent {
  expiresAt: string;
  finalizeToken: string;
  headers: Record<string, string>;
  objectKey: string;
  strategy: "direct" | "proxy";
  uploadUrl: string;
}

function unwrap(value: unknown): unknown {
  return value !== null && typeof value === "object" && "data" in value
    ? value.data
    : null;
}

function isUploadIntent(value: unknown): value is UploadIntent {
  return (
    value !== null &&
    typeof value === "object" &&
    "strategy" in value &&
    (value.strategy === "direct" || value.strategy === "proxy") &&
    (value.strategy === "proxy" ||
      ("uploadUrl" in value &&
        typeof value.uploadUrl === "string" &&
        "objectKey" in value &&
        typeof value.objectKey === "string" &&
        "finalizeToken" in value &&
        typeof value.finalizeToken === "string" &&
        "headers" in value &&
        value.headers !== null &&
        typeof value.headers === "object"))
  );
}

export async function uploadListingImage(
  file: Blob,
  fileName: string,
  intentUrl: string,
  finalizeUrl: string,
): Promise<ListingImageUploadResult> {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const inferredType =
    extension === "heic"
      ? "image/heic"
      : extension === "heif"
        ? "image/heif"
        : "application/octet-stream";
  const contentType = file.type || inferredType;
  const intentResponse = await apiRequest(intentUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, contentType, size: file.size }),
  });
  const reusableIntentResponse = intentResponse.clone();
  const intentPayload: unknown = await intentResponse.json().catch(() => null);

  if (!intentResponse.ok) {
    return { direct: true, response: reusableIntentResponse };
  }

  const intent = unwrap(intentPayload);
  if (!isUploadIntent(intent)) {
    return { direct: true, response: reusableIntentResponse };
  }
  if (intent.strategy === "proxy") {
    return { direct: false, response: null };
  }

  const uploadResponse = await fetch(intent.uploadUrl, {
    method: "PUT",
    headers: intent.headers,
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("The photo could not be transferred. Try again.");
  }

  const response = await apiRequest(finalizeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      objectKey: intent.objectKey,
      finalizeToken: intent.finalizeToken,
      caption: null,
    }),
  });
  return { direct: true, response };
}
