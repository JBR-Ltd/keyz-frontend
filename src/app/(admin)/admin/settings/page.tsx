import type { ReactElement } from "react";
import SettingsView from "@/components/settings/SettingsView";
import { resolveSettingsSection } from "@/components/settings/types";

interface AdminSettingsPageProps {
  searchParams: Promise<{ section?: string | string[] }>;
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps): Promise<ReactElement> {
  const { section } = await searchParams;

  return <SettingsView activeSection={resolveSettingsSection(section)} />;
}
