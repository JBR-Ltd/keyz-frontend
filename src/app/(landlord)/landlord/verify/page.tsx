import { Suspense } from "react";
import HostVerificationCenter from "@/components/verification/HostVerificationCenter";

export default function LandlordVerificationPage() {
  return (
    <Suspense fallback={null}>
      <HostVerificationCenter role="landlord" />
    </Suspense>
  );
}
