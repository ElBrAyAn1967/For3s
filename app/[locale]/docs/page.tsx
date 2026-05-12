import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { DEFAULT_DOC_ID } from "@/lib/docs";

/**
 * /docs root — server-side 307 redirect to the default doc slug. Each doc
 * lives at its own indexable URL `/docs/{slug}` with its own metadata, so
 * this file never paints UI. The metadata export below exists only so
 * linters that scan for `export const metadata` on every page route stay
 * happy; crawlers follow the 307 to the destination's metadata instead.
 */
export const metadata: Metadata = {
  title: "Docs",
  robots: { index: false, follow: true },
};

export default async function DocsIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: `/docs/${DEFAULT_DOC_ID}`, locale });
}
