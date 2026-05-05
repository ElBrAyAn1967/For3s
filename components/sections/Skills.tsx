"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { skills } from "@/lib/data";

export default function Skills() {
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
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-c-brand-70">
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
            <span
              key={i}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-edge-secondary text-sm font-medium text-foreground-primary flex-shrink-0 hover:border-c-brand-70/40 transition-colors cursor-default"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              <span className="w-1 h-1 rounded-full bg-c-brand-70" />
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
