"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("Hero");
  const sectionRef = useRef<HTMLElement>(null);
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="hero-spotlight min-h-[100svh] flex items-center pt-16 relative overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div
        aria-hidden
        className="hero-spotlight-glow absolute inset-0 pointer-events-none"
        style={{ opacity: hovering ? 1 : 0 }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-5 sm:mb-6 text-c-brand-70"
          >
            {t("overline")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-[clamp(2.25rem,8vw,4.5rem)] sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mb-5 sm:mb-6 text-foreground-active"
          >
            <span className="block">{t("headline.line1")}</span>
            <span className="block text-c-brand-70">
              {t("headline.line2")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-foreground-secondary leading-relaxed mb-8 sm:mb-10 max-w-2xl"
          >
            {t("description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 pr-8 pointer-events-none"
        >
          <div className="w-32 h-px bg-c-brand-70/50 rounded-full" />
          <div className="w-20 h-px bg-c-brand-70/30 rounded-full ml-6" />
          <div className="w-28 h-px bg-c-brand-70/15 rounded-full ml-2" />
        </motion.div>
      </div>
    </section>
  );
}
