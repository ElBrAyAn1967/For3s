"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ServidorFoto, PanelError, getServidor } from "@/lib/for3sAdmin";
import { SVC_CONTROLABLES, servicioOrden } from "@/lib/for3sAdmin";
import {
  ORDEN_INSTANCIAS,
  labelInstancia,
  labelServicio,
  nombreCorto,
} from "@/lib/servidorLabels";
import ConfirmModal from "./ConfirmModal";
import dynamic from "next/dynamic";

// React Flow debe cargarse SOLO en el cliente (SSR le rompe el cálculo de
// medidas → nodos encimados / edges perdidos, bug conocido en Next).
const GrafoInstancia = dynamic(() => import("./grafo/GrafoInstancia"), {
  ssr: false,
  loading: () => <p className="text-sm text-foreground-tertiary font-mono">Dibujando el grafo…</p>,
});

/**
 * Servidor (F4.e Capa 1): la foto COMPLETA del host, legible y VIVA.
 * - auto-refresh cada 10s (con foco latiendo) + botón manual.
 * - lenguaje humano (servicios y contenedores con nombre + qué hacen).
 * - contenedores agrupados por For3s, con barras de CPU/RAM en vivo.
 * El dato lo levanta for3s-ctl del host; nada estimado. (El grafo tipo Railway
 * llega en la Capa 2.)
 */

const REFRESH_MS = 10_000;

