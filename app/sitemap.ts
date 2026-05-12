import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { ALL_DOC_ITEMS } from "@/lib/docs";

/**
 * Sitemap with priority weighting per page importance.
 *
 * next-intl is configured as localePrefix: "as-needed", so the default
 * locale (es) lives at the bare path while non-default locales get a
 * /{locale} prefix. We list both, and emit alternate-language links so
 * Google understands they're the same page in another language.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  type Entry = {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  };

  // Static routes (landing, demo, docs landing)
  const staticRoutes: Entry[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/demo", priority: 0.8, changeFrequency: "monthly" },
    { path: "/docs", priority: 0.9, changeFrequency: "weekly" },
  ];

  // One entry per doc slug. Priority decays slightly vs landing so Google
  // understands the hierarchy: home > docs root > individual doc pages.
  const docRoutes: Entry[] = ALL_DOC_ITEMS.map((item) => ({
    path: `/docs/${item.id}`,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  const allRoutes: Entry[] = [...staticRoutes, ...docRoutes];

  return allRoutes.flatMap(({ path, priority, changeFrequency }) =>
    SITE.locales.map((locale) => {
      const localizedPath =
        locale === SITE.defaultLocale
          ? path
          : `/${locale}${path === "/" ? "" : path}`;
      const url = `${SITE.url}${localizedPath || "/"}`;

      const languages = Object.fromEntries(
        SITE.locales.map((l) => {
          const lp =
            l === SITE.defaultLocale
              ? path
              : `/${l}${path === "/" ? "" : path}`;
          return [l, `${SITE.url}${lp || "/"}`];
        }),
      );

      return {
        url,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages },
      };
    }),
  );
}
