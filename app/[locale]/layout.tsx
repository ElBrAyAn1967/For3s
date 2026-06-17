import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import ThemeSync from "@/components/shared/ThemeSync";
import MotionProvider from "@/components/shared/MotionProvider";
import { ConnectModalProvider } from "@/components/shared/ConnectModalContext";
import ConnectModal from "@/components/shared/ConnectModal";
import { ConsentProvider } from "@/components/shared/ConsentContext";
import ConsentBanner from "@/components/shared/ConsentBanner";
import ClarityProvider from "@/components/shared/ClarityProvider";
import "../globals.css";

// Inter — primary sans. DESIGN.md anchors For3s voice on Inter despite the
// font being on impeccable's reflex-reject list: the choice is defended in
// PRODUCT.md ("limpia, neutra, ultra-legible. Humaniza con rigor métrico").
// Weights cover the full hero (800) → body (400) range described in DESIGN.md.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// Space Grotesk — legal Aeonik-adjacent heading face. It gives the light mode
// a more product-system feel inspired by Core without using unlicensed Aeonik.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// JetBrains Mono — accent mono for kickers, tags, status, code inline, stats.
// DESIGN.md's canonical pair. NOT Fira Mono.
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const themeBootstrap = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Site" });
  const title = t("title");
  const description = t("description");

  // Canonical & hreflang map. next-intl uses localePrefix: "as-needed",
  // so the default locale (es) lives at "/" and en at "/en".
  const canonicalPath = locale === SITE.defaultLocale ? "/" : `/${locale}`;
  const alternateLanguages = Object.fromEntries(
    SITE.locales.map((l) => [l, l === SITE.defaultLocale ? "/" : `/${l}`]),
  );

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: title,
      template: `%s — ${SITE.name}`,
    },
    description,
    keywords: ["For3s", "AI agents", "infrastructure", "LATAM", "founder", "AI"],
    authors: [{ name: SITE.founder.name, url: SITE.founder.url }],
    creator: SITE.founder.name,
    publisher: SITE.name,
    alternates: {
      canonical: canonicalPath,
      languages: alternateLanguages,
    },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title,
      description,
      url: `${SITE.url}${canonicalPath}`,
      locale,
      alternateLocale: SITE.locales.filter((l) => l !== locale),
      // OG image is auto-wired by app/[locale]/opengraph-image.tsx — Next
      // appends og:image/width/height/type tags. Per-route OGs (e.g. docs)
      // override via their own opengraph-image.tsx file.
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      // twitter:image auto-wired via twitter-image.tsx (re-export of OG).
    },
    icons: {
      icon: [{ url: "/logo-mark-circle.svg", type: "image/svg+xml" }],
      apple: "/logo-mark-circle.svg",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Site" });

  // Three JSON-LD entities give Google a complete picture: company,
  // searchable website surface, and founder. @id cross-refs link them.
  const orgId = `${SITE.url}/#organization`;
  const websiteId = `${SITE.url}/#website`;
  const founderId = `${SITE.url}/#founder`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE.name,
        url: SITE.url,
        logo: {
          "@type": "ImageObject",
          url: `${SITE.url}${SITE.logo}`,
          width: SITE.logoSize,
          height: SITE.logoSize,
        },
        description: t("description"),
        sameAs: SITE.social,
        founder: { "@id": founderId },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE.url,
        name: SITE.name,
        description: t("description"),
        publisher: { "@id": orgId },
        inLanguage: [...SITE.locales],
      },
      {
        "@type": "Person",
        "@id": founderId,
        name: SITE.founder.name,
        url: SITE.founder.url,
        jobTitle: SITE.founder.jobTitle,
        worksFor: { "@id": orgId },
        sameAs: SITE.social.filter((s) => s.includes("brianweb3")),
      },
    ],
  };

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme bootstrap must run synchronously before paint to block FOUC;
            next/script breaks Next 16 RSC inline-children pattern, so <head>
            needs a raw <script>. */}
        {/* react-doctor-disable-next-line react-doctor/nextjs-no-native-script */}
        <script
          // react-doctor-disable-next-line react-doctor/no-danger, react/no-danger
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
        {/* Organization JSON-LD is generated from typed constants; no user
            input flows into the payload. */}
        {/* react-doctor-disable-next-line react-doctor/nextjs-no-native-script */}
        <script
          type="application/ld+json"
          // react-doctor-disable-next-line react-doctor/no-danger, react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeSync />
        <NextIntlClientProvider>
          <ConsentProvider>
            <ClarityProvider />
            <MotionProvider>
              <ConnectModalProvider>
                {children}
                <ConnectModal />
                <ConsentBanner />
              </ConnectModalProvider>
            </MotionProvider>
          </ConsentProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
