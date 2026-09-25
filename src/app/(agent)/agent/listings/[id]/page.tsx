import type { ReactElement } from "react";
import ManageListingView from "@/components/listings/ManageListingView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentManageListingPage({
  params,
}: PageProps): Promise<ReactElement> {
  const { id } = await params;

  return <ManageListingView propertyId={id} role="agent" />;
}
