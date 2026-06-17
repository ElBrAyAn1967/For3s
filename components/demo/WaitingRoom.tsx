"use client";

import { m as motion } from "framer-motion";
import { Users, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Sala de espera — solo aplica a General cuando hay 10 sesiones activas.
 * Muestra la posición del usuario en la cola. El padre (DemoExperience) hace
 * el polling de /api/demo/status y va actualizando `position`.
 */
export default function WaitingRoom({
  position,
  maxConcurrent,
}: {
  position: number;
  maxConcurrent: number;
}) {
  const t = useTranslations("Demo.waiting");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-6 sm:p-8 text-center"
    >
      <div className="inline-flex items-center justify-center size-12 rounded-full bg-brand-bold/10 border border-brand-bold/25 mb-5">
        <Clock className="size-5 text-brand-bold" />
      </div>

      <p className="text-[10px] font-mono font-semibold tracking-[0.18em] uppercase text-foreground-accent mb-3">
        {t("label")}
      </p>

      <h2 className="text-2xl font-semibold text-foreground-active mb-2">
        {t("title", { position })}
      </h2>

      <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
        {t("description")}
      </p>

      <div className="flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
        <Users className="size-3.5" />
        {t("capacity", { max: maxConcurrent })}
      </div>
    </motion.div>
  );
}
