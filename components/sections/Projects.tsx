"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { projects, type ProjectStatus } from "@/lib/data";

/**
 * Status palette is derived from semantic tokens that flip with the theme.
 * See `globals.css` for the `--status-{success,info,muted}-{bg,fg,border}`
 * tokens — both light and dark variants live there.
 */
const statusStyle: Record<
  ProjectStatus,
  { bg: string; color: string; border: string }
> = {
  activo: {
    bg: "var(--status-success-bg)",
    color: "var(--status-success-fg)",
    border: "var(--status-success-border)",
  },
  desarrollo: {
    bg: "var(--status-info-bg)",
    color: "var(--status-info-fg)",
    border: "var(--status-info-border)",
  },
  pausado: {
    bg: "var(--status-muted-bg)",
    color: "var(--status-muted-fg)",
    border: "var(--status-muted-border)",
  },
};

const ANCHOR_PROJECT_ID = "for3s";

export default function Projects() {
  const t = useTranslations("Projects");
  const featured = projects.filter((p) => p.featured);
  const anchor = featured.find((p) => p.id === ANCHOR_PROJECT_ID);
  const otherFeatured = featured.filter((p) => p.id !== ANCHOR_PROJECT_ID);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section
      id="projects"
      className="section-blend py-16 sm:py-24 bg-surface-primary"
      style={{ ["--blend-from" as string]: "var(--surface-overlay-large)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 sm:mb-12"
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent font-mono">
            {t("overline")}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground-active">
            {t("headline")}
          </h2>
          <p className="mt-3 text-foreground-secondary max-w-xl">
            {t("subheadline")}
          </p>
        </motion.div>

        {/* Anchor card — For3s, full-width, hero treatment */}
        {anchor && (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative mb-4 p-6 sm:p-10 rounded-2xl border border-edge-secondary bg-surface-overlay-large hover:border-edge-primary transition-all duration-300 overflow-hidden"
          >
            {/* Decorative gradient sweep — theme-aware */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{ background: "var(--marketing-gradient)" }}
            />

            <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-10 items-start">
              <div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                    style={{
                      backgroundColor: statusStyle[anchor.status].bg,
                      color: statusStyle[anchor.status].color,
                      borderColor: statusStyle[anchor.status].border,
                    }}
                  >
                    {t(`status.${anchor.status}`)}
                  </span>
                  <span className="text-xs text-foreground-tertiary font-mono">
                    {anchor.year}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground-accent ml-auto">
                    ANCHOR PROJECT
                  </span>
                </div>

                <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-3 text-foreground-active leading-[1.05]">
                  {anchor.name}
                </h3>
                <p className="text-base sm:text-lg font-medium mb-4 text-foreground-accent">
                  {t(`items.${anchor.id}.tagline`)}
                </p>
                <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed">
                  {t(`items.${anchor.id}.description`)}
                </p>
              </div>

              {/* Right column — tags as a compact stack */}
              <div className="md:border-l md:border-edge-secondary md:pl-8">
                <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary mb-3">
                  Stack
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {anchor.tags.map((tag) => (
                    <li
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-md text-foreground-secondary bg-surface-primary-hover border border-edge-secondary font-mono"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.article>
        )}

        {/* Other featured — 3-column tight grid (visually distinct from anchor) */}
        {otherFeatured.length > 0 && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-12">
            {otherFeatured.map((project, i) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="group relative p-5 rounded-xl border border-edge-secondary bg-surface-overlay-large hover:border-edge-primary hover:bg-surface-overlay-small transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: statusStyle[project.status].bg,
                      color: statusStyle[project.status].color,
                      borderColor: statusStyle[project.status].border,
                    }}
                  >
                    {t(`status.${project.status}`)}
                  </span>
                  <span className="text-[10px] text-foreground-tertiary font-mono">
                    {project.year}
                  </span>
                </div>

                <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-1 text-foreground-active group-hover:text-foreground-accent transition-colors">
                  {project.name}
                </h4>
                <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                  {t(`items.${project.id}.tagline`)}
                </p>
              </motion.article>
            ))}
          </div>
        )}

        {/* Rest — editorial list (no cards), divider-based */}
        {rest.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary mb-4">
              También en el journey
            </p>
            <ul className="divide-y divide-edge-secondary border-t border-b border-edge-secondary">
              {rest.map((project, i) => (
                <motion.li
                  key={project.id}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="group py-3 sm:py-4 grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-6 items-baseline"
                >
                  <span className="text-xs text-foreground-tertiary font-mono w-10">
                    {project.year}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-foreground-active group-hover:text-foreground-accent transition-colors whitespace-nowrap">
                      {project.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-foreground-secondary leading-snug truncate">
                      {t(`items.${project.id}.tagline`)}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
                    style={{
                      backgroundColor: statusStyle[project.status].bg,
                      color: statusStyle[project.status].color,
                      borderColor: statusStyle[project.status].border,
                    }}
                  >
                    {t(`status.${project.status}`)}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
