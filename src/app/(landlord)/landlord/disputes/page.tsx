import type { ReactElement } from "react";
import DisputeBoard from "@/components/disputes/DisputeBoard";

export default function LandlordDisputesPage(): ReactElement {
  return <DisputeBoard perspective="host" />;
}
