"use client";

import { m as motion } from "framer-motion";
import { MailCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Pantalla especial para el usuario #11+ de la demo General: está en lista de
 * espera. Mensaje clave (requisito de Brian): "Te llegará una notificación a tu
 * correo cuando la plataforma tenga cupos disponibles."
 */
export default function GeneralWaitlist({
  position,
  maxConcurrent,
}: {
  position: number | null;
  maxConcurrent: number;
}) {
  const t = useTranslations("Demo.waitlist");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-6 sm:p-8 text-center"
    >
      <div className="inline-flex items-center justify-center size-12 rounded-full bg-brand-bold/10 border border-brand-bold/25 mb-5">
        <MailCheck className="size-5 text-brand-bold" />
      </div>

      <p className="text-[10px] font-mono font-semibold tracking-[0.18em] uppercase text-foreground-accent mb-3">
        {t("label")}
      </p>

      <h2 className="text-2xl font-semibold text-foreground-active mb-3">
        {t("title")}
      </h2>

      <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
        {t("description")}
      </p>

      <div className="flex flex-col gap-2 text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
        <span className="inline-flex items-center justify-center gap-2">
          <Users className="size-3.5" />
          {t("capacity", { max: maxConcurrent })}
        </span>
        {position != null && <span>{t("position", { position })}</span>}
      </div>
    </motion.div>
  );
}