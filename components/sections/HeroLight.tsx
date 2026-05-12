"use client";

import { m as motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * HeroLight — modo B2B institucional (verde). Patrón editorial puro:
 * overline tipográfico, headline grande, lead, dos CTAs. Sin elementos
 * técnicos (no badge, no install block) — la audiencia es comité de
 * decisión, no developer.
 */
export default function HeroLight() {
  const t = useTranslations("Hero");

  return (
    <section className="min-h-[100svh] flex items-center pt-16 relative overflow-hidden">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-5 sm:mb-6 text-foreground-accent font-mono">
            {t("overline")}
          </p>

          <h1 className="text-[clamp(2.25rem,8vw,4.5rem)] sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mb-5 sm:mb-6 text-foreground-active">
            <span className="block">{t("headline.line1")}</span>
            <span className="block text-foreground-accent">
              {t("headline.line2")}
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-foreground-secondary leading-relaxed mb-8 sm:mb-10 max-w-2xl">
            {t("description")}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row flex-wrap gap-3"
          >
            <Link
              href="#projects"
              className="btn-pill btn-pill-primary w-full sm:w-auto"
            >
              {t("cta.primary")}
            </Link>
            <Link
              href="#contact"
              className="btn-pill btn-pill-secondary w-full sm:w-auto"
            >
              {t("cta.secondary")}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
