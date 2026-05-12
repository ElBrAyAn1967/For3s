import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Construction } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Demo" });
  return {
    title: `For3s — ${t("title")}`,
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Demo" });

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-[calc(100svh-4rem)] flex items-center pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24 w-full text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-brand-bold/10 border border-brand-bold/25 mb-8">
            <Construction className="size-6 text-brand-bold" />
          </div>
          <p className="text-[10px] sm:text-xs font-mono font-semibold tracking-[0.18em] uppercase text-foreground-accent mb-4">
            {t("comingSoon.label")}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.1] tracking-tight text-foreground-active mb-5">
            {t("comingSoon.title")}
          </h1>
          <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed max-w-xl mx-auto">
            {t("comingSoon.description")}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
