import { getTranslations } from "next-intl/server";
import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

// Next 16 special filename: this generates the OG image for `/{locale}` and
// inherits down to any nested route that doesn't define its own. The home
// landing surfaces site-level title + tagline so social previews carry the
// elevator pitch, not "Brian López — For3s".

export const alt = "For3s — Infraestructura para agentes en LATAM";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Site" });
  const tHero = await getTranslations({ locale, namespace: "Hero" });

  return renderOg({
    overline: tHero("overline"),
    title: t("title") === "For3s" ? tHero("headline.line1") : t("title"),
    subtitle: t("description"),
  });
}
