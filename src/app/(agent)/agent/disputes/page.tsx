import type { ReactElement } from "react";
import DisputeBoard from "@/components/disputes/DisputeBoard";

export default function AgentDisputesPage(): ReactElement {
  return <DisputeBoard perspective="host" />;
}
