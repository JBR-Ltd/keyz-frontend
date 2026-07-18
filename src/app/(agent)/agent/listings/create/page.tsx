import type { ReactElement } from "react";
import CreateListingForm from "@/components/listings/CreateListingForm";

interface CreateListingPageProps {
  searchParams: Promise<{ draft?: string | string[] }>;
}

export default async function AgentCreateListingPage({
  searchParams,
}: CreateListingPageProps): Promise<ReactElement> {
  const { draft } = await searchParams;
  const initialListingId = typeof draft === "string" ? draft : undefined;

  return <CreateListingForm initialListingId={initialListingId} role="agent" />;
}
