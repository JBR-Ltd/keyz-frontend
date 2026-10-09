import type { ReactElement } from "react";
import SettingsView from "@/components/settings/SettingsView";
import { resolveSettingsSection } from "@/components/settings/types";

interface AgentSettingsPageProps {
  searchParams: Promise<{ section?: string | string[] }>;
}

export default async function AgentSettingsPage({
  searchParams,
}: AgentSettingsPageProps): Promise<ReactElement> {
  const { section } = await searchParams;

  return <SettingsView activeSection={resolveSettingsSection(section)} />;
}
