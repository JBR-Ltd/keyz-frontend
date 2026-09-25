import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

const ALLOWED_POST_ACTIONS = ["resolve", "setup"] as const;
/** Reads the picker needs before anything is submitted. */
const ALLOWED_GET_ACTIONS = ["banks"] as const;

type PayoutPostAction = (typeof ALLOWED_POST_ACTIONS)[number];
type PayoutGetAction = (typeof ALLOWED_GET_ACTIONS)[number];

interface RouteContext {
  params: Promise<{ action: string }>;
}

function isPayoutPostAction(value: string): value is PayoutPostAction {
  return ALLOWED_POST_ACTIONS.some((action) => action === value);
}

function isPayoutGetAction(value: string): value is PayoutGetAction {
  return ALLOWED_GET_ACTIONS.some((action) => action === value);
}

function unsupported(): Response {
  return Response.json(
    { success: false, message: "Unsupported payout action.", data: null },
    { status: 404 },
  );
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { action } = await context.params;

  if (!isPayoutGetAction(action)) {
    return unsupported();
  }

  return proxyAuthenticatedRequest({
    backendPath: `/api/verification/payout/${action}${new URL(request.url).search}`,
    method: "GET",
    request,
  });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { action } = await context.params;

  if (!isPayoutPostAction(action)) {
    return unsupported();
  }

  return proxyAuthenticatedRequest({
    backendPath: `/api/verification/payout/${action}${new URL(request.url).search}`,
    method: "POST",
    request,
  });
}