function fmtUptime(s?: number): string {
  if (!s) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

function Barra({ pct, alto = 90 }: { pct: number; alto?: number }) {
  const v = Math.min(100, Math.max(0, pct));
  return (
    <div className="h-1.5 rounded-full bg-surface-primary border border-edge-secondary overflow-hidden">
      <div
        className={`h-full rounded-full ${v >= alto ? "bg-danger" : "bg-brand-bold"}`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function BarraLabel({ usado, total, unidad }: { usado: number; total: number; unidad: string }) {
  const pct = total > 0 ? Math.round((usado / total) * 100) : 0;
  return (
    <div>
      <Barra pct={pct} />
      <p className="text-xs text-foreground-tertiary mt-1">
        {usado.toLocaleString()} / {total.toLocaleString()} {unidad} · {pct}%
      </p>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5">
      <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function SeccionServidor() {
  const [foto, setFoto] = useState<ServidorFoto | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const [latido, setLatido] = useState(false);
  const [zoomInst, setZoomInst] = useState<string | null>(null); // For3s abierto en grafo
  const [svcAccion, setSvcAccion] = useState<{ nombre: string; op: "arrancar" | "parar" | "reiniciar" } | null>(null);
  const [svcOcupado, setSvcOcupado] = useState(false);
  const [svcAviso, setSvcAviso] = useState("");
  const montado = useRef(true);

  // carga (manual por tick, o automática por intervalo)
  useEffect(() => {
    montado.current = true;
    const load = async () => {
      setCargando(true);
      try {
        const f = await getServidor();
        if (!montado.current) return;
        setFoto(f);
        setError("");
        setLatido(true);
        setTimeout(() => montado.current && setLatido(false), 600);
      } catch (e) {
        if (montado.current)
          setError(
            e instanceof PanelError && e.kind === "auth"
              ? "Esta pestaña usa el token de instancias (sal y pégalo en el 2º campo del login)."
              : e instanceof PanelError
                ? e.message
                : "Error leyendo el servidor.",
          );
      } finally {
        if (montado.current) setCargando(false);
      }
    };
    void load();
    return () => {
      montado.current = false;
    };
  }, [tick]);

  // el latido del auto-refresh: cada REFRESH_MS incrementa el tick
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, [auto]);

  const grupos = useMemo(() => {
    if (!foto) return [];
    const statsPor: Record<string, { cpu: number; ram_pct: number; ram: string }> = {};
    for (const c of foto.consumo) statsPor[c.nombre] = c;
    const porInst: Record<string, typeof foto.contenedores> = {};
    for (const c of foto.contenedores) (porInst[c.instancia] ??= []).push(c);
    const orden = [
      ...ORDEN_INSTANCIAS.filter((i) => porInst[i]),
      ...Object.keys(porInst).filter((i) => !ORDEN_INSTANCIAS.includes(i)),
    ];
    return orden.map((inst) => ({
      inst,
      contenedores: porInst[inst].map((c) => ({ ...c, stats: statsPor[c.nombre] })),
    }));
  }, [foto]);

  if (error && !foto) return <p className="text-sm text-danger">{error}</p>;
  if (!foto)
    return (
      <p className="text-sm text-foreground-tertiary font-mono">
        Leyendo el servidor (docker stats tarda unos segundos)…
      </p>
    );

  // vista grafo (Capa 2): entramos a UN For3s y vemos su cableado
  if (zoomInst) {
    return (
      <GrafoInstancia
        inst={zoomInst}
        foto={foto}
        onVolver={() => setZoomInst(null)}
        onRefrescar={() => setTick((t) => t + 1)}
      />
    );
  }

  const s = foto.sistema;
  const ramUsada = (s.ram_total_mb ?? 0) - (s.ram_libre_mb ?? 0);

  const ejecutarSvc = async () => {
    if (!svcAccion) return;
    setSvcOcupado(true);
    setSvcAviso("");
    try {
      const r = await servicioOrden(svcAccion.nombre, svcAccion.op);
      setSvcAviso(`${labelServicio(r.servicio).nombre}: ${svcAccion.op} ✓ (${(r.ms / 1000).toFixed(1)}s)`);
      setTick((t) => t + 1);
    } catch (e) {
      setSvcAviso(e instanceof PanelError ? `Error: ${e.message}` : "La acción falló.");
    } finally {
      setSvcOcupado(false);
      setSvcAccion(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-sm text-foreground-secondary flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full transition-colors ${
              latido ? "bg-brand-bold" : "bg-edge-primary"
            }`}
          />
          <span className="font-mono text-foreground-active">{s.host ?? "server"}</span> · kernel{" "}
          {s.kernel ?? "—"} · {foto.ts.slice(11, 19)}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAuto((v) => !v)}
            className={`text-xs font-mono rounded-full border px-3 py-1.5 transition-colors ${
              auto ? "border-brand-bold text-brand-bold" : "border-edge-primary text-foreground-tertiary"
            }`}
          >
            {auto ? "● En vivo (10s)" : "○ En vivo apagado"}
          </button>
          <button type="button" disabled={cargando} onClick={() => setTick((t) => t + 1)} className="btn-pill">
            {cargando ? "Leyendo…" : "Actualizar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card label="Encendido desde hace">
          <p className="text-xl font-semibold text-foreground-active">{fmtUptime(s.uptime_s)}</p>
          {s.temp_c != null && <p className="text-xs text-foreground-tertiary mt-1">temperatura {s.temp_c}°C</p>}
        </Card>
        <Card label={`Carga (${s.cpus ?? "?"} núcleos)`}>
          <p className="text-xl font-semibold text-foreground-active">{s.carga ? s.carga[0].toFixed(2) : "—"}</p>
          <p className="text-xs text-foreground-tertiary mt-1">
            5m: {s.carga?.[1]?.toFixed(2) ?? "—"} · 15m: {s.carga?.[2]?.toFixed(2) ?? "—"}
          </p>
        </Card>
        <Card label="Memoria RAM">
          <BarraLabel usado={ramUsada} total={s.ram_total_mb ?? 0} unidad="MB" />
        </Card>
        <Card label="Disco">
          <BarraLabel usado={s.disco_usado_gb ?? 0} total={s.disco_total_gb ?? 0} unidad="GB" />
        </Card>
      </div>

      <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 mb-6">
        <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-3">
          Servicios base del sistema
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {foto.servicios.map((sv) => {
            const h = labelServicio(sv.servicio);
            const controlable = SVC_CONTROLABLES.has(sv.servicio);
            return (
              <div key={sv.servicio} className="flex items-start justify-between gap-2 text-sm">
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`mt-0.5 ${sv.activo ? "text-brand-bold" : "text-danger"}`}>●</span>
                  <div className="min-w-0">
                    <span className="text-foreground-active">{h.nombre}</span>
                    {!sv.activo && <span className="text-danger text-xs"> · {sv.estado}</span>}
                    <span className="block text-xs text-foreground-tertiary">{h.que}</span>
                  </div>
                </div>
                {controlable && (
                  <button
                    type="button"
                    disabled={svcOcupado}
                    onClick={() => setSvcAccion({ nombre: sv.servicio, op: "reiniciar" })}
                    className="text-xs font-mono text-foreground-tertiary hover:text-foreground-active border border-edge-primary rounded-full px-3 py-1 shrink-0"
                  >
                    Reiniciar
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {svcAviso && <p className="text-xs text-brand-bold mt-3">{svcAviso}</p>}
        <p className="text-[11px] text-foreground-tertiary mt-3">
          Solo Base de datos y Cola pueden reiniciarse desde aquí. Docker, la red y este control
          nunca se apagan por el panel (te dejarían sin acceso).
        </p>
      </div>

      <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-3">
        Tus For3s y sus piezas ({foto.contenedores.filter((c) => c.estado === "running").length} de{" "}
        {foto.contenedores.length} corriendo)
      </p>
      <div className="space-y-4">
        {grupos.map(({ inst, contenedores }) => {
          const li = labelInstancia(inst);
          const vivos = contenedores.filter((c) => c.estado === "running").length;
          return (
            <div key={inst} className="rounded-2xl border border-edge-primary bg-surface-overlay-large overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-edge-secondary">
                <div>
                  <span className="text-sm font-semibold text-foreground-active">{li.nombre}</span>
                  <span className="text-xs text-foreground-tertiary ml-2">{li.sub}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-foreground-tertiary">
                    {vivos}/{contenedores.length} activos
                  </span>
                  {inst !== "host" && (
                    <button
                      type="button"
                      onClick={() => setZoomInst(inst)}
                      className="text-xs font-mono text-brand-bold hover:underline"
                    >
                      Ver conexiones →
                    </button>
                  )}
                </div>
              </div>
              <div className="divide-y divide-edge-secondary/40">
                {contenedores.map((c) => {
                  const vivo = c.estado === "running";
                  return (
                    <div key={c.nombre} className="px-5 py-3 grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5 min-w-0">
                        <p className="text-sm text-foreground-active flex items-center gap-2">
                          <span className={vivo ? "text-brand-bold" : "text-foreground-tertiary"}>●</span>
                          <span className="truncate">{c.rol}</span>
                        </p>
                        <p className="text-xs font-mono text-foreground-tertiary truncate">
                          {nombreCorto(c.nombre, c.instancia)}
                        </p>
                      </div>
                      <div className="col-span-3">
                        {vivo && c.stats ? (
                          <>
                            <Barra pct={c.stats.cpu} />
                            <p className="text-[11px] text-foreground-tertiary mt-1">CPU {c.stats.cpu}%</p>
                          </>
                        ) : (
                          <span className="text-xs text-foreground-tertiary">—</span>
                        )}
                      </div>
                      <div className="col-span-3">
                        {vivo && c.stats ? (
                          <>
                            <Barra pct={c.stats.ram_pct} />
                            <p className="text-[11px] text-foreground-tertiary mt-1">RAM {c.stats.ram}</p>
                          </>
                        ) : (
                          <span className="text-xs text-foreground-tertiary">apagado</span>
                        )}
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-[10px] font-mono text-foreground-tertiary">
                          {vivo ? "on" : "off"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        abierto={svcAccion !== null}
        peligro
        titulo={`Reiniciar ${svcAccion ? labelServicio(svcAccion.nombre).nombre : ""}`}
        mensaje="Este es un servicio BASE del sistema. Reiniciarlo corta unos segundos ese servicio para TODOS los For3s que lo usan. No se pierden datos. Los servicios críticos (Docker, red, control) no se pueden tocar desde aquí."
        textoConfirmar="Reiniciar"
        ocupado={svcOcupado}
        onConfirmar={ejecutarSvc}
        onCancelar={() => setSvcAccion(null)}
      />
    </div>
  );
}
