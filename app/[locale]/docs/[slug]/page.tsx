import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { DocsSearchProvider } from "@/components/docs/DocsSearchContext";
import DocsClient from "../DocsClient";
import { DOC_STRUCTURE, DOC_IDS, ALL_DOC_ITEMS } from "@/lib/docs";
import { SITE } from "@/lib/site";

/**
 * Static generation: prebuild all (locale × slug) pairs at build time so
 * each doc gets its own indexable URL. Tied to DOC_STRUCTURE so adding a
 * new entry there automatically yields a route.
 */
export function generateStaticParams() {
  return ALL_DOC_ITEMS.map((item) => ({ slug: item.id }));
}

/** Find which category owns a slug — used for the active-tab signal. */
function findCategoryOf(id: string): string {
  for (const cat of DOC_STRUCTURE) {
    if (cat.items.some((i) => i.id === id)) return cat.id;
  }
  return DOC_STRUCTURE[0].id;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!DOC_IDS.has(slug)) return { title: "Not found" };

  const t = await getTranslations({ locale, namespace: "Docs" });
  const label = t(`items.${slug}.label`);
  const summary = t(`items.${slug}.summary`);

  // hreflang per-slug. Same slug across locales because doc ids are stable.
  const path = `/docs/${slug}`;
  const canonicalPath = locale === SITE.defaultLocale ? path : `/${locale}${path}`;
  const languages = Object.fromEntries(
    SITE.locales.map((l) => [l, l === SITE.defaultLocale ? path : `/${l}${path}`]),
  );

  return {
    // template "%s — For3s" from the root layout handles the suffix.
    title: label,
    description: summary,
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    openGraph: {
      title: `${label} — ${SITE.name}`,
      description: summary,
      url: `${SITE.url}${canonicalPath}`,
      type: "article",
      locale,
      alternateLocale: SITE.locales.filter((l) => l !== locale),
      images: [
        {
          url: SITE.logo,
          width: SITE.logoSize,
          height: SITE.logoSize,
          alt: SITE.name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${label} — ${SITE.name}`,
      description: summary,
      images: [SITE.logo],
    },
  };
}

export default async function DocSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!DOC_IDS.has(slug)) notFound();

  setRequestLocale(locale);
  const activeCategory = findCategoryOf(slug);

  return (
    <DocsSearchProvider>
      <Navbar />
      <DocsClient activeId={slug} activeCategory={activeCategory} />
      <Footer />
    </DocsSearchProvider>
  );
}
