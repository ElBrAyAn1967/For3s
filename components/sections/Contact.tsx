"use client";

import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { siteConfig } from "@/lib/data";

export default function Contact() {
  const t = useTranslations("Contact");

  return (
    <section
      id="contact"
      className="section-blend py-16 sm:py-24 bg-surface-overlay-large"
      style={{ ["--blend-from" as string]: "var(--surface-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-5 sm:mb-6 text-c-brand-70">
            {t("overline")}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold mb-4 text-foreground-active">
            {t("headline.prefix")}{" "}
            <span className="text-c-brand-70">{t("headline.accent")}</span>
          </h2>
          <p className="text-foreground-secondary mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`mailto:${siteConfig.email}`}
              className="btn-pill btn-pill-primary w-full sm:w-auto"
            >
              {siteConfig.email}
            </a>
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill-secondary w-full sm:w-auto"
            >
              {t("githubCta")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
