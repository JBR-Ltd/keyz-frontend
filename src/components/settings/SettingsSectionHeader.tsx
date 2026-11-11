import type { ReactElement, ReactNode } from "react";

interface SettingsSectionHeaderProps {
  action?: ReactNode;
  description: string;
  title: string;
}

export default function SettingsSectionHeader({
  action,
  description,
  title,
}: SettingsSectionHeaderProps): ReactElement {
  return (
    <header className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold leading-tight text-primary sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
