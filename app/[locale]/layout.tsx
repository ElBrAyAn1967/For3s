import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import ThemeSync from "@/components/shared/ThemeSync";
import MotionProvider from "@/components/shared/MotionProvider";
import { ConnectModalProvider } from "@/components/shared/ConnectModalContext";
import ConnectModal from "@/components/shared/ConnectModal";
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

  return {
    title: t("title"),
    description: t("description"),
    keywords: ["For3s", "AI agents", "infrastructure", "LATAM", "founder", "AI"],
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

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
        >{themeBootstrap}</Script>
        <ThemeSync />
        <NextIntlClientProvider>
          <MotionProvider>
            <ConnectModalProvider>
              {children}
              <ConnectModal />
            </ConnectModalProvider>
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
