"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPreferences,
  savePreferences,
  type AccountPreferences,
} from "@/lib/account";

// === Types

export interface ToggleDefinition {
  defaultOn: boolean;
  description: string;
  id: string;
  label: string;
}

export interface PreferenceToggles {
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  toggle: (id: string) => void;
  /** Keyed by the plain id the screen uses, not the stored key. */
  values: Record<string, boolean>;
}

/**
 * Toggles that survive a sign-out.
 *
 * The whole set is written on every change because the server stores exactly
 * what it is sent: a switch turned off has to be stored as false, or it reads as
 * the default again on the next device.
 */
export function usePreferenceToggles(
  namespace: string,
  definitions: ToggleDefinition[],
): PreferenceToggles {
  const [stored, setStored] = useState<AccountPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const key = useCallback(
    (id: string): string => `${namespace}.${id}`,
    [namespace],
  );

  useEffect(() => {
    let active = true;

    void getPreferences().then((preferences) => {
      if (active) {
        setStored(preferences);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const values: Record<string, boolean> = {};

  for (const definition of definitions) {
    const saved = stored?.[key(definition.id)];
    values[definition.id] = saved ?? definition.defaultOn;
  }

  const toggle = useCallback(
    (id: string) => {
      const definition = definitions.find((item) => item.id === id);

      if (!definition) {
        return;
      }

      const current = stored?.[key(id)] ?? definition.defaultOn;
      // Every default is written down on the first change, so a preference the
      // person never touched cannot drift when a default later changes
      const next: AccountPreferences = { ...(stored ?? {}) };

      for (const item of definitions) {
        next[key(item.id)] = stored?.[key(item.id)] ?? item.defaultOn;
      }

      next[key(id)] = !current;

      setStored(next);
      setIsSaving(true);
      setError("");

      void savePreferences(next).then((result) => {
        setIsSaving(false);

        if (!result.success) {
          setError(result.message);
          // Put the switch back rather than showing a state that was not saved
          setStored((previous) =>
            previous === null ? previous : { ...previous, [key(id)]: current },
          );
        }
      });
    },
    [definitions, key, stored],
  );

  return {
    error,
    isLoading: stored === null,
    isSaving,
    toggle,
    values,
  };
}
