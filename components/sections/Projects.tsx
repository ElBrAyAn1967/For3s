"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { projects, type ProjectStatus } from "@/lib/data";

const statusStyle: Record<
  ProjectStatus,
  { bg: string; color: string; border: string }
> = {
  activo: {
    bg: "color-mix(in oklab, oklch(0.78 0.18 150) 12%, transparent)",
    color: "oklch(0.82 0.15 150)",
    border: "color-mix(in oklab, oklch(0.78 0.18 150) 28%, transparent)",
  },
  desarrollo: {
    bg: "color-mix(in oklab, oklch(0.7 0.16 250) 12%, transparent)",
    color: "oklch(0.78 0.13 250)",
    border: "color-mix(in oklab, oklch(0.7 0.16 250) 28%, transparent)",
  },
  pausado: {
    bg: "rgba(255,255,255,0.04)",
    color: "var(--foreground-tertiary)",
    border: "rgba(255,255,255,0.08)",
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
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-c-brand-70">
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

                <h3 className="text-lg sm:text-xl font-semibold mb-1 text-foreground-active group-hover:text-c-brand-70 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm font-medium mb-3 text-c-brand-70">
                  {t(`items.${project.id}.tagline`)}
                </p>
                <p className="text-sm text-foreground-secondary leading-relaxed mb-5">
                  {t(`items.${project.id}.description`)}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-md text-foreground-secondary"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--edge-secondary)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="absolute bottom-0 left-5 right-5 sm:left-6 sm:right-6 h-px bg-c-brand-70/0 group-hover:bg-c-brand-70/40 rounded-full transition-all duration-300" />
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
                <div className="mt-1.5 size-1.5 rounded-full bg-c-brand-70 flex-shrink-0" />
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
