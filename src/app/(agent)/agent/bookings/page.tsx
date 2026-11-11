"use client";

import type { ReactElement } from "react";
import HostTenanciesWorkspace from "@/components/bookings/HostTenanciesWorkspace";

export default function AgentBookingsPage(): ReactElement {
  return <HostTenanciesWorkspace role="agent" />;
}
