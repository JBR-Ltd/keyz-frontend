import { Suspense } from "react";
import HostPayoutVerificationFlow from "@/components/verification/HostPayoutVerificationFlow";

export default function AgentPayoutVerificationPage() {
  return (
    <Suspense fallback={null}>
      <HostPayoutVerificationFlow role="agent" />
    </Suspense>
  );
}
