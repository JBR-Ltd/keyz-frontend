import { ReactElement, Suspense } from "react";
import IdentityVerificationFlow from "@/components/verification/IdentityVerificationFlow";
import VerificationFlowSkeleton from "@/components/verification/VerificationFlowSkeleton";

function VerificationFallback(): ReactElement {
  return <VerificationFlowSkeleton />;
}

export default function TenantVerifyPage(): ReactElement {
  return (
    <Suspense fallback={<VerificationFallback />}>
      <IdentityVerificationFlow role="tenant" />
    </Suspense>
  );
}
