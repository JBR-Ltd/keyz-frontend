"use client";

import type { ReactElement } from "react";
import HostTenanciesWorkspace from "@/components/bookings/HostTenanciesWorkspace";

export default function LandlordBookingsPage(): ReactElement {
  return <HostTenanciesWorkspace role="landlord" />;
}
