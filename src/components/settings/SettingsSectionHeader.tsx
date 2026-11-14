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
          {/* On a phone the screen's own title already names the section */}
          <h2 className="hidden font-display text-3xl font-bold leading-tight text-primary lg:block">
            {title}
          </h2>
          <p className="max-w-2xl font-body text-sm leading-6 text-muted lg:mt-2">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
