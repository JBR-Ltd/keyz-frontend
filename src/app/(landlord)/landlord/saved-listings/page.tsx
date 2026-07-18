import type { ReactElement } from "react";
import HostListingsView from "@/components/listings/HostListingsView";

export default function LandlordSavedListingsPage(): ReactElement {
  return <HostListingsView role="landlord" />;
}
