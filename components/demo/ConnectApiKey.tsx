"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import { KeyRound, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { isValidApiKeyFormat, apiKeyHint } from "@/lib/demo/apiKey";

/**
 * Botón "Conectar con For3s" + panel para pegar la API key del usuario.
 *
 * Vía LEGAL: el usuario trae su propia API key de console.anthropic.com (no
 * OAuth de suscripción de terceros, prohibido por Anthropic). Resuelve los dos
 * objetivos: (1) identidad y (2) credencial para usar For3s con su billing.
 *
 * Si `persist` es true (shell de General), la key se ENVÍA UNA VEZ al server
 * (/api/demo/general/apikey), que la cifra (AES-256-GCM) y la guarda ligada al
 * correo. Si es false, solo se valida en cliente y se reporta el hint (sin
 * persistir) — usado en flujos donde aún no hay sesión por correo.
 */
export default function ConnectApiKey({
  onConnected,
  persist = false,
  defaultOpen = false,
}: {
  onConnected: (hint: string) => void;
  persist?: boolean;
  defaultOpen?: boolean;
}) {
  const t = useTranslations("Demo.connect");
  const [open, setOpen] = useState(defaultOpen);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!isValidApiKeyFormat(value)) {
      setError(true);
      return;
    }
    setError(false);

    if (persist) {
      // Envía la key al server (que la cifra y guarda). Nunca vuelve al cliente.
      setSaving(true);
      const res = await fetch("/api/demo/general/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: value }),
      });
      setSaving(false);
      if (!res.ok) {
        setError(true);
        return;
      }
      const { hint } = (await res.json()) as { hint: string };
      onConnected(hint);
      setValue("");
      return;
    }

    onConnected(apiKeyHint(value));
    setValue(""); // no retenemos la key en estado más de lo necesario
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-pill btn-pill-primary"
      >
        <KeyRound className="size-4 mr-1.5" />
        {t("button")}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 sm:p-6 text-left"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-bold/10 border border-brand-bold/25">
          <KeyRound className="size-4 text-brand-bold" />
        </span>
        <h3 className="text-base font-semibold text-foreground-active">
          {t("title")}
        </h3>
      </div>

      <p className="mb-4 text-sm text-foreground-secondary leading-relaxed">
        {t("description")}
      </p>

      <input
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(false);
        }}
        placeholder="sk-ant-…"
        aria-label={t("placeholder")}
        aria-invalid={error}
        className={`w-full rounded-lg bg-surface-primary border px-4 py-3 text-sm font-mono text-foreground-active placeholder:text-foreground-tertiary outline-none transition-colors ${
          error ? "border-danger" : "border-edge-primary focus:border-brand-bold"
        }`}
      />

      {error && (
        <p className="mt-2 text-xs text-danger">{t("error")}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!value.trim() || saving}
        className="btn-pill btn-pill-primary w-full mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? t("saving") : t("submit")}
        {!saving && <ArrowRight className="size-4 ml-1.5" />}
      </button>

      <div className="mt-4 flex items-start gap-2 text-[11px] text-foreground-tertiary leading-relaxed">
        <CheckCircle2 className="size-3.5 mt-0.5 text-brand-bold flex-shrink-0" />
        <span>{t("reassurance")}</span>
      </div>

      <a
        href="https://console.anthropic.com/settings/keys"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-foreground-accent hover:underline"
      >
        {t("getKey")}
        <ExternalLink className="size-3" />
      </a>
    </motion.div>
  );
}
