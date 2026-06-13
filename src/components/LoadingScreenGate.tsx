"use client";

import { useEffect, useState } from "react";
import LoadingScreen from "./LoadingScreen";

interface LoadingScreenGateProps {
  children: React.ReactNode;
}

export function LoadingScreenGate({ children }: LoadingScreenGateProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("rello_loaded")) {
      document.documentElement.style.visibility = "";
      document.documentElement.style.overflow = "";
      queueMicrotask(() => setShow(false));
    }
  }, []);

  return (
    <>
      {show ? <LoadingScreen onDone={() => setShow(false)} /> : null}
      {children}
    </>
  );
}
