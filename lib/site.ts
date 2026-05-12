/**
 * Single source of truth for site-wide identity & SEO constants.
 *
 * Anything that needs to appear in metadata, OpenGraph, JSON-LD, sitemap,
 * robots, or social-share previews lives here. Change once, propagate
 * everywhere.
 */

export const SITE = {
  /** Production origin. No trailing slash. */
  url: "https://for3s.ai",
  /** Legal/canonical name. */
  name: "For3s",
  /** Domain bare. Used as @id in JSON-LD. */
  domain: "for3s.ai",
  /** PNG version of the brand mark for JSON-LD (Google requires raster). */
  logo: "/logo-mark-512.png",
  logoSize: 512,
  /** Founder identity for Person schema. */
  founder: {
    name: "Brian Aguilar",
    url: "https://www.linkedin.com/in/brianweb3",
    jobTitle: "Founder & CEO",
  },
  /** Social profiles for Organization.sameAs (entity-graph signal). */
  social: [
    "https://github.com/for3s",
    "https://x.com/for3s",
    "https://www.linkedin.com/company/for3s",
    "https://www.linkedin.com/in/brianweb3",
  ],
  /** Supported locales mirrored from i18n/routing.ts to keep SEO config self-contained. */
  locales: ["es", "en"] as const,
  defaultLocale: "es" as const,
} as const;
