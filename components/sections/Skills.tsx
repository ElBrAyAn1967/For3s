"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  GitBranch,
  ListChecks,
  ScanSearch,
} from "lucide-react";
import { skills } from "@/lib/data";
import { useTheme } from "@/lib/useTheme";

export default function Skills() {
  const theme = useTheme();
  return theme === "dark" ? <SkillsDark /> : <SkillsLight />;
}

function SkillsLight() {
  const t = useTranslations("SkillsLight");
  const outputKeys = [
    "testCases",
    "acceptanceCriteria",
    "missingQuestions",
    "edgeCases",
    "traceability",
    "humanReview",
  ] as const;

  return (
    <section
      className="section-blend py-14 sm:py-20 lg:py-24 bg-surface-overlay-large overflow-hidden"
      style={{ ["--blend-from" as string]: "var(--surface-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-[minmax(0,0.78fr)_minmax(28rem,1.22fr)] gap-9 sm:gap-12 lg:gap-16 items-center"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent font-mono">
              {t("overline")}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold leading-tight text-foreground-active">
              {t("headline")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-foreground-secondary leading-relaxed max-w-2xl">
              {t("subheadline")}
            </p>
            <p className="mt-6 max-w-xl border-l border-brand-bold/30 pl-4 text-sm sm:text-base font-medium text-foreground-accent">
              {t("closing")}
            </p>
          </div>

          <div className="relative min-h-[35rem] sm:min-h-[31rem] lg:min-h-[34rem]">
            <div
              aria-hidden
              className="absolute inset-0 rounded-[2rem] border border-brand-bold/10"
            />
            <div className="absolute left-1/2 top-1/2 z-10 w-[15rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-edge-primary bg-surface-primary p-5 shadow-[0_18px_65px_rgba(0,0,0,0.08)] sm:w-[18rem] sm:p-6">
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-accent">
                {t("pack.label")}
              </p>
              <h3 className="mt-3 text-2xl sm:text-3xl font-semibold leading-tight text-foreground-active">
                {t("pack.title")}
              </h3>
              <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
                {t("pack.description")}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-primary-hover">
                <div className="h-full w-[78%] rounded-full bg-brand-bold" />
              </div>
              <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary">
                {t("pack.status")}
              </p>
            </div>

            {outputKeys.map((key, i) => (
              <OutputNode
                key={key}
                index={i}
                title={t(`outputs.${key}.title`)}
                description={t(`outputs.${key}.description`)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function OutputNode({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  const icons = [
    ListChecks,
    ClipboardCheck,
    FileQuestion,
    ScanSearch,
    GitBranch,
    CheckCircle2,
  ];
  const positions = [
    "left-0 top-0",
    "right-0 top-6",
    "left-2 top-[11.5rem] sm:left-0 sm:top-[13rem]",
    "right-2 top-[13.5rem] sm:right-0 sm:top-[15.5rem]",
    "left-0 bottom-8",
    "right-0 bottom-0",
  ];
  const Icon = icons[index] ?? CheckCircle2;

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.36 }}
      className={`absolute z-20 w-[12rem] rounded-xl border border-edge-secondary bg-surface-overlay-large p-3.5 shadow-[0_14px_42px_rgba(0,0,0,0.06)] sm:w-[13.5rem] sm:p-4 ${positions[index]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-bold/10 text-foreground-accent">
          <Icon className="size-4" />
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary">
          0{index + 1}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold leading-tight text-foreground-active">
        {title}
      </h3>
      <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-foreground-secondary leading-relaxed">
        {description}
      </p>
    </motion.article>
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
