"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Granularidad,
  type Latencias,
  type PuntoSerie,
  PanelError,
  getLatencias,
  getSeries,
} from "@/lib/for3sAdmin";

// Presets de temporalidad: cada uno define el rango (días) y el bucket.
const PRESETS: { id: string; label: string; dias: number; gran: Granularidad }[] = [
  { id: "24h", label: "24 horas", dias: 1, gran: "hora" },
  { id: "7d", label: "7 días", dias: 7, gran: "dia" },
  { id: "30d", label: "30 días", dias: 30, gran: "dia" },
  { id: "90d", label: "90 días", dias: 90, gran: "semana" },
];

// Etiqueta del eje según granularidad: hora→"14:00", día→"07-15", semana→"07-15".
function etiqueta(iso: string, gran: Granularidad): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(5, 10);
  if (gran === "hora") return `${String(d.getHours()).padStart(2, "0")}:00`;
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Resumen: KPIs (30 días) + serie diaria de llamadas + latencias.
 * Gráfica: 1 sola serie → barras en el verde de la marca, sin leyenda (el
 * título la nombra), tooltip por barra, texto SIEMPRE en tintas del sitio.
 */

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5">
      <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold text-foreground-active">{value}</p>
      {sub && <p className="text-xs text-foreground-tertiary mt-1">{sub}</p>}
    </div>
  );
}

/** Barras SVG de una serie (llamadas/día). Marcas delgadas, punta redondeada
 * anclada a la base, hueco de 2px, hover con tooltip. */
