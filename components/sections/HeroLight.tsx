"use client";

import { m as motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, CircleDot, FileText, GitBranch } from "lucide-react";

const outputKeys = [
  "testCases",
  "acceptanceCriteria",
  "missingQuestions",
  "edgeCases",
] as const;
const sourceKeys = ["ticket", "docs", "chat"] as const;

/**
 * HeroLight: B2B light surface for For3s QA. It keeps the commercial copy
 * readable first, then adds a product preview only when the viewport can
 * support it without forcing horizontal or cramped scrolling.
 */
export default function HeroLight() {
  const t = useTranslations("Hero");

  return (
    <section className="min-h-[100svh] flex items-start lg:items-center pt-16 relative overflow-hidden bg-surface-primary">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--pattern-grid-fg) 1px, transparent 1px), linear-gradient(90deg, var(--pattern-grid-fg) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="absolute right-[-12rem] top-20 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--brand-bold) 18%, transparent) 0%, transparent 68%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-7 xl:py-10 2xl:py-14 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid lg:grid-cols-[minmax(0,0.84fr)_minmax(25rem,1.16fr)] xl:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] 2xl:grid-cols-[minmax(0,0.94fr)_minmax(30rem,1.06fr)] gap-7 sm:gap-8 lg:gap-8 xl:gap-10 2xl:gap-14 items-center"
        >
          <div className="max-w-4xl lg:max-w-none">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-3 sm:mb-4 text-foreground-accent font-mono">
              {t("overline")}
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl 2xl:text-7xl font-semibold leading-[1.05] tracking-tight mb-4 sm:mb-5 text-foreground-active">
              <span className="block">{t("headline.line1")}</span>
              <span className="block text-foreground-accent">
                {t("headline.line2")}
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-base xl:text-lg 2xl:text-xl text-foreground-secondary leading-relaxed mb-6 lg:mb-5 xl:mb-6 2xl:mb-7 max-w-2xl">
              {t("description")}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
              className="flex flex-col sm:flex-row flex-wrap gap-3"
            >
              <Link
                href="/demo"
                className="btn-pill btn-pill-primary w-full sm:w-auto"
              >
                {t("cta.primary")}
              </Link>
              <Link
                href="#projects"
                className="btn-pill btn-pill-secondary w-full sm:w-auto"
              >
                {t("cta.secondary")}
              </Link>
            </motion.div>

            <HeroQaPreview compact className="mt-7 sm:mt-8 lg:hidden" />
          </div>

          <HeroQaPreview compact className="hidden lg:block" />
        </motion.div>
      </div>
    </section>
  );
}

function HeroQaPreview({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const preview = useTranslations("Hero.productPreview");
  const outputs = useTranslations("SkillsLight.outputs");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.12, duration: 0.55, ease: "easeOut" }}
      className={`relative min-w-0 ${className}`}
      aria-hidden="true"
    >
      {!compact && (
        <div className="absolute -inset-6 rounded-[2rem] border border-brand-bold/10" />
      )}
      <div className="relative max-w-full rounded-2xl border border-edge-primary bg-surface-overlay-large shadow-[0_18px_60px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-edge-secondary px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="size-2 rounded-full bg-brand-bold flex-shrink-0" />
            <span className="truncate text-[10px] font-mono uppercase tracking-[0.18em] text-foreground-accent">
              For3s QA
            </span>
          </div>
          <span className="shrink-0 rounded-full border border-brand-bold/20 bg-brand-bold/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground-accent">
            {preview("status")}
          </span>
        </div>

        <div
          className={
            compact
              ? "grid gap-0 sm:grid-cols-[0.85fr_1.15fr]"
              : "grid grid-cols-[0.95fr_1.05fr]"
          }
        >
          <div
            className={
              compact
                ? "border-b border-edge-secondary p-4 sm:border-b-0 sm:border-r sm:p-5"
                : "border-r border-edge-secondary p-5"
            }
          >
            <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary">
              <FileText className="size-3.5 text-foreground-accent" />
              {preview("contextLabel")}
            </div>
            <div className={compact ? "grid gap-2" : "space-y-3"}>
              {sourceKeys.map((key) => (
                <div
                  key={key}
                  className="rounded-lg border border-edge-secondary bg-surface-primary px-3.5 py-2.5"
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary">
                    {preview(`sources.${key}.label`)}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground-active">
                    {preview(`sources.${key}.value`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={compact ? "p-4 sm:p-5" : "p-5"}>
            <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary">
              <GitBranch className="size-3.5 text-foreground-accent" />
              {preview("packLabel")}
            </div>
            <ul className={compact ? "grid gap-2" : "space-y-3"}>
              {outputKeys.map((key, i) => (
                <li
                  key={key}
                  className="flex items-start gap-3 rounded-lg border border-edge-secondary bg-surface-primary px-3.5 py-2.5 sm:py-3"
                >
                  <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-brand-bold/10 text-foreground-accent flex-shrink-0">
                    {i < 2 ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <CircleDot className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground-active">
                      {outputs(`${key}.title`)}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-surface-primary-hover overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-bold"
                        style={{ width: `${82 - i * 12}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-edge-secondary bg-surface-primary px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span>{preview("review")}</span>
            <span className="text-foreground-accent">
              {preview("traceability")}
            </span>
          </div>
        </div>
              </div>
    </motion.div>
  );
}
