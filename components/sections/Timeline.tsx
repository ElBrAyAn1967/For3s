"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Eye,
  Fingerprint,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { timelineYears } from "@/lib/data";
import { useTheme } from "@/lib/useTheme";

export default function Timeline() {
  const theme = useTheme();
  return theme === "dark" ? <TimelineDark /> : <TimelineLight />;
}

function TimelineLight() {
  const t = useTranslations("TimelineLight");
  const trustKeys = [
    "privateWorkspaces",
    "humanReview",
    "training",
    "traceability",
    "pilots",
  ] as const;

  return (
    <section
      id="timeline"
      className="section-blend py-14 sm:py-20 lg:py-24 bg-surface-primary overflow-hidden"
      style={{ ["--blend-from" as string]: "var(--surface-overlay-large)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(28rem,1.2fr)] gap-9 sm:gap-12 lg:gap-16 items-center"
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
              className="absolute inset-0 rounded-[2rem] border border-edge-secondary"
            />
            <div
              aria-hidden
              className="absolute left-1/2 top-10 bottom-10 w-px -translate-x-1/2 bg-edge-secondary"
            />
            <div
              aria-hidden
              className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-edge-secondary"
            />

            <div className="absolute left-1/2 top-1/2 z-10 w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-brand-bold/30 bg-surface-primary p-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.08)] sm:w-[16rem]">
              <span className="mx-auto inline-flex size-10 items-center justify-center rounded-xl bg-brand-bold/10 text-foreground-accent">
                <ShieldCheck className="size-5" />
              </span>
              <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary">
                {t("model.label")}
              </p>
              <h3 className="mt-2 text-2xl font-semibold leading-tight text-foreground-active">
                {t("model.title")}
              </h3>
              <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
                {t("model.description")}
              </p>
            </div>

            {trustKeys.map((key, i) => (
              <TrustNode
                key={key}
                index={i}
                title={t(`trust.${key}.title`)}
                description={t(`trust.${key}.description`)}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-9 sm:mt-12 rounded-2xl border border-edge-secondary bg-surface-overlay-large p-5 sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-[0.55fr_1fr_auto] md:items-center">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-accent">
                {t("os.overline")}
              </p>
              <h3 className="mt-2 text-xl sm:text-2xl font-semibold leading-tight text-foreground-active">
                {t("os.title")}
              </h3>
            </div>
            <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed">
              {t("os.description")}
            </p>
            <p className="text-sm font-medium text-foreground-accent md:text-right">
              {t("os.closing")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustNode({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  const icons = [LockKeyhole, UserCheck, Fingerprint, GitBranch, Eye];
  const positions = [
    "left-0 top-0",
    "right-0 top-8",
    "left-0 top-[14rem] sm:top-[13rem]",
    "right-0 top-[16rem] sm:top-[15rem]",
    "left-1/2 bottom-0 -translate-x-1/2",
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
        <CheckCircle2 className="size-4 text-foreground-accent" />
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
