import type { ReactElement } from "react";
import SettingsView from "@/components/settings/SettingsView";
import { resolveSettingsSection } from "@/components/settings/types";

interface LandlordSettingsPageProps {
  searchParams: Promise<{ section?: string | string[] }>;
}

export default async function LandlordSettingsPage({
  searchParams,
}: LandlordSettingsPageProps): Promise<ReactElement> {
  const { section } = await searchParams;

  return <SettingsView activeSection={resolveSettingsSection(section)} />;
}
