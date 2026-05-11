import Link from "next/link";
import { useTranslations } from "next-intl";
import { siteConfig } from "@/lib/data";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer
      className="section-blend py-8 sm:py-10 bg-surface-primary"
      style={{ ["--blend-from" as string]: "var(--surface-overlay-large)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-secondary">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-c-brand-70">For3s</span>
          <span suppressHydrationWarning>
            · {t("byline")} © {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground-active transition-colors"
          >
            GitHub
          </Link>
          <Link
            href={siteConfig.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground-active transition-colors"
          >
            Twitter
          </Link>
          <Link
            href={`mailto:${siteConfig.email}`}
            className="hover:text-foreground-active transition-colors"
          >
            Email
          </Link>
        </div>
      </div>
    </footer>
  );
}
