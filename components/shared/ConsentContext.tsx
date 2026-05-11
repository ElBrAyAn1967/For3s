"use client";

import {
  createContext,
  use,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ConsentState = "pending" | "granted" | "denied";

const STORAGE_KEY = "for3s_consent";
const STORAGE_EVENT = "for3s_consent_change";

type ConsentValue = {
  consent: ConsentState;
  grant: () => void;
  deny: () => void;
  reset: () => void;
};

const ConsentContext = createContext<ConsentValue | null>(null);

function readFromStorage(): ConsentState {
  if (typeof window === "undefined") return "pending";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "granted" || stored === "denied") return stored;
  } catch {}
  return "pending";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function writeStorage(value: ConsentState | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
    // Force same-tab subscribers to re-read; the native "storage" event
    // only fires across tabs.
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {}
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(
    subscribe,
    readFromStorage,
    () => "pending" as ConsentState,
  );

  const grant = useCallback(() => writeStorage("granted"), []);
  const deny = useCallback(() => writeStorage("denied"), []);
  const reset = useCallback(() => writeStorage(null), []);

  return (
    <ConsentContext.Provider value={{ consent, grant, deny, reset }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentValue {
  const ctx = use(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return ctx;
}
