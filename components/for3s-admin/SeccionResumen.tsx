"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Latencias,
  type PuntoSerie,
  PanelError,
  getLatencias,
  getSeries,
} from "@/lib/for3sAdmin";

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
function BarrasSerie({ puntos }: { puntos: PuntoSerie[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 160;
  const PAD = 4;
  const max = Math.max(1, ...puntos.map((p) => p.llamadas));
  const bw = Math.max(4, Math.min(28, (W - PAD * 2) / Math.max(puntos.length, 1) - 2));
  const paso = (W - PAD * 2) / Math.max(puntos.length, 1);

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
              {(i === 0 || i === puntos.length - 1) && (
                <text
                  x={x + bw / 2}
                  y={H + 16}
                  textAnchor="middle"
                  className="fill-foreground-tertiary"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {p.dia.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && puntos[hover] && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-lg border border-edge-primary bg-surface-overlay-large px-3 py-2 text-xs text-foreground-active shadow-sm pointer-events-none">
          <span className="font-mono text-foreground-tertiary">{puntos[hover].dia}</span>{" "}
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, l] = await Promise.all([getSeries(30), getLatencias(7)]);
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
  }, []);

  const kpis = useMemo(() => {
    if (!series) return null;
    const llamadas = series.reduce((a, p) => a + p.llamadas, 0);
    const tokens = series.reduce((a, p) => a + p.tokens, 0);
    const costo = series.reduce((a, p) => a + Number(p.costo || 0), 0);
    const errores = series.reduce((a, p) => a + p.errores, 0);
    return { llamadas, tokens, costo, errores };
  }, [series]);

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }
  if (!series || !kpis) {
    return <p className="text-sm text-foreground-tertiary font-mono">Cargando…</p>;
  }

  const p50 = lat?.global?.p50;
  const p95 = lat?.global?.p95;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Llamadas · 30d" value={kpis.llamadas.toLocaleString()} />
        <Stat label="Tokens · 30d" value={kpis.tokens.toLocaleString()} />
        <Stat label="Costo · 30d" value={`$${kpis.costo.toFixed(4)}`} sub="USD (sin BYOK aparte)" />
        <Stat
          label="Latencia · 7d"
          value={p50 != null ? `${Math.round(Number(p50))} ms` : "—"}
          sub={p95 != null ? `p95: ${Math.round(Number(p95))} ms` : "sin tráfico"}
        />
      </div>

      <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 mb-6">
        <h2 className="text-sm font-medium text-foreground-active mb-1">Llamadas por día</h2>
        <p className="text-xs text-foreground-tertiary mb-4">Últimos 30 días · canal API</p>
        <BarrasSerie puntos={series} />
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
