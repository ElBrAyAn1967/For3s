import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Brain,
  Sparkles,
  Wrench,
  Users,
  Moon,
  Shield,
  ArrowRight,
  Star,
} from "lucide-react";

const SITE_URL = "https://for3s.vercel.app";
const PAGE_PATH = "/for3s-os";
const REPO = "https://github.com/for3slabs/for3s";

const ICONS: Record<string, typeof Brain> = {
  brain: Brain,
  sparkles: Sparkles,
  wrench: Wrench,
  users: Users,
  moon: Moon,
  shield: Shield,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "For3sOS.meta" });
  const url = `${SITE_URL}${PAGE_PATH}`;
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: url },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function For3sOSPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "For3sOS" });

  // FAQ items (typed i18n) — used both for the visible section and the JSON-LD.
  const faqItems = (t.raw("faq.items") as { q: string; a: string }[]) ?? [];
  const featureItems =
    (t.raw("features.items") as {
      icon: string;
      title: string;
      text: string;
    }[]) ?? [];

  // Structured data: SoftwareApplication + FAQPage (AEO / answer boxes / AI Overview).
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "For3s OS",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux (Docker)",
    description: t("meta.description"),
    url: REPO,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: "Brian Jovany López Pérez" },
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <div className="dark min-h-screen bg-surface-base text-foreground-active">
      {/* Structured data — no user input flows into the payload. */}
      <script
        type="application/ld+json"
        // react-doctor-disable-next-line react-doctor/no-danger, react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <script
        type="application/ld+json"
        // react-doctor-disable-next-line react-doctor/no-danger, react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* HERO */}
        <section className="text-center mb-24">
          <span className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-full border border-edge-primary bg-surface-overlay-large/60">
            <span className="px-2 py-0.5 rounded-full bg-brand-bold/15 text-brand-bold text-[10px] font-mono font-semibold tracking-wider">
              {t("badge.version")}
            </span>
            <span className="text-xs text-foreground-secondary font-mono">
              {t("badge.label")}
            </span>
          </span>
          <h1 className="text-[clamp(2.2rem,7vw,4.2rem)] font-semibold leading-[1.06] tracking-tight mb-6">
            <span className="block">{t("hero.headline.line1")}</span>
            <span className="block text-foreground-accent">
              {t("hero.headline.line2")}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed mb-10 max-w-xl mx-auto">
            {t("hero.description")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={REPO}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-bold text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Star className="size-4" /> {t("hero.ctaPrimary")}
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-edge-primary text-foreground-active font-semibold text-sm hover:bg-surface-overlay-large transition-colors"
            >
              {t("hero.ctaSecondary")} <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* WHY */}
        <section className="mb-24 rounded-xl border border-edge-primary bg-surface-overlay-large/40 p-6 sm:p-8 border-l-2 border-l-brand-bold">
          <p className="text-xs font-mono uppercase tracking-wider text-brand-bold mb-2">
            {t("why.overline")}
          </p>
          <p className="text-foreground-secondary leading-relaxed">
            {t("why.text")}
          </p>
        </section>

        {/* FEATURES */}
        <section className="mb-24">
          <p className="text-xs font-mono uppercase tracking-wider text-brand-bold mb-2 text-center">
            {t("features.overline")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-10 tracking-tight">
            {t("features.title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featureItems.map((f) => {
              const Icon = ICONS[f.icon] ?? Brain;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-edge-primary bg-surface-overlay-large/40 p-5"
                >
                  <Icon className="size-5 text-brand-bold mb-3" />
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {f.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* INSTALL */}
        <section className="mb-24 text-center">
          <p className="text-xs font-mono uppercase tracking-wider text-brand-bold mb-2">
            {t("install.overline")}
          </p>
          <div className="inline-block rounded-lg border border-edge-primary bg-surface-overlay-large/60 px-5 py-3 font-mono text-sm text-foreground-active mb-3">
            {t("install.command")}
          </div>
          <p className="text-sm text-foreground-secondary max-w-md mx-auto">
            {t("install.text")}
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-24">
          <p className="text-xs font-mono uppercase tracking-wider text-brand-bold mb-2 text-center">
            {t("faq.overline")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-10 tracking-tight">
            {t("faq.title")}
          </h2>
          <div className="flex flex-col gap-3">
            {faqItems.map((it) => (
              <details
                key={it.q}
                className="rounded-xl border border-edge-primary bg-surface-overlay-large/40 p-5"
              >
                <summary className="font-semibold cursor-pointer">
                  {it.q}
                </summary>
                <p className="text-sm text-foreground-secondary leading-relaxed mt-3">
                  {it.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* COMPARE (GEO) */}
        <section className="mb-16 text-center">
          <p className="text-xs font-mono uppercase tracking-wider text-brand-bold mb-2">
            {t("compare.overline")}
          </p>
          <p className="text-foreground-secondary mb-3">{t("compare.text")}</p>
          <a
            href="https://for3slabs.github.io/for3s/vs-hermes.html"
            className="inline-flex items-center gap-1 text-brand-bold font-semibold hover:underline"
          >
            {t("compare.link")}
          </a>
        </section>

        {/* FOOTER */}
        <footer className="pt-8 border-t border-edge-primary text-center text-sm text-foreground-secondary">
          <p className="mb-1">{t("footer.tagline")}</p>
          <p>
            {t("footer.license")} ·{" "}
            <a href={REPO} className="text-brand-bold hover:underline">
              {t("footer.repo")}
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