function BarrasSerie({ puntos, gran }: { puntos: PuntoSerie[]; gran: Granularidad }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 160;
  const PAD = 4;
  const max = Math.max(1, ...puntos.map((p) => p.llamadas));
  // Ancho de barra: ocupa casi todo su paso (separación mínima), con un tope alto
  // para que con POCOS puntos las barras no queden delgadas y desperdigadas
  // (Brian 2026-07-21: "las gráficas deberían estar más pegadas").
  const paso0 = (W - PAD * 2) / Math.max(puntos.length, 1);
  const bw = Math.max(4, Math.min(64, paso0 * 0.82));
  const paso = (W - PAD * 2) / Math.max(puntos.length, 1);
  // cuántas etiquetas del eje mostrar (no encimar): ~8 repartidas
  const cadaN = Math.max(1, Math.ceil(puntos.length / 8));

  if (puntos.length === 0) {
    return (
      <p className="text-sm text-foreground-tertiary py-8 text-center">
        Sin tráfico en el periodo — cuando la API reciba llamadas, aquí aparece la serie.
      </p>
    );
  }
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        className="w-full"
        role="img"
        aria-label="Llamadas a la API por día"
      >
        {puntos.map((p, i) => {
          const h = Math.max(2, (p.llamadas / max) * H);
          const x = PAD + i * paso + (paso - bw) / 2;
          return (
            <g key={p.dia}>
              {/* zona de hover más ancha que la barra (hit target) */}
              <rect
                x={PAD + i * paso}
                y={0}
                width={paso}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <rect
                x={x}
                y={H - h}
                width={bw}
                height={h}
                rx={4}
                className={hover === i ? "fill-brand-bold" : "fill-brand"}
                style={{ pointerEvents: "none" }}
              />
              {(i % cadaN === 0 || i === puntos.length - 1) && (
                <text
                  x={x + bw / 2}
                  y={H + 16}
                  textAnchor="middle"
                  className="fill-foreground-tertiary"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {etiqueta(p.dia, gran)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && puntos[hover] && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-lg border border-edge-primary bg-surface-overlay-large px-3 py-2 text-xs text-foreground-active shadow-sm pointer-events-none">
          <span className="font-mono text-foreground-tertiary">{etiqueta(puntos[hover].dia, gran)}</span>{" "}
          · {puntos[hover].llamadas} llamadas · {puntos[hover].tokens.toLocaleString()} tokens
          {puntos[hover].errores > 0 && (
            <span className="text-danger"> · {puntos[hover].errores} errores</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function SeccionResumen() {
  const [series, setSeries] = useState<PuntoSerie[] | null>(null);
  const [lat, setLat] = useState<Latencias | null>(null);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState(PRESETS[2]); // 30 días por default

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, l] = await Promise.all([
          getSeries(preset.dias, preset.gran),
          getLatencias(Math.min(preset.dias, 90) || 7),
        ]);
        if (!alive) return;
        setSeries(s.series);
        setLat(l);
      } catch (e) {
        if (alive) setError(e instanceof PanelError ? e.message : "Error cargando el resumen.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [preset]);

  const kpis = useMemo(() => {
    if (!series) return null;
    const llamadas = series.reduce((a, p) => a + p.llamadas, 0);
    const tokens = series.reduce((a, p) => a + p.tokens, 0);
    const costo = series.reduce((a, p) => a + Number(p.costo || 0), 0);
    const errores = series.reduce((a, p) => a + p.errores, 0);
    return { llamadas, tokens, costo, errores };
  }, [series]);

  // el selector SIEMPRE visible (no desaparece al recargar al cambiar de rango)
  const selector = (
    <div className="flex gap-2 mb-5 flex-wrap">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setPreset(p)}
          className={`text-xs font-mono rounded-full border px-3 py-1.5 transition-colors ${
            preset.id === p.id
              ? "border-brand-bold text-brand-bold"
              : "border-edge-primary text-foreground-tertiary hover:text-foreground-secondary"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  if (error) {
    return (
      <div>
        {selector}
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }
  if (!series || !kpis) {
    return (
      <div>
        {selector}
        <p className="text-sm text-foreground-tertiary font-mono">Cargando…</p>
      </div>
    );
  }

  const p50 = lat?.global?.p50;
  const p95 = lat?.global?.p95;

  return (
    <div>
      {selector}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label={`Llamadas · ${preset.label}`} value={kpis.llamadas.toLocaleString()} />
        <Stat label={`Tokens · ${preset.label}`} value={kpis.tokens.toLocaleString()} />
        <Stat label={`Costo · ${preset.label}`} value={`$${kpis.costo.toFixed(4)}`} sub="USD (sin BYOK aparte)" />
        <Stat
          label="Latencia"
          value={p50 != null ? `${Math.round(Number(p50))} ms` : "—"}
          sub={p95 != null ? `p95: ${Math.round(Number(p95))} ms` : "sin tráfico"}
        />
      </div>

      <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 mb-6">
        <h2 className="text-sm font-medium text-foreground-active mb-1">
          {preset.gran === "hora" ? "Llamadas por hora" : preset.gran === "semana" ? "Llamadas por semana" : "Llamadas por día"}
        </h2>
        <p className="text-xs text-foreground-tertiary mb-4">{preset.label} · canal API</p>
        <BarrasSerie puntos={series} gran={preset.gran} />
      </div>

      {kpis.errores > 0 && (
        <p className="text-xs text-foreground-secondary">
          ⚠ {kpis.errores} llamadas con error/timeout en el periodo — revisa Clientes → logs.
        </p>
      )}

      {lat && lat.clientes.length > 0 && (
        <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 mt-6 overflow-x-auto">
          <h2 className="text-sm font-medium text-foreground-active mb-3">Latencia por cliente · 7d</h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-edge-secondary text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Llamadas</th>
                <th className="px-3 py-2">p50</th>
                <th className="px-3 py-2">p95</th>
                <th className="px-3 py-2">Máx</th>
              </tr>
            </thead>
            <tbody>
              {lat.clientes.map((c) => (
                <tr key={c.client_id} className="border-b border-edge-secondary/50">
                  <td className="px-3 py-2 font-mono text-foreground-active">{c.client_id}</td>
                  <td className="px-3 py-2 text-foreground-secondary">{c.llamadas}</td>
                  <td className="px-3 py-2 text-foreground-secondary">{c.p50 != null ? `${Math.round(Number(c.p50))} ms` : "—"}</td>
                  <td className="px-3 py-2 text-foreground-secondary">{c.p95 != null ? `${Math.round(Number(c.p95))} ms` : "—"}</td>
                  <td className="px-3 py-2 text-foreground-secondary">{c.max != null ? `${c.max} ms` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
