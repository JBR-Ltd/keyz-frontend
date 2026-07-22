import { ReactElement, Suspense } from "react";
import TenantVerificationFlow from "@/components/tenant/TenantVerificationFlow";

function VerificationFallback(): ReactElement {
  return <main className="fixed inset-0 z-[120] min-h-screen bg-primary" />;
}

export default function TenantVerifyPage(): ReactElement {
  return (
    <Suspense fallback={<VerificationFallback />}>
      <TenantVerificationFlow />
    </Suspense>
  );
}
