"use client";

import { useEffect } from "react";

/**
 * Re-applies the persisted theme on every mount.
 *
 * The inline `<script>` in <head> only runs once at initial HTML load. During
 * client-side navigation (e.g. switching locales with next-intl), React
 * re-renders the <html> element and the `dark` class can be wiped because the
 * JSX doesn't include it. This component ensures the class is always in sync
 * with localStorage / prefers-color-scheme.
 */
export default function ThemeSync() {
  useEffect(() => {
    const apply = () => {
      try {
        const stored = localStorage.getItem("theme");
        const prefersDark =
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        const isDark = stored ? stored === "dark" : prefersDark;
        const html = document.documentElement;
        if (isDark) html.classList.add("dark");
        else html.classList.remove("dark");
      } catch {}
    };

    apply();

    // Listen to storage events from other tabs
    window.addEventListener("storage", apply);
    return () => window.removeEventListener("storage", apply);
  }, []);

  return null;
}
