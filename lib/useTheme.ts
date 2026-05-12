"use client";

import { useSyncExternalStore } from "react";

/**
 * Reactive read of the active theme. Watches the `dark` class on <html> via
 * a MutationObserver so any toggle (ThemeToggle button, system change picked
 * up by ThemeSync, another tab via storage) re-renders consumers.
 *
 * Returns "dark" or "light". Server snapshot is "light" — the dispatcher
 * pattern that consumes this must tolerate a brief light-default flash on
 * hydration, or gate render on mount.
 */
export type Theme = "dark" | "light";

function getSnapshot(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light");
}
