import { Suspense } from "react";
import IdentityVerificationFlow from "@/components/verification/IdentityVerificationFlow";

export default function AgentIdentityVerificationPage() {
  return (
    <Suspense fallback={null}>
      <IdentityVerificationFlow role="agent" />
    </Suspense>
  );
}
