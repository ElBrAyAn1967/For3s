"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { collaboratorIds } from "@/lib/data";
import { useTheme } from "@/lib/useTheme";

export default function About() {
  const theme = useTheme();
  return theme === "dark" ? <AboutDark /> : <AboutLight />;
}

function AboutLight() {
  const t = useTranslations("AboutLight");
  const fragmentKeys = ["ticket", "chat", "docs", "rules", "bug"] as const;
  const outputKeys = ["cases", "criteria", "gaps"] as const;

  return (
    <section
      id="about"
      className="section-blend py-14 sm:py-20 lg:py-24 bg-surface-overlay-large overflow-hidden"
      style={{ ["--blend-from" as string]: "var(--surface-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] gap-9 sm:gap-12 lg:gap-16 items-center"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent font-mono">
              {t("overline")}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold mb-5 leading-tight text-foreground-active">
              {t("headline.prefix")}{" "}
              <span className="text-foreground-accent">
                {t("headline.accent")}
              </span>
            </h2>
            <div className="max-w-2xl space-y-3 text-base sm:text-lg text-foreground-secondary leading-relaxed">
              <p>{t("fracture.problem")}</p>
              <p className="font-medium text-foreground-accent">
                {t("fracture.solution")}
              </p>
            </div>
            <p className="mt-6 max-w-xl border-l border-brand-bold/30 pl-4 text-sm sm:text-base font-medium text-foreground-active">
              {t("fracture.legend")}
            </p>
          </div>

          <div className="relative min-h-[23rem] sm:min-h-[27rem] lg:min-h-[30rem]">
            <div
              aria-hidden
              className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-edge-primary"
            />
            <div
              aria-hidden
              className="absolute left-1/2 top-8 bottom-8 w-px -translate-x-1/2 bg-edge-secondary"
            />

            <div className="absolute left-1/2 top-1/2 z-10 w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-brand-bold/30 bg-surface-primary px-4 py-4 text-center shadow-[0_18px_55px_rgba(0,0,0,0.08)] sm:w-[12.5rem] sm:px-5 sm:py-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary">
                {t("fracture.centerLabel")}
              </p>
              <p className="mt-2 text-xl sm:text-2xl font-semibold text-foreground-active">
                For3s QA
              </p>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-foreground-secondary">
                {t("fracture.centerText")}
              </p>
            </div>

            {fragmentKeys.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.38 }}
                className={`absolute min-w-[7.5rem] rounded-xl border border-edge-secondary bg-surface-primary px-3.5 py-3 shadow-[0_12px_38px_rgba(0,0,0,0.05)] sm:min-w-[8.5rem] sm:px-4 ${
                  i === 0
                    ? "left-0 top-0 rotate-[-4deg]"
                    : i === 1
                      ? "right-1 top-5 rotate-[3deg]"
                      : i === 2
                        ? "left-3 bottom-10 rotate-[2deg]"
                        : i === 3
                          ? "right-0 bottom-0 rotate-[-3deg]"
                          : "left-[31%] top-[72%] -translate-x-1/2 rotate-[-1deg]"
                }`}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary">
                  {t(`fracture.fragments.${key}.label`)}
                </p>
                <p className="mt-1 truncate text-sm sm:text-base font-semibold text-foreground-active">
                  {t(`fracture.fragments.${key}.value`)}
                </p>
              </motion.div>
            ))}

            <div className="absolute inset-x-0 bottom-[-0.75rem] z-20 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              {outputKeys.map((key) => (
                <div
                  key={key}
                  className="flex min-w-0 items-center gap-2 rounded-full border border-brand-bold/20 bg-brand-bold/10 px-3 py-2 text-sm font-medium text-foreground-accent"
                >
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span className="truncate">{t(`fracture.outputs.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AboutDark() {
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent font-mono">
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

            {/* Collaborators — editorial list (no individual cards) */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary mb-5">
                {t("collaboratorsLabel")}
              </p>
              <ul className="divide-y divide-edge-secondary border-t border-b border-edge-secondary">
                {collaboratorIds.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="py-4 flex flex-col gap-1"
                  >
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <span className="font-semibold text-base text-foreground-active">
                        {c.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-foreground-accent">
                        {t(`collaborators.${i}.role`)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-secondary leading-relaxed max-w-prose">
                      {t(`collaborators.${i}.description`)}
                    </p>
                  </motion.li>
                ))}
              </ul>
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
