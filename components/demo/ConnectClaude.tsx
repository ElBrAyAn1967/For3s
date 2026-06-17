"use client";

import { useCallback, useState } from "react";
import { m as motion } from "framer-motion";
import { CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DemoKind } from "@/lib/demo/types";

/**
 * ⚠️ SOLO PRUEBAS INTERNAS — NO LEGAL EN PRODUCCIÓN. Ver lib/demo/oauthGuard.ts.
 *
 * Botón "Vincular con Claude" — OAuth de suscripción (Pro/Max/Team), scope
 * solo `user:inference` (sin crear API key, sin cobro por tokens).
 *
 * Flujo "pegar código" (el único que funciona con el client_id de Claude Code,
 * cuyo redirect_uri está fijo a Anthropic):
 *   1. Pide la authorize URL a /api/demo/oauth/start
 *   2. Abre el login de Claude en otra pestaña → el usuario elige suscripción
 *   3. Anthropic muestra un código → el usuario lo pega aquí
 *   4. /api/demo/oauth/exchange lo cambia por el token (server-side)
 *
 * Solo se monta en demos 1:1 (jazz/mashe/brian).
 */
type Status = "idle" | "awaitingCode" | "exchanging" | "connected" | "error";

export default function ConnectClaude({
  kind,
  onConnected,
}: {
  kind: DemoKind;
  onConnected: (hint: string) => void;
}) {
  const t = useTranslations("Demo.claude");
  const [status, setStatus] = useState<Status>("idle");
  const [code, setCode] = useState("");

  const start = useCallback(async () => {
    setStatus("awaitingCode");
    const res = await fetch("/api/demo/oauth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const { authorizeUrl } = (await res.json()) as { authorizeUrl: string };
    window.open(authorizeUrl, "_blank", "noopener,noreferrer");
  }, [kind]);

  const submitCode = useCallback(async () => {
    if (!code.trim()) return;
    setStatus("exchanging");
    const res = await fetch("/api/demo/oauth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = (await res.json()) as { status?: string; hint?: string };
    if (res.ok && data.status === "connected") {
      setStatus("connected");
      onConnected(data.hint ?? "");
      setCode("");
    } else {
      setStatus("error");
    }
  }, [code, onConnected]);

  if (status === "connected") {
    return (
      <p className="inline-flex items-center gap-2 rounded-full border border-brand-bold/30 bg-brand-bold/10 px-4 py-2 text-sm text-foreground-accent">
        <CheckCircle2 className="size-4" />
        {t("connected")}
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-6 sm:p-8 text-center"
    >
      <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
        {t("description")}
      </p>

      {status === "idle" ? (
        <button
          type="button"
          onClick={start}
          className="btn-pill btn-pill-primary w-full"
        >
          {t("button")}
          <ExternalLink className="size-4 ml-1.5" />
        </button>
      ) : (
        <>
          <p className="text-xs text-foreground-tertiary leading-relaxed mb-3 text-left">
            {t("pasteInstructions")}
          </p>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status === "error") setStatus("awaitingCode");
            }}
            placeholder={t("pastePlaceholder")}
            aria-label={t("pastePlaceholder")}
            className={`w-full rounded-lg bg-surface-primary border px-4 py-3 text-sm font-mono text-foreground-active placeholder:text-foreground-tertiary outline-none transition-colors ${
              status === "error"
                ? "border-danger"
                : "border-edge-primary focus:border-brand-bold"
            }`}
          />
          <button
            type="button"
            onClick={submitCode}
            disabled={!code.trim() || status === "exchanging"}
            className="btn-pill btn-pill-primary w-full mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "exchanging" ? t("exchanging") : t("confirm")}
            {status !== "exchanging" && <ArrowRight className="size-4 ml-1.5" />}
          </button>
          <button
            type="button"
            onClick={start}
            className="block w-full text-center text-xs text-foreground-tertiary hover:text-foreground-active transition-colors py-2 mt-1"
          >
            {t("reopen")}
          </button>
        </>
      )}

      {status === "error" && (
        <p className="mt-3 text-xs text-danger">{t("error")}</p>
      )}
    </motion.div>
  );
}
