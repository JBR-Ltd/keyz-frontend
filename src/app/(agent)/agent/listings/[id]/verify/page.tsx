import type { ReactElement } from "react";
import ListingVerificationView from "@/components/listings/ListingVerificationView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentVerifyListingPage({
  params,
}: PageProps): Promise<ReactElement> {
  const { id } = await params;

  return <ListingVerificationView propertyId={id} role="agent" />;
}
