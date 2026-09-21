"use client";

import {
  clearLegacyAuthenticationStorage,
  getAuthenticationServerSnapshot,
  getAuthenticationSnapshot,
  invalidateAuthentication,
  listenForAuthenticationChanges,
  refreshAuthentication,
  subscribeToAuthentication,
  type AuthenticationSnapshot,
} from "@/lib/authSession";
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

const AuthenticationContext = createContext<AuthenticationSnapshot | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authentication = useSyncExternalStore(
    subscribeToAuthentication,
    getAuthenticationSnapshot,
    getAuthenticationServerSnapshot,
  );

  useEffect(() => {
    clearLegacyAuthenticationStorage();
    void refreshAuthentication();

    const stopListening = listenForAuthenticationChanges(() => {
      invalidateAuthentication();
      void refreshAuthentication();
    });
    const refreshVisibleSession = (): void => {
      if (document.visibilityState === "visible") void refreshAuthentication();
    };

    window.addEventListener("focus", refreshVisibleSession);
    document.addEventListener("visibilitychange", refreshVisibleSession);

    return () => {
      stopListening();
      window.removeEventListener("focus", refreshVisibleSession);
      document.removeEventListener("visibilitychange", refreshVisibleSession);
    };
  }, []);

  return (
    <AuthenticationContext.Provider value={authentication}>
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthentication(): AuthenticationSnapshot {
  const authentication = useContext(AuthenticationContext);

  if (!authentication) {
    throw new Error("useAuthentication must be used inside AuthProvider.");
  }

  return authentication;
}
