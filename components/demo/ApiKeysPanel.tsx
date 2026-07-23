"use client";

import { useEffect, useState } from "react";
import { KeyRound, Copy, Check, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MiKey, UsoPunto } from "@/lib/demo/for3sChat";

/**
 * Apartado "Mis API keys" (Pieza D, 2026-07-20). El usuario genera sus propias
 * keys f3k_ para consumir SU For3s por API (integrarlo en su código, como NavigoX).
 * Pone un nombre → se genera (tope 3) → se muestra la key plana UNA vez → revocable.
 *
 * Uso real por key (2026-07-22): cada key muestra un sparkline de llamadas por
 * día (línea que sube/baja, estilo GitHub) + totales (llamadas · tokens · $ de tu
 * cupo). El dato viene del canal (api_consumo). Ver lib/demo/for3sChat.ts.
 */

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

  // Formatea el costo: centavos con más decimales para que no se vea $0.00.
  const fmtCosto = (n: number) =>
    n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;

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
        {(keys ?? []).map((k) => {
          const llamadas = k.total_llamadas ?? 0;
          const tokens = k.total_tokens ?? 0;
          const costo = k.costo_usd ?? 0;
          return (
            <div
              key={k.id}
              className="rounded-lg border border-edge-secondary bg-surface-overlay-large px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
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

              {/* Uso: sparkline (llamadas/día, sube y baja) + totales debajo. */}
              <div className="mt-3">
                <Sparkline serie={k.serie ?? []} />
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-foreground-tertiary">
                  <span>
                    <span className="text-foreground-secondary">{llamadas.toLocaleString()}</span> llamadas
                  </span>
                  <span>
                    <span className="text-foreground-secondary">{tokens.toLocaleString()}</span> tokens
                  </span>
                  <span title="Solo lo que salió de tu cupo (no BYOK)">
                    <span className="text-foreground-secondary">{fmtCosto(costo)}</span> de tu cupo
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Sparkline de uso: línea de llamadas por día que sube y baja (estilo GitHub).
 * Sin ejes ni etiquetas — es un pulso visual, no un gráfico completo. Rellena los
 * días sin llamadas con 0 para que la línea sea continua (no salte huecos). Si no
 * hay uso todavía, muestra una guía plana tenue con "sin uso aún".
 */
function Sparkline({ serie }: { serie: UsoPunto[] }) {
  const W = 260;
  const H = 34;
  const P = 2;

  if (serie.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[260px]" role="img" aria-label="Sin uso">
          <line
            x1={P}
            y1={H / 2}
            x2={W - P}
            y2={H / 2}
            className="stroke-edge-secondary"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        </svg>
        <span className="text-[10px] font-mono text-foreground-tertiary whitespace-nowrap">sin uso aún</span>
      </div>
    );
  }

  // Rellena el rango de fechas (primer→último día) con 0 donde no hubo llamadas,
  // para que la línea represente el tiempo real, no solo los días con actividad.
  const porFecha = new Map(serie.map((p) => [p.fecha, p.llamadas]));
  const dias: number[] = [];
  const d0 = new Date(serie[0].fecha + "T00:00:00Z");
  const dN = new Date(serie[serie.length - 1].fecha + "T00:00:00Z");
  for (let d = new Date(d0); d <= dN; d.setUTCDate(d.getUTCDate() + 1)) {
    dias.push(porFecha.get(d.toISOString().slice(0, 10)) ?? 0);
  }
  // Un solo día → duplica el punto para que se vea una línea, no un vacío.
  const vals = dias.length === 1 ? [dias[0], dias[0]] : dias;
  const max = Math.max(1, ...vals);
  const paso = vals.length > 1 ? (W - P * 2) / (vals.length - 1) : 0;
  const pts = vals.map((v, i) => {
    const x = P + i * paso;
    const y = H - P - (v / max) * (H - P * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[260px]" role="img" aria-label="Uso por día">
      <polyline
        points={pts.join(" ")}
        fill="none"
        className="stroke-brand-bold"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
