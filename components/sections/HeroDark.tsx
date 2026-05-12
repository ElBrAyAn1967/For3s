"use client";

import { m as motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import InstallBlock from "./InstallBlock";

/**
 * HeroDark — modo B2C builder (ámbar sobre obsidiana). Patrón estilo
 * Astro: composición centrada, badge clickeable arriba, headline +
 * lead técnico, y el install block como CTA primario. Sin los dos
 * botones del modo B2B — el copy-paste es el call to action.
 */
export default function HeroDark() {
  const t = useTranslations("Hero");

  return (
    <section className="min-h-[100svh] flex items-center justify-center pt-16 relative overflow-hidden">
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <Link
            href="/docs#que-es-for3s"
            className="inline-flex items-center gap-2 mb-8 sm:mb-10 pl-3 pr-3.5 py-1 rounded-full border border-edge-primary bg-surface-overlay-large/60 hover:bg-surface-overlay-large hover:border-brand-bold/40 transition-colors group"
          >
            <span className="px-2 py-0.5 rounded-full bg-brand-bold/15 text-brand-bold text-[10px] font-mono font-semibold tracking-wider">
              {t("badge.version")}
            </span>
            <span className="text-xs text-foreground-secondary font-mono group-hover:text-foreground-active transition-colors">
              {t("badge.label")}
            </span>
            <ArrowRight className="size-3 text-foreground-tertiary group-hover:text-brand-bold group-hover:translate-x-0.5 transition-all" />
          </Link>

          <h1 className="text-[clamp(2.5rem,8vw,5rem)] sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mb-6 sm:mb-8 text-foreground-active">
            <span className="block">{t("dark.headline.line1")}</span>
            <span className="block text-foreground-accent">
              {t("dark.headline.line2")}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed mb-10 sm:mb-12 max-w-xl">
            <span className="block">{t("dark.description.line1")}</span>
            <span className="block">{t("dark.description.line2")}</span>
          </p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
          >
            <InstallBlock />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
