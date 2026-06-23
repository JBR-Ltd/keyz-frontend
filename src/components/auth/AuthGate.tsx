"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("rello_token");

    if (!token) {
      router.replace("/login?message=Please%20log%20in%20to%20continue");
      return;
    }

    const timeoutId = window.setTimeout(() => setAuthorized(true), 0);

    return () => window.clearTimeout(timeoutId);
  }, [router]);

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 text-[var(--color-text)]">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Checking Access
        </p>
      </main>
    );
  }

  return children;
}
