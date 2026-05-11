"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { collaboratorIds } from "@/lib/data";

export default function About() {
  const t = useTranslations("About");

  return (
    <section
      id="about"
      className="section-blend py-16 sm:py-24 bg-surface-overlay-large"
      style={{ ["--blend-from" as string]: "var(--surface-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-10 md:gap-16 items-start"
        >
          {/* Left */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent">
              {t("overline")}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-5 sm:mb-6 leading-tight text-foreground-active">
              {t("headline.prefix")}{" "}
              <span className="text-foreground-accent">{t("headline.accent")}</span>
            </h2>
            <p className="text-foreground-secondary leading-relaxed mb-4">
              {t.rich("p1", {
                strong: (chunks) => (
                  <strong className="text-foreground-active font-semibold">
                    {chunks}
                  </strong>
                ),
                em: (chunks) => <em>{chunks}</em>,
              })}
            </p>
            <p className="text-foreground-secondary leading-relaxed mb-8">
              {t("p2")}
            </p>

            {/* Collaborators */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary mb-3">
                {t("collaboratorsLabel")}
              </p>
              {collaboratorIds.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-edge-secondary bg-surface-primary hover:border-edge-primary hover:bg-surface-primary-hover transition-colors"
                >
                  <div className="mt-1.5 size-1.5 rounded-full bg-brand-bold flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm text-foreground-active">
                        {c.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium text-foreground-accent"
                        style={{
                          backgroundColor:
                            "color-mix(in oklab, var(--foreground-accent) 10%, transparent)",
                          border:
                            "1px solid color-mix(in oklab, var(--foreground-accent) 25%, transparent)",
                        }}
                      >
                        {t(`collaborators.${i}.role`)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary leading-relaxed">
                      {t(`collaborators.${i}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — values */}
          <div className="flex flex-col gap-3 mt-2 md:mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary mb-1">
              {t("valuesLabel")}
            </p>
            {(["infra", "comunidad", "latam"] as const).map((slug, i) => (
              <motion.div
                key={slug}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="flex items-start gap-4 p-5 rounded-xl border border-edge-secondary bg-surface-primary hover:border-edge-primary hover:bg-surface-primary-hover transition-colors"
              >
                <div className="mt-1.5 size-1.5 rounded-full bg-brand-bold flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground-active mb-1">
                    {t(`values.${i}.label`)}
                  </p>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {t(`values.${i}.desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
