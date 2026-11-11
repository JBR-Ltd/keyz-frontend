import { Suspense } from "react";
import HostVerificationCenter from "@/components/verification/HostVerificationCenter";

export default function AgentVerificationPage() {
  return (
    <Suspense fallback={null}>
      <HostVerificationCenter role="agent" />
    </Suspense>
  );
}
