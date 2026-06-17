"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import { UserPlus, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RegisterResult, DemoKind } from "@/lib/demo/types";

/**
 * Formulario de registro de la demo GENERAL: nombre + correo.
 * Al enviar, crea o continúa la sesión (el server normaliza a minúsculas).
 * Devuelve el resultado al padre (active | waiting) para decidir qué mostrar.
 */
export default function GeneralRegister({
  kind = "general",
  onRegistered,
}: {
  kind?: DemoKind;
  onRegistered: (
    result: RegisterResult,
    who: { name: string; email: string },
  ) => void;
}) {
  const t = useTranslations("Demo.register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // null = sin error; "invalid" = datos mal; "mismatch" = correo+otro nombre;
  // "denied" = correo no autorizado para esta demo 1:1.
  const [error, setError] = useState<null | "invalid" | "mismatch" | "denied">(
    null,
  );

  const submit = async () => {
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/demo/general/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, name, email }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      // name_mismatch → mensaje específico. not_found (correo no autorizado en
      // demo 1:1) → mensaje genérico de acceso (hermético, no revela el correo).
      if (data.error === "name_mismatch") setError("mismatch");
      else if (data.error === "not_found") setError("denied");
      else setError("invalid");
      setSubmitting(false);
      return;
    }
    const result = (await res.json()) as RegisterResult;
    // Pasamos los datos normalizados (igual que en BD) al shell.
    onRegistered(result, {
      name: name.trim().toLowerCase().replace(/\s+/g, " "),
      email: email.trim().toLowerCase(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-6 sm:p-8 text-left"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-bold/10 border border-brand-bold/25">
          <UserPlus className="size-4 text-brand-bold" />
        </span>
        <h3 className="text-base font-semibold text-foreground-active">
          {t("title")}
        </h3>
      </div>

      <p className="mb-5 text-sm text-foreground-secondary leading-relaxed">
        {t("description")}
      </p>

      <div className="space-y-3">
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("namePlaceholder")}
          aria-label={t("namePlaceholder")}
          className="w-full rounded-lg bg-surface-primary border border-edge-primary px-4 py-3 text-sm text-foreground-active placeholder:text-foreground-tertiary outline-none focus:border-brand-bold transition-colors"
        />
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("emailPlaceholder")}
          aria-label={t("emailPlaceholder")}
          className="w-full rounded-lg bg-surface-primary border border-edge-primary px-4 py-3 text-sm text-foreground-active placeholder:text-foreground-tertiary outline-none focus:border-brand-bold transition-colors"
        />
      </div>

      {error && (
        <p className="mt-2 text-xs text-danger">
          {error === "mismatch"
            ? t("mismatch")
            : error === "denied"
              ? t("denied")
              : t("error")}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting || !name.trim() || !email.trim()}
        className="btn-pill btn-pill-primary w-full mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {!submitting && <KeyRound className="size-4 mr-1.5" />}
        {submitting ? t("submitting") : t("submit")}
      </button>

      <p className="mt-4 text-[11px] text-foreground-tertiary text-center leading-relaxed">
        {t("disclaimer")}
      </p>
    </motion.div>
  );
}