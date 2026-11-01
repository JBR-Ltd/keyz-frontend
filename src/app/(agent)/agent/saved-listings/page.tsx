import type { ReactElement } from "react";
import HostListingsView from "@/components/listings/HostListingsView";

export default function AgentSavedListingsPage(): ReactElement {
  return <HostListingsView role="agent" />;
}
