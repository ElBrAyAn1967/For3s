"use client";

import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import { UserPlus, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RegisterResult, DemoKind } from "@/lib/demo/types";

// Clave de localStorage para recordar el último acceso (por demo).
const lastKey = (kind: DemoKind) => `for3s_demo_last_${kind}`;

// Lee el último acceso guardado en el navegador (para pre-rellenar). Devuelve
// {name, email} o vacío. Se usa como inicializador de useState (lazy init),
// que corre solo en cliente al montar — sin setState en effects.
function readLast(kind: DemoKind): { name: string; email: string } {
  if (typeof window === "undefined") return { name: "", email: "" };
  try {
    const raw = window.localStorage.getItem(lastKey(kind));
    if (raw) {
      const s = JSON.parse(raw) as { name?: string; email?: string };
      return { name: s.name ?? "", email: s.email ?? "" };
    }
  } catch {
    // localStorage no disponible / JSON inválido
  }
  return { name: "", email: "" };
}

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
  // Arrancamos VACÍO para que el HTML del servidor y el del cliente coincidan
  // (evita hydration mismatch). El pre-relleno desde localStorage se aplica
  // tras montar, en el effect de abajo (solo cliente).
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ronda F0 Pieza 4: si el correo es dueño de una instancia (brian/jazz/mashe),
  // se intercala un paso de verificación por código antes de entrar. General no
  // pasa por aquí (paso === "form" siempre). "codigo" = esperando el código.
  const [paso, setPaso] = useState<"form" | "codigo">("form");
  const [duenoInst, setDuenoInst] = useState<string>(""); // instancia detectada
  const [codigo, setCodigo] = useState("");
  const [codigoError, setCodigoError] = useState("");
  const [reenviando, setReenviando] = useState(false);

  // Pre-rellena con el último acceso guardado, ya hidratado el componente.
  // queueMicrotask evita el setState síncrono dentro del cuerpo del effect.
  useEffect(() => {
    const last = readLast(kind);
    if (last.name || last.email) {
      queueMicrotask(() => {
        if (last.name) setName(last.name);
        if (last.email) setEmail(last.email);
      });
    }
  }, [kind]);
  // null = sin error; "invalid" = datos mal; "mismatch" = correo+otro nombre;
  // "denied" = correo no autorizado para esta demo 1:1.
  const [error, setError] = useState<null | "invalid" | "mismatch" | "denied">(
    null,
  );

  // Registra en general y avisa al padre (el flujo normal de siempre).
  const registrarYEntrar = async () => {
    const res = await fetch("/api/demo/general/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, name, email }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (data.error === "name_mismatch") setError("mismatch");
      else if (data.error === "not_found") setError("denied");
      else setError("invalid");
      setSubmitting(false);
      return;
    }
    const result = (await res.json()) as RegisterResult;
    const normName = name.trim().toLowerCase().replace(/\s+/g, " ");
    const normEmail = email.trim().toLowerCase();
    try {
      window.localStorage.setItem(lastKey(kind), JSON.stringify({ name: normName, email: normEmail }));
    } catch {
      /* localStorage no disponible → se ignora */
    }
    onRegistered(result, { name: normName, email: normEmail });
  };

  const submit = async () => {
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);

    // Ronda F0 Pieza 4: ¿este correo es dueño de una instancia? (solo en general).
    if (kind === "general") {
      try {
        const chk = await fetch("/api/demo/check-dueno", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const d = (await chk.json().catch(() => ({}))) as { dueno?: boolean; instancia?: string };
        if (d.dueno && d.instancia) {
          // Es dueño: registrar la sesión (para tener la cookie de correo) y
          // luego enviar el código. Al verificar, el chat irá a su instancia.
          await registrarYEntrar();
          await fetch("/api/demo/verify/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          setDuenoInst(d.instancia);
          setPaso("codigo");
          setSubmitting(false);
          return;
        }
      } catch {
        // Si la consulta falla, cae al flujo normal de general (no bloquea).
      }
    }

    // Flujo normal (general / 1:1 legado): registrar y entrar.
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
    const normName = name.trim().toLowerCase().replace(/\s+/g, " ");
    const normEmail = email.trim().toLowerCase();
    // Recuerda este acceso en el navegador para pre-rellenar la próxima vez.
    try {
      window.localStorage.setItem(
        lastKey(kind),
        JSON.stringify({ name: normName, email: normEmail }),
      );
    } catch {
      // localStorage no disponible → se ignora
    }
    onRegistered(result, { name: normName, email: normEmail });
  };

  // Pieza 4: valida el código que metió el dueño. Al acertar, entra a SU instancia
  // (el chat ya enruta ahí por la cookie que deja verify/check). Reusa el resultado
  // del registro que ya se hizo antes de mandar el código.
  const verificarCodigo = async () => {
    const c = codigo.trim();
    if (!/^\d{6}$/.test(c)) {
      setCodigoError("El código son 6 dígitos.");
      return;
    }
    setSubmitting(true);
    setCodigoError("");
    try {
      const res = await fetch("/api/demo/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo: c }),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) {
        setCodigoError(d.error ?? "Código no válido.");
        setSubmitting(false);
        return;
      }
      // Verificado: entrar (el chat ya va a su instancia por la cookie de dueño).
      const normName = name.trim().toLowerCase().replace(/\s+/g, " ");
      const normEmail = email.trim().toLowerCase();
      onRegistered(
        { status: "active", position: null, returning: true, activeCount: 1, maxConcurrent: 10, hasApiKey: false, apiKeyHint: null, agentOn: true },
        { name: normName, email: normEmail },
      );
    } catch {
      setCodigoError("No llegué al servidor. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  const reenviarCodigo = async () => {
    setReenviando(true);
    setCodigoError("");
    try {
      await fetch("/api/demo/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setReenviando(false);
    }
  };

  // Paso de CÓDIGO (solo dueños). Mismo card/estilo que el form, para que se sienta
  // parte del mismo flujo, no una pantalla ajena.
  if (paso === "codigo") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-6 sm:p-8 text-left"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-bold/10 border border-brand-bold/25">
            <KeyRound className="size-4 text-brand-bold" />
          </span>
          <h3 className="text-base font-semibold text-foreground-active">
            Verifica que eres tú
          </h3>
        </div>

        <p className="mb-5 text-sm text-foreground-secondary leading-relaxed">
          Este correo es el dueño de la instancia{" "}
          <span className="font-mono text-foreground-active">{duenoInst}</span>. Te enviamos
          un código de 6 dígitos a <span className="text-foreground-active">{email}</span>.
          Mételo para entrar a tu For3s.
        </p>

        <input
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
            if (codigoError) setCodigoError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && verificarCodigo()}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          aria-label="Código de verificación"
          className="w-full rounded-lg bg-surface-primary border border-edge-primary px-4 py-3 text-center text-lg font-mono tracking-[0.4em] text-foreground-active placeholder:text-foreground-tertiary placeholder:tracking-[0.4em] outline-none focus:border-brand-bold transition-colors"
        />

        {codigoError && <p className="mt-2 text-xs text-danger">{codigoError}</p>}

        <button
          type="button"
          onClick={verificarCodigo}
          disabled={submitting || codigo.length !== 6}
          className="btn-pill btn-pill-primary w-full mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Verificando…" : "Entrar a mi For3s"}
        </button>

        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-foreground-tertiary">
          <button
            type="button"
            onClick={reenviarCodigo}
            disabled={reenviando}
            className="hover:text-foreground-secondary transition-colors disabled:opacity-50"
          >
            {reenviando ? "Reenviando…" : "Reenviar código"}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => {
              setPaso("form");
              setCodigo("");
              setCodigoError("");
            }}
            className="hover:text-foreground-secondary transition-colors"
          >
            Usar otro correo
          </button>
        </div>
      </motion.div>
    );
  }

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
          id="demo-name"
          name="name"
          type="text"
          autoComplete="name"
          enterKeyHint="next"
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
          id="demo-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="go"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
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