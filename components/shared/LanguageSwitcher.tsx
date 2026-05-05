"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export default function LanguageSwitcher() {
  const t = useTranslations("Navbar.languageSwitcher");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale || isPending) return;
    startTransition(() => {
      // next-intl strips the locale prefix from `pathname` automatically.
      // Passing `{ locale }` lets it rebuild the URL with the right prefix
      // according to `localePrefix: "as-needed"`.
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex items-center gap-0.5 rounded-full border border-edge-secondary bg-surface-overlay-large p-0.5 text-xs font-semibold"
    >
      <button
        type="button"
        onClick={() => switchTo("es")}
        aria-label={t("switchToSpanish")}
        aria-pressed={locale === "es"}
        disabled={isPending}
        className={`px-2 sm:px-2.5 py-1 rounded-full transition-colors disabled:opacity-60 ${
          locale === "es"
            ? "bg-c-brand-70 text-c-gray-0"
            : "text-foreground-tertiary hover:text-foreground-active"
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-label={t("switchToEnglish")}
        aria-pressed={locale === "en"}
        disabled={isPending}
        className={`px-2 sm:px-2.5 py-1 rounded-full transition-colors disabled:opacity-60 ${
          locale === "en"
            ? "bg-c-brand-70 text-c-gray-0"
            : "text-foreground-tertiary hover:text-foreground-active"
        }`}
      >
        EN
      </button>
    </div>
  );
}
