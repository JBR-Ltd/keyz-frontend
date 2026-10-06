import type { ReactElement } from "react";
import SettingsView from "@/components/settings/SettingsView";

interface AgentSettingsPageProps {
  searchParams: Promise<{ section?: string | string[] }>;
}

export default async function AgentSettingsPage({
  searchParams,
}: AgentSettingsPageProps): Promise<ReactElement> {
  const { section } = await searchParams;

  return (
    <SettingsView
      initialSection={section === "payments" ? "payments" : "profile"}
    />
  );
}
