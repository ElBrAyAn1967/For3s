import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { DocsSearchProvider } from "@/components/docs/DocsSearchContext";
import DocsClient from "./DocsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Docs" });
  return {
    title: `${t("title")} — For3s`,
    description: t("subtitle"),
  };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <DocsSearchProvider>
      <Navbar />
      <DocsClient />
      <Footer />
    </DocsSearchProvider>
  );
}
