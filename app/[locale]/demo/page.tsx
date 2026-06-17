import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GeneralPageShell from "@/components/demo/GeneralPageShell";

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

// Demo GENERAL — abierta a cualquiera (N:N), con tope de 10 concurrentes y
// lista de espera. Cuando el usuario entra al shell (cupo activo), el wrapper
// cliente oculta navbar/footer del sitio. Jazz/Mashe viven en /demo/[token].
export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Demo" });

  return (
    <GeneralPageShell
      label={t("general.label")}
      title={t("general.title")}
      description={t("general.description")}
    />
  );
}