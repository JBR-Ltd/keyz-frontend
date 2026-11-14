import { Suspense, type ReactElement } from "react";
import SupportCenter from "@/components/support/SupportCenter";

export default function SupportPage(): ReactElement {
  return (
    <Suspense>
      <SupportCenter />
    </Suspense>
  );
}
