"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type DocsSearchValue = {
  query: string;
  setQuery: (q: string) => void;
};

const DocsSearchContext = createContext<DocsSearchValue | null>(null);

export function DocsSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return (
    <DocsSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </DocsSearchContext.Provider>
  );
}

/** Returns null when used outside /docs (e.g. on landing). */
export function useDocsSearchOptional(): DocsSearchValue | null {
  return useContext(DocsSearchContext);
}

export function useDocsSearch(): DocsSearchValue {
  const ctx = useContext(DocsSearchContext);
  if (!ctx) {
    throw new Error("useDocsSearch must be used within DocsSearchProvider");
  }
  return ctx;
}
