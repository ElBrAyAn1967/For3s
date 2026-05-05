"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDocsSearch } from "./DocsSearchContext";

export default function DocsSearchInput({
  className = "",
}: {
  className?: string;
}) {
  const t = useTranslations("Docs");
  const { query, setQuery } = useDocsSearch();
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");

  useEffect(() => {
    if (typeof navigator !== "undefined" && /Mac/.test(navigator.platform)) {
      setShortcutLabel("⌘ K");
    }
  }, []);

  // Cmd/Ctrl + K → focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("docs-search");
        input?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <label
      htmlFor="docs-search"
      className={`relative flex items-center ${className}`}
    >
      <Search className="absolute left-3.5 w-4 h-4 text-foreground-tertiary pointer-events-none" />
      <input
        id="docs-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.label")}
        className="w-full pl-10 pr-16 py-2 rounded-lg bg-surface-overlay-large border border-edge-secondary text-sm text-foreground-active placeholder:text-foreground-tertiary outline-none focus:border-c-brand-70/50 transition-colors"
      />
      <kbd className="absolute right-3 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-foreground-tertiary bg-surface-primary border border-edge-secondary">
        {shortcutLabel}
      </kbd>
    </label>
  );
}
