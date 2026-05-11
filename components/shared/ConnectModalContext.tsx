"use client";

import { createContext, useCallback, use, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";

type ConnectModalValue = {
  open: boolean;
  show: () => void;
  hide: () => void;
};

const ConnectModalContext = createContext<ConnectModalValue | null>(null);

export function ConnectModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => {
    setOpen(true);
    track("connect_modal_opened");
  }, []);
  const hide = useCallback(() => setOpen(false), []);

  return (
    <ConnectModalContext.Provider value={{ open, show, hide }}>
      {children}
    </ConnectModalContext.Provider>
  );
}

export function useConnectModal(): ConnectModalValue {
  const ctx = use(ConnectModalContext);
  if (!ctx) {
    throw new Error(
      "useConnectModal must be used within ConnectModalProvider"
    );
  }
  return ctx;
}
