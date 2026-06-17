"use client";

import { m as motion } from "framer-motion";
import {
  Code2,
  Triangle,
  Clapperboard,
  PenTool,
  HardDrive,
  Monitor,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

// Conectores disponibles en esta fase (solo UI / placeholder).
// Al presionar "Conectar" aún no conectan de verdad — se cablean después,
// conector por conector.
const CONNECTORS: { key: string; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { key: "github", label: "GitHub", Icon: Code2 },
  { key: "vercel", label: "Vercel", Icon: Triangle },
  { key: "premiere", label: "Adobe Premiere", Icon: Clapperboard },
  { key: "illustrator", label: "Adobe Illustrator", Icon: PenTool },
  { key: "drive", label: "Google Drive", Icon: HardDrive },
  { key: "pc", label: "PC", Icon: Monitor },
  { key: "telegram", label: "Telegram", Icon: Send },
];

export default function ConnectorsPanel() {
  const t = useTranslations("Demo.shell.connectors");

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-foreground-active mb-1">
        {t("title")}
      </h2>
      <p className="text-sm text-foreground-secondary mb-6">{t("subtitle")}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {CONNECTORS.map(({ key, label, Icon }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: "easeOut" }}
            className="flex items-center justify-between gap-3 rounded-xl border border-edge-primary bg-surface-overlay-large px-4 py-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-surface-primary border border-edge-secondary flex-shrink-0">
                <Icon className="size-4 text-foreground-active" />
              </span>
              <span className="truncate text-sm font-medium text-foreground-active">
                {label}
              </span>
            </div>
            <button
              type="button"
              className="btn-pill btn-pill-accent text-xs flex-shrink-0"
            >
              {t("connect")}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}