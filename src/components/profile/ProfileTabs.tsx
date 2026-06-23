"use client";

import { KeyboardEvent, useRef } from "react";
import type { ProfileTabId, ProfileTabItem } from "@/components/profile/types";

interface ProfileTabsProps {
  tabs: ProfileTabItem[];
  activeTab: ProfileTabId;
  onTabChange: (tabId: ProfileTabId) => void;
}

export default function ProfileTabs({
  tabs,
  activeTab,
  onTabChange,
}: ProfileTabsProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ): void => {
    const keyMap: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
    };
    const offset = keyMap[event.key];

    if (!offset) {
      return;
    }

    event.preventDefault();
    const nextIndex = (index + offset + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];

    onTabChange(nextTab.id);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="border-b border-surface">
      <div
        role="tablist"
        aria-label="Profile settings sections"
        className="flex overflow-x-auto lg:justify-between"
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`profile-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`profile-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`shrink-0 border-b-2 px-5 py-4 font-display text-2xl font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:bg-primary focus-visible:text-white sm:px-8 ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
