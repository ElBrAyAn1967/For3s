import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Timeline from "@/components/sections/Timeline";
import Faq from "@/components/sections/Faq";
import { FAQ_ITEM_KEYS } from "@/lib/faq";
import Contact from "@/components/sections/Contact";

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
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // FAQPage schema mirrors the Faq section content so Google can surface
  // answers directly in search rich results. Pulled from the same i18n
  // keys the Faq component renders.
  const tFaq = await getTranslations({ locale, namespace: "Faq" });
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEM_KEYS.map((key) => ({
      "@type": "Question",
      name: tFaq(`items.${key}.question`),
      acceptedAnswer: {
        "@type": "Answer",
        text: tFaq(`items.${key}.answer`),
      },
    })),
  };

  return (
    <>
      {/* FAQPage JSON-LD is built from typed i18n keys; no user input flows
          into the payload. */}
      <script
        type="application/ld+json"
        // react-doctor-disable-next-line react-doctor/no-danger, react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Timeline />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
