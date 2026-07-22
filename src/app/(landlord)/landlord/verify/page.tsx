import { Suspense } from "react";
import LandlordVerificationFlow from "@/components/verification/LandlordVerificationFlow";

export default function LandlordVerificationPage() {
  return (
    <Suspense fallback={null}>
      <LandlordVerificationFlow />
    </Suspense>
  );
}
