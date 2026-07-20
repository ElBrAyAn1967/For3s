"use client";

import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import {
  Code2,
  Triangle,
  Clapperboard,
  PenTool,
  HardDrive,
  Monitor,
  Send,
  Palette,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

// Conectores. GitHub YA conecta de verdad (Pieza C, 2026-07-20): OAuth → token
// cifrado en el vault del usuario → su agente lo usa. Los demás siguen placeholder
// (se cablean con el mismo patrón, conector por conector).
const CONNECTORS: {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  live?: boolean;
}[] = [
  { key: "github", label: "GitHub", Icon: Code2, live: true },
  { key: "vercel", label: "Vercel", Icon: Triangle },
  { key: "premiere", label: "Adobe Premiere", Icon: Clapperboard },
  { key: "illustrator", label: "Adobe Illustrator", Icon: PenTool },
  { key: "canva", label: "Canva", Icon: Palette },
  { key: "drive", label: "Google Drive", Icon: HardDrive },
  { key: "pc", label: "PC", Icon: Monitor },
  { key: "telegram", label: "Telegram", Icon: Send },
];

export default function ConnectorsPanel() {
  const t = useTranslations("Demo.shell.connectors");
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  // Estado real del conector GitHub al montar (y tras volver del OAuth callback,
  // que redirige a /demo?github=connected → el shell remonta el panel).
  useEffect(() => {
    let alive = true;
    fetch("/api/demo/connectors/github")
      .then((r) => (r.ok ? r.json() : { connected: false }))
      .then((d: { connected?: boolean }) => {
        if (alive) setGithubConnected(!!d.connected);
      })
      .catch(() => alive && setGithubConnected(false));
    return () => {
      alive = false;
    };
  }, []);

  function conectarGithub() {
    // navegación completa al OAuth (no fetch: es un redirect a github.com).
    window.location.href = "/api/demo/connectors/github/start";
  }

  async function desconectarGithub() {
    setBusy(true);
    try {
      await fetch("/api/demo/connectors/github", { method: "DELETE" });
      setGithubConnected(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-foreground-active mb-1">
        {t("title")}
      </h2>
      <p className="text-sm text-foreground-secondary mb-6">{t("subtitle")}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {CONNECTORS.map(({ key, label, Icon, live }, i) => {
          const isGithub = key === "github";
          const connected = isGithub && githubConnected === true;
          return (
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

              {isGithub ? (
                connected ? (
                  <button
                    type="button"
                    onClick={desconectarGithub}
                    disabled={busy}
                    className="text-xs font-mono text-foreground-tertiary hover:text-danger transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    {t("disconnect")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={conectarGithub}
                    disabled={githubConnected === null}
                    className="btn-pill btn-pill-accent text-xs flex-shrink-0 disabled:opacity-50"
                  >
                    {t("connect")}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  disabled
                  title={t("soon")}
                  className="btn-pill btn-pill-accent text-xs flex-shrink-0 opacity-40 cursor-not-allowed"
                >
                  {t("connect")}
                </button>
              )}

              {isGithub && connected && (
                <span className="sr-only">{live ? "conectado" : ""}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
