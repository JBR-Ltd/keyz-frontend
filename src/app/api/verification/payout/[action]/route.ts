import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

const ALLOWED_ACTIONS = ["resolve", "setup"] as const;

type PayoutAction = (typeof ALLOWED_ACTIONS)[number];

interface RouteContext {
  params: Promise<{ action: string }>;
}

function isPayoutAction(value: string): value is PayoutAction {
  return ALLOWED_ACTIONS.some((action) => action === value);
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { action } = await context.params;

  if (!isPayoutAction(action)) {
    return Response.json(
      { success: false, message: "Unsupported payout action.", data: null },
      { status: 404 },
    );
  }

  return proxyAuthenticatedRequest({
    backendPath: `/api/verification/payout/${action}${new URL(request.url).search}`,
    method: "POST",
    request,
  });
}
