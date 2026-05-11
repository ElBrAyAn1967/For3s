"use client";

import { m as motion } from "framer-motion";
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
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-foreground-accent">
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
