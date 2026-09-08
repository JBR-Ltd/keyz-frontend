"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { resolveApiError } from "@/lib/errors";

// === Types

type AccountRole = "AGENT" | "LANDLORD" | "TENANT";

interface GoogleAuthButtonProps {
  /** Sent only on sign-up. Google cannot tell us whether someone rents or lets. */
  role?: AccountRole;
  /** Called instead of signing in, when sign-up needs a role and none is chosen. */
  onRoleRequired?: () => void;
  label: string;
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  prompt: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

// === Helpers

function createDeviceFingerprint(): string {
  if (typeof window === "undefined") {
    return "rello-server";
  }

  const stored = localStorage.getItem("rello_device_fingerprint");

  if (stored) {
    return stored;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem("rello_device_fingerprint", generated);
  return generated;
}

function isAccountRole(value: unknown): value is AccountRole {
  return value === "AGENT" || value === "LANDLORD" || value === "TENANT";
}

// === Component

export default function GoogleAuthButton({
  role,
  onRoleRequired,
  label,
}: GoogleAuthButtonProps): ReactElement | null {
  const router = useRouter();
  const { notify } = useToast();
  const [isReady, setIsReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const roleRef = useRef(role);

  // The Google callback is registered once, so it reads the role through a ref
  // rather than closing over whatever it was on first render
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse): Promise<void> => {
      if (!response.credential) {
        return;
      }

      setIsSigningIn(true);

      try {
        const result = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-Fingerprint": createDeviceFingerprint(),
          },
          body: JSON.stringify({
            idToken: response.credential,
            role: roleRef.current,
          }),
        });

        const data: unknown = await result.json().catch(() => null);

        if (!result.ok) {
          throw new Error(resolveApiError(data, "Google sign-in failed."));
        }

        const payload =
          data !== null && typeof data === "object" && "data" in data
            ? data.data
            : null;

        if (
          payload === null ||
          typeof payload !== "object" ||
          !("accessToken" in payload) ||
          typeof payload.accessToken !== "string" ||
          !("role" in payload) ||
          !isAccountRole(payload.role)
        ) {
          throw new Error("Google sign-in failed.");
        }

        localStorage.setItem("rello_token", payload.accessToken);
        localStorage.setItem("rello_role", payload.role);

        notify({ title: "Signed in with Google", variant: "success" });

        router.replace(
          payload.role === "TENANT"
            ? "/tenant/browse"
            : `/${payload.role.toLowerCase()}/dashboard`,
        );
      } catch (error) {
        notify({
          title: "Google sign-in failed",
          description:
            error instanceof Error ? error.message : "Try again in a moment.",
          variant: "error",
        });
      } finally {
        setIsSigningIn(false);
      }
    },
    [notify, router],
  );

  const initialise = useCallback((): void => {
    if (!clientId || !window.google) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => void handleCredential(response),
    });
    setIsReady(true);
  }, [clientId, handleCredential]);

  const handleClick = (): void => {
    // Sign-up needs a role before Google is ever opened
    if (onRoleRequired && !roleRef.current) {
      onRoleRequired();
      return;
    }

    window.google?.accounts.id.prompt();
  };

  // Rendering nothing beats rendering a button that cannot work
  if (!clientId) {
    return null;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initialise}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={!isReady || isSigningIn}
        className="inline-flex min-h-14 w-full items-center justify-center gap-3 border border-primary/20 bg-white px-5 py-4 font-body text-base font-bold text-primary transition-all duration-200 ease-in-out hover:border-primary hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningIn ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <svg
            width="19"
            height="19"
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="#4285F4"
              d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
            />
            <path
              fill="#34A853"
              d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
            />
            <path
              fill="#FBBC05"
              d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
            />
            <path
              fill="#EA4335"
              d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
            />
          </svg>
        )}
        {isSigningIn ? "Signing in" : label}
      </button>
    </>
  );
}
