import { Suspense } from "react";
import IdentityVerificationFlow from "@/components/verification/IdentityVerificationFlow";

export default function LandlordIdentityVerificationPage() {
  return (
    <Suspense fallback={null}>
      <IdentityVerificationFlow role="landlord" />
    </Suspense>
  );
}
