import { setRequestLocale } from "next-intl/server";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { DocsSearchProvider } from "@/components/docs/DocsSearchContext";
import DocsClient from "./DocsClient";

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
