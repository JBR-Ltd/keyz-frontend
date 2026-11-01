import type { ReactElement } from "react";
import DisputeBoard from "@/components/disputes/DisputeBoard";

export default function TenantDisputesPage(): ReactElement {
  return <DisputeBoard perspective="tenant" />;
}
