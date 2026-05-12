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
      // images injected by app/[locale]/docs/[slug]/opengraph-image.tsx
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} — ${SITE.name}`,
      description: summary,
      // images injected by twitter-image.tsx (re-export of OG)
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
  const t = await getTranslations({ locale, namespace: "Docs" });
  const activeCategory = findCategoryOf(slug);
  const label = t(`items.${slug}.label`);
  const summary = t(`items.${slug}.summary`);
  const categoryLabel = t(`categories.${activeCategory}`);

  const docsPath = locale === SITE.defaultLocale ? "/docs" : `/${locale}/docs`;
  const slugPath = `${docsPath}/${slug}`;
  const docsUrl = `${SITE.url}${docsPath}`;
  const slugUrl = `${SITE.url}${slugPath}`;
  const firstSlugOfCategory = DOC_STRUCTURE.find((c) => c.id === activeCategory)
    ?.items[0]?.id;
  const categoryUrl = firstSlugOfCategory
    ? `${SITE.url}${docsPath}/${firstSlugOfCategory}`
    : docsUrl;

  // Article schema: signals to Google this is a long-form content page (vs a
  // landing). Even with stub content, the structure ensures pages get
  // surfaced as articles when indexed. headline is required by spec.
  // BreadcrumbList: site hierarchy signal — Google can render it in SERP.
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: label,
    description: summary,
    inLanguage: locale,
    isPartOf: { "@id": `${SITE.url}/#website` },
    publisher: { "@id": `${SITE.url}/#organization` },
    author: { "@id": `${SITE.url}/#founder` },
    url: slugUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": slugUrl,
    },
    image: `${slugUrl}/opengraph-image`,
    articleSection: categoryLabel,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE.name,
        item: SITE.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("title"),
        item: docsUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryLabel,
        item: categoryUrl,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: label,
        item: slugUrl,
      },
    ],
  };

  return (
    <>
      {/* Article + Breadcrumb schemas live on the page (not the layout) so
          each doc emits its own structured payload. Combined into one @graph
          to keep <head> tidy and let Google relate the entities. */}
      <script
        type="application/ld+json"
        // react-doctor-disable-next-line react-doctor/no-danger, react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [articleJsonLd, breadcrumbJsonLd],
          }),
        }}
      />
      <DocsSearchProvider>
        <Navbar />
        <DocsClient activeId={slug} activeCategory={activeCategory} />
        <Footer />
      </DocsSearchProvider>
    </>
  );
}
