import { Suspense } from "react";
import HostPayoutVerificationFlow from "@/components/verification/HostPayoutVerificationFlow";

export default function LandlordPayoutVerificationPage() {
  return (
    <Suspense fallback={null}>
      <HostPayoutVerificationFlow role="landlord" />
    </Suspense>
  );
}
