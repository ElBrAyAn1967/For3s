"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { skills } from "@/lib/data";
import { useTheme } from "@/lib/useTheme";

export default function Skills() {
  const theme = useTheme();
  return theme === "dark" ? <SkillsDark /> : <SkillsLight />;
}

function SkillsLight() {
  const t = useTranslations("SkillsLight");
  const outputKeys = ["testCases", "acceptanceCriteria", "missingQuestions", "edgeCases"] as const;

  return (
    <section
      className="section-blend py-14 sm:py-20 bg-surface-overlay-large"
      style={{ ["--blend-from" as string]: "var(--surface-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-10"
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {outputKeys.map((key, i) => (
            <motion.article
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="rounded-xl border border-edge-secondary bg-surface-primary p-5 hover:border-edge-primary hover:bg-surface-primary-hover transition-colors"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-foreground-accent">
                0{i + 1}
              </span>
              <h3 className="mt-4 mb-2 text-base sm:text-lg font-semibold text-foreground-active">
                {t(`outputs.${key}.title`)}
              </h3>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {t(`outputs.${key}.description`)}
              </p>
            </motion.article>
          ))}
        </div>

        <p className="mt-6 text-sm text-foreground-secondary leading-relaxed max-w-3xl">
          {t("closing")}
        </p>
      </div>
    </section>
  );
}

function SkillsDark() {
  const t = useTranslations("Skills");
  const doubled = [...skills, ...skills];

  return (
    <section
      className="section-blend py-14 sm:py-20 overflow-hidden bg-surface-overlay-large"
      style={{ ["--blend-from" as string]: "var(--surface-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent font-mono">
            {t("overline")}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground-active">
            {t("headline")}
          </h2>
        </motion.div>
      </div>

      <div className="relative flex overflow-hidden">
        <div className="flex animate-marquee gap-3 whitespace-nowrap">
          {doubled.map((skill, i) => (
            // Marquee duplicates the list; the position-index half is part
            // of the identity, so compound `${skill}-${i}` is intentional.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <span
              key={`${skill}-${i}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-edge-secondary bg-surface-primary-hover text-sm font-medium text-foreground-primary flex-shrink-0 hover:border-brand-bold/40 transition-colors cursor-default"
            >
              <span className="size-1 rounded-full bg-brand-bold" />
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
