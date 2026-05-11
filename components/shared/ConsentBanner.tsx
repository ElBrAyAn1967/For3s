"use client";

import { AnimatePresence, m as motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConsent } from "./ConsentContext";

/**
 * Cookie consent banner — pinned bottom-center, dismissible.
 * Only shows when consent === "pending" (not yet decided this device).
 * Theme-aware via tokens; works on both light/B2B and dark/B2C.
 */
export default function ConsentBanner() {
  const t = useTranslations("ConsentBanner");
  const { consent, grant, deny } = useConsent();

  return (
    <AnimatePresence>
      {consent === "pending" && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="consent-banner-title"
          aria-describedby="consent-banner-desc"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ zIndex: "var(--z-modal-overlay)" }}
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto sm:max-w-md"
        >
          <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large shadow-2xl p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="mt-0.5 inline-flex items-center justify-center size-8 rounded-lg bg-surface-primary-hover text-foreground-accent shrink-0">
                <Cookie className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  id="consent-banner-title"
                  className="text-sm font-semibold text-foreground-active mb-1"
                >
                  {t("title")}
                </p>
                <p
                  id="consent-banner-desc"
                  className="text-xs text-foreground-secondary leading-relaxed"
                >
                  {t("description")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                type="button"
                onClick={grant}
                className="btn-pill btn-pill-primary flex-1 sm:flex-initial"
              >
                {t("accept")}
              </button>
              <button
                type="button"
                onClick={deny}
                className="btn-pill btn-pill-secondary flex-1 sm:flex-initial"
              >
                {t("decline")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
