"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import DocsSearchInput from "@/components/docs/DocsSearchInput";
import { useDocsSearchOptional } from "@/components/docs/DocsSearchContext";
import { useConnectModal } from "./ConnectModalContext";

const linkKeys = ["about", "projects", "timeline", "contact", "docs"] as const;
const linkHrefs: Record<(typeof linkKeys)[number], string> = {
  about: "/#about",
  projects: "/#projects",
  timeline: "/#timeline",
  contact: "/#contact",
  docs: "/docs",
};

export default function Navbar() {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const { show: showConnectModal } = useConnectModal();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Determine if we're on /docs (handles both `/docs` and `/en/docs`)
  const inDocs = pathname.startsWith("/docs") || /^\/[a-z]{2}\/docs/.test(pathname);

  // Only render the search if the DocsSearchProvider is mounted (i.e. inside /docs).
  // Outside /docs the context is null and we fall back to the regular nav links.
  const docsCtx = useDocsSearchOptional();
  const showDocsSearch = inDocs && docsCtx !== null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
        scrolled || open || inDocs
          ? "bg-surface-primary/90 backdrop-blur-md border-b border-edge-secondary"
          : "bg-transparent"
      }`}
    >
      <div
        className={`${
          inDocs ? "max-w-7xl" : "max-w-6xl"
        } mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4`}
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-semibold text-base tracking-tight text-c-brand-70 flex-shrink-0"
        >
          For3s
        </Link>

        {/* Center: search on docs, nav links elsewhere */}
        {showDocsSearch ? (
          <div className="flex-1 max-w-2xl mx-auto hidden sm:flex">
            <DocsSearchInput className="w-full" />
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-1">
            {linkKeys.map((key) => (
              <Link
                key={key}
                href={linkHrefs[key]}
                className="px-3.5 py-1.5 text-sm text-foreground-secondary hover:text-foreground-active hover:bg-surface-primary-hover rounded-md transition-colors"
              >
                {t(`links.${key}`)}
              </Link>
            ))}
          </nav>
        )}

        {/* Right cluster — always visible */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            onClick={showConnectModal}
            className="btn-pill btn-pill-primary hidden sm:inline-flex"
          >
            {t("cta")}
          </button>

          {/* Mobile hamburger — solo fuera de docs (en docs no hay nav links que mostrar) */}
          {!showDocsSearch && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t("menu.close") : t("menu.open")}
              aria-expanded={open}
              className="md:hidden size-9 inline-flex items-center justify-center rounded-md text-foreground-secondary hover:text-foreground-active hover:bg-surface-primary-hover transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {open ? (
                  <>
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </>
                ) : (
                  <>
                    <path d="M3 6h18" />
                    <path d="M3 12h18" />
                    <path d="M3 18h18" />
                  </>
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile docs search row — solo en docs y solo en mobile */}
      {showDocsSearch && (
        <div className="sm:hidden px-4 pb-3 pt-1">
          <DocsSearchInput className="w-full" />
        </div>
      )}

      {/* Mobile menu drawer — solo fuera de docs */}
      {!showDocsSearch && (
        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
            open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="px-4 pt-2 pb-6 flex flex-col gap-1 border-t border-edge-secondary bg-surface-primary">
            {linkKeys.map((key) => (
              <Link
                key={key}
                href={linkHrefs[key]}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-base text-foreground-primary hover:text-foreground-active hover:bg-surface-primary-hover rounded-lg transition-colors"
              >
                {t(`links.${key}`)}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                showConnectModal();
              }}
              className="btn-pill btn-pill-primary mt-4 self-start"
            >
              {t("cta")}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
