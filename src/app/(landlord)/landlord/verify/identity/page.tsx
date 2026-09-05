import { Suspense } from "react";
import HostIdentityVerificationFlow from "@/components/verification/HostIdentityVerificationFlow";

export default function LandlordIdentityVerificationPage() {
  return (
    <Suspense fallback={null}>
      <HostIdentityVerificationFlow role="landlord" />
    </Suspense>
  );
}
