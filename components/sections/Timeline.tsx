"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { timelineYears } from "@/lib/data";

export default function Timeline() {
  const t = useTranslations("Timeline");

  return (
    <section
      id="timeline"
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

        <div className="relative">
          <div className="absolute left-[10px] top-2 bottom-2 w-px bg-edge-secondary" />

          <div className="flex flex-col gap-8">
            {timelineYears.map((year, i) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative pl-8"
              >
                <div className="absolute left-0 top-1.5 size-[20px] rounded-full border-2 border-brand-bold bg-surface-primary flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-brand-bold" />
                </div>

                <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
                  <span className="text-xs sm:text-sm font-mono font-semibold mt-0.5 w-10 sm:w-12 flex-shrink-0 text-foreground-accent">
                    {year}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground-active mb-1">
                      {t(`items.${year}.title`)}
                    </h3>
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                      {t(`items.${year}.description`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
