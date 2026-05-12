import { getTranslations } from "next-intl/server";
import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { DOC_IDS, DOC_STRUCTURE, ALL_DOC_ITEMS } from "@/lib/docs";
import { SITE } from "@/lib/site";

// Per-doc OG image. Generated at build time — one image per (locale, slug).
// The page route already declares `generateStaticParams` so Next will iterate
// the same set here.

export const alt = "For3s docs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return SITE.locales.flatMap((locale) =>
    ALL_DOC_ITEMS.map((item) => ({ locale, slug: item.id })),
  );
}

function findCategoryOf(id: string): string {
  for (const cat of DOC_STRUCTURE) {
    if (cat.items.some((i) => i.id === id)) return cat.id;
  }
  return DOC_STRUCTURE[0].id;
}

export default async function DocOgImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!DOC_IDS.has(slug)) {
    return renderOg({ title: "For3s — Docs" });
  }

  const t = await getTranslations({ locale, namespace: "Docs" });
  const catId = findCategoryOf(slug);

  return renderOg({
    overline: t(`categories.${catId}`),
    title: t(`items.${slug}.label`),
    subtitle: t(`items.${slug}.summary`),
  });
}
