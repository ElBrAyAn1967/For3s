"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { timelineYears } from "@/lib/data";
import { useTheme } from "@/lib/useTheme";

export default function Timeline() {
  const theme = useTheme();
  return theme === "dark" ? <TimelineDark /> : <TimelineLight />;
}

function TimelineLight() {
  const t = useTranslations("TimelineLight");
  const trustKeys = ["privateWorkspaces", "humanReview", "training", "traceability", "pilots"] as const;

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
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent font-mono">
            {t("overline")}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground-active">
            {t("headline")}
          </h2>
          <p className="mt-3 text-foreground-secondary max-w-2xl">
            {t("subheadline")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_0.95fr] gap-6 lg:gap-8">
          <div className="rounded-xl border border-edge-secondary bg-surface-overlay-large p-5 sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary mb-5">
              {t("trustLabel")}
            </p>
            <ul className="divide-y divide-edge-secondary border-y border-edge-secondary">
              {trustKeys.map((key, i) => (
                <motion.li
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="py-4 flex items-start gap-3"
                >
                  <span className="mt-2 size-1.5 rounded-full bg-brand-bold flex-shrink-0" />
                  <span className="text-sm sm:text-base text-foreground-secondary leading-relaxed">
                    {t(`trust.${key}`)}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-xl border border-edge-secondary bg-surface-overlay-large p-5 sm:p-6 md:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-accent font-mono mb-4">
              {t("os.overline")}
            </p>
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground-active leading-tight mb-4">
              {t("os.title")}
            </h3>
            <p className="text-foreground-secondary leading-relaxed mb-4">
              {t("os.description")}
            </p>
            <p className="text-sm font-medium text-foreground-accent">
              {t("os.closing")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TimelineDark() {
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

        <div className="relative">
          {/* Vertical line centered on the 20px dots: (20 - 1) / 2 ≈ 10px */}
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
