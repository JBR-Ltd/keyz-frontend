export const SETTINGS_SECTION_IDS = [
  "profile",
  "security",
  "notifications",
  "payments",
  "privacy",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

export function resolveSettingsSection(
  value: string | string[] | undefined,
): SettingsSectionId {
  const candidate = Array.isArray(value) ? value[0] : value;

  return SETTINGS_SECTION_IDS.find((section) => section === candidate) ?? "profile";
}
