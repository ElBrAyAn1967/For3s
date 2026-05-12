import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Crawl directives. We allow everything by default and explicitly block
 * paths that should not be indexed (API routes, Next internals). Sitemap
 * is referenced so Bing/Google discover it without manual submission.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/admin/", "/draft/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
