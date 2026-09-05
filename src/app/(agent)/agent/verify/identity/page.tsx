import { Suspense } from "react";
import HostIdentityVerificationFlow from "@/components/verification/HostIdentityVerificationFlow";

export default function AgentIdentityVerificationPage() {
  return (
    <Suspense fallback={null}>
      <HostIdentityVerificationFlow role="agent" />
    </Suspense>
  );
}
