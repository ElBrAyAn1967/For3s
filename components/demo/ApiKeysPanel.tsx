"use client";

import { useEffect, useState } from "react";
import { KeyRound, Copy, Check, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Apartado "Mis API keys" (Pieza D, 2026-07-20). El usuario genera sus propias
 * keys f3k_ para consumir SU For3s por API (integrarlo en su código, como NavigoX).
 * Pone un nombre → se genera (tope 3) → se muestra la key plana UNA vez → revocable.
 */
interface MiKey {
  id: string;
  nombre: string;
  estado: string;
  creada: string;
  ultimo_uso: string | null;
}

export default function ApiKeysPanel() {
  const t = useTranslations("Demo.shell.apikeys");
  const [keys, setKeys] = useState<MiKey[] | null>(null);
  const [activas, setActivas] = useState(0);
  const [tope, setTope] = useState(3);
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nuevaKey, setNuevaKey] = useState<string | null>(null); // plana, 1 vez
  const [copiada, setCopiada] = useState(false);

  async function cargar() {
    try {
      const res = await fetch("/api/demo/general/keys");
      if (!res.ok) {
        setKeys([]);
        return;
      }
      const d = (await res.json()) as { keys: MiKey[]; activas: number; tope: number };
      // solo las activas se listan (las revocadas no importan al usuario)
      setKeys(d.keys.filter((k) => k.estado === "activo"));
      setActivas(d.activas);
      setTope(d.tope);
    } catch {
      setKeys([]);
    }
  }

  // Carga inicial (async → el setState ocurre TRAS el await, no en el cuerpo del
  // effect: evita el cascading-render de React 19). Flag para no tocar estado si
  // el panel se desmontó mientras el fetch estaba en vuelo.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/demo/general/keys");
        if (!alive) return;
        if (!res.ok) {
          setKeys([]);
          return;
        }
        const d = (await res.json()) as { keys: MiKey[]; activas: number; tope: number };
        if (!alive) return;
        setKeys(d.keys.filter((k) => k.estado === "activo"));
        setActivas(d.activas);
        setTope(d.tope);
      } catch {
        if (alive) setKeys([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function generar() {
    const n = nombre.trim();
    if (!n || busy) return;
    setBusy(true);
    setError("");
    setNuevaKey(null);
    try {
      const res = await fetch("/api/demo/general/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: n }),
      });
      const d = (await res.json().catch(() => ({}))) as { key?: string; error?: string };
      if (res.status === 409) {
        setError(t("tope", { n: tope }));
        return;
      }
      if (!res.ok || !d.key) {
        setError(t("error"));
        return;
      }
      setNuevaKey(d.key); // mostrar UNA vez
      setNombre("");
      await cargar();
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  }

  async function revocar(id: string) {
    setBusy(true);
    try {
      await fetch("/api/demo/general/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await cargar();
    } finally {
      setBusy(false);
    }
  }

  function copiar() {
    if (!nuevaKey) return;
    void navigator.clipboard.writeText(nuevaKey);
    setCopiada(true);
    setTimeout(() => setCopiada(false), 2000);
  }

  const lleno = activas >= tope;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground-active mb-1">{t("title")}</h2>
      <p className="text-sm text-foreground-secondary mb-6">{t("subtitle")}</p>

      {/* Key recién generada: se muestra UNA vez */}
      {nuevaKey && (
        <div className="mb-6 rounded-xl border border-brand-bold/40 bg-brand-bold/5 p-4">
          <p className="text-xs font-medium text-foreground-accent mb-2">{t("copiaAhora")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-surface-primary border border-edge-secondary px-3 py-2 text-xs font-mono text-foreground-active">
              {nuevaKey}
            </code>
            <button
              type="button"
              onClick={copiar}
              className="flex-shrink-0 rounded-lg border border-edge-primary px-3 py-2 text-foreground-secondary hover:text-foreground-active transition-colors"
              aria-label={t("copiar")}
            >
              {copiada ? <Check className="size-4 text-brand-bold" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Generar */}
      <div className="mb-6 flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs text-foreground-tertiary mb-1.5">{t("nombreLabel")}</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generar()}
            placeholder={t("nombrePlaceholder")}
            disabled={busy || lleno}
            maxLength={60}
            className="w-full rounded-lg border border-edge-primary bg-surface-primary px-3 py-2.5 text-sm text-foreground-active outline-none transition-colors focus:border-brand-bold disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={generar}
          disabled={busy || lleno || !nombre.trim()}
          className="btn-pill btn-pill-primary text-sm flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("generar")}
        </button>
      </div>
      {error && <p className="mb-4 text-xs text-danger">{error}</p>}
      <p className="mb-6 text-xs text-foreground-tertiary">
        {t("contador", { activas, tope })}
      </p>

      {/* Lista */}
      <div className="space-y-2">
        {keys === null && <p className="text-sm text-foreground-tertiary">{t("cargando")}</p>}
        {keys !== null && keys.length === 0 && (
          <p className="text-sm text-foreground-tertiary">{t("vacio")}</p>
        )}
        {(keys ?? []).map((k) => (
          <div
            key={k.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-edge-secondary bg-surface-overlay-large px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <KeyRound className="size-4 text-foreground-tertiary flex-shrink-0" />
              <span className="truncate text-sm text-foreground-active">{k.nombre}</span>
            </div>
            <button
              type="button"
              onClick={() => revocar(k.id)}
              disabled={busy}
              className="flex-shrink-0 text-foreground-tertiary hover:text-danger transition-colors disabled:opacity-50"
              aria-label={t("revocar")}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
