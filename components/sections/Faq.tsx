"use client";

import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { FAQ_ITEM_KEYS } from "@/lib/faq";

const ITEM_KEYS = FAQ_ITEM_KEYS;

/**
 * Faq section — editorial accordion, no card grid. Each item expands inline
 * with a 200ms ease-out, only one open at a time. The same item keys are
 * consumed by the FAQPage JSON-LD schema emitted from the landing page so
 * Google can mirror this content into rich results.
 */
export default function Faq() {
  const t = useTranslations("Faq");
  const [open, setOpen] = useState<string | null>(ITEM_KEYS[0]);

  return (
    <section id="faq" className="relative py-24 sm:py-32 section-blend">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12 sm:mb-16"
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-5 text-foreground-accent font-mono">
            {t("overline")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.1] tracking-tight text-foreground-active mb-4 max-w-2xl">
            {t("headline.prefix")}{" "}
            <span className="text-foreground-accent">{t("headline.accent")}</span>
          </h2>
          <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed max-w-2xl">
            {t("description")}
          </p>
        </motion.div>

        <ul className="divide-y divide-edge-secondary border-y border-edge-secondary">
          {ITEM_KEYS.map((key) => {
            const isOpen = open === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setOpen((cur) => (cur === key ? null : key))}
                  aria-expanded={isOpen}
                  className="w-full flex items-start justify-between gap-6 py-6 sm:py-7 text-left group"
                >
                  <span className="text-lg sm:text-xl font-medium text-foreground-active group-hover:text-brand-bold transition-colors">
                    {t(`items.${key}.question`)}
                  </span>
                  <span
                    className={`mt-1 shrink-0 size-7 inline-flex items-center justify-center rounded-full border border-edge-primary text-foreground-secondary group-hover:text-brand-bold group-hover:border-brand-bold transition-all ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  >
                    <Plus className="size-3.5" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 sm:pb-7 pr-12 text-base text-foreground-secondary leading-relaxed max-w-3xl">
                        {t(`items.${key}.answer`)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

