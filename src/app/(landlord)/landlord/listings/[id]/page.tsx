import type { ReactElement } from "react";
import ManageListingView from "@/components/listings/ManageListingView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LandlordManageListingPage({
  params,
}: PageProps): Promise<ReactElement> {
  const { id } = await params;

  return <ManageListingView key={id} propertyId={id} role="landlord" />;
}
