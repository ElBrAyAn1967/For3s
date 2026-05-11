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

export default function Projects() {
  const t = useTranslations("Projects");
  const featured = projects.filter((p) => p.featured);
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
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent">
            {t("overline")}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground-active">
            {t("headline")}
          </h2>
          <p className="mt-3 text-foreground-secondary max-w-xl">
            {t("subheadline")}
          </p>
        </motion.div>

        {/* Featured grid */}
        <div className="project-cards grid md:grid-cols-2 gap-4 mb-4">
          {featured.map((project, i) => {
            const s = statusStyle[project.status];
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="project-card group relative p-5 sm:p-6 rounded-2xl border border-edge-secondary bg-surface-overlay-large hover:border-edge-primary hover:bg-surface-overlay-small transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                    style={{
                      backgroundColor: s.bg,
                      color: s.color,
                      borderColor: s.border,
                    }}
                  >
                    {t(`status.${project.status}`)}
                  </span>
                  <span className="text-xs text-foreground-tertiary font-mono">
                    {project.year}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold mb-1 text-foreground-active group-hover:text-foreground-accent transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm font-medium mb-3 text-foreground-accent">
                  {t(`items.${project.id}.tagline`)}
                </p>
                <p className="text-sm text-foreground-secondary leading-relaxed mb-5">
                  {t(`items.${project.id}.description`)}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-md text-foreground-secondary bg-surface-primary-hover border border-edge-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="absolute bottom-0 left-5 right-5 sm:left-6 sm:right-6 h-px bg-brand-bold/0 group-hover:bg-brand-bold/40 rounded-full transition-all duration-300" />
              </motion.div>
            );
          })}
        </div>

        {/* Rest — compact */}
        {rest.length > 0 && (
          <div className="grid md:grid-cols-2 gap-3">
            {rest.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-start gap-4 p-4 rounded-xl border border-edge-secondary bg-surface-overlay-large hover:border-edge-primary hover:bg-surface-overlay-small transition-colors"
              >
                <div className="mt-1.5 size-1.5 rounded-full bg-brand-bold flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-foreground-active">
                      {project.name}
                    </h4>
                    <span className="text-xs text-foreground-tertiary font-mono">
                      {project.year}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {t(`items.${project.id}.tagline`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
