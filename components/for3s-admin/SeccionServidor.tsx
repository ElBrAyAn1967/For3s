"use client";

import { useCallback, useEffect, useState } from "react";
import { type ServidorFoto, PanelError, getServidor } from "@/lib/for3sAdmin";

/**
 * Servidor (F4.d): la foto COMPLETA del host físico — sistema, servicios,
 * TODOS los contenedores (con CPU/RAM en vivo). El dato lo levanta for3s-ctl
 * directamente del host; nada es estimado. `docker stats` tarda unos segundos.
 */

function fmtUptime(s?: number): string {
  if (!s) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

function Barra({ usado, total, unidad }: { usado: number; total: number; unidad: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((usado / total) * 100)) : 0;
  const alto = pct >= 90;
  return (
    <div>
      <div className="h-2 rounded-full bg-surface-primary border border-edge-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${alto ? "bg-danger" : "bg-brand-bold"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
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
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setCargando(true);
      try {
        const f = await getServidor();
        if (!alive) return;
        setFoto(f);
        setError("");
      } catch (e) {
        if (alive)
          setError(
            e instanceof PanelError && e.kind === "auth"
              ? "Esta pestaña usa el token de instancias (vuelve a entrar y pégalo en el 2º campo)."
              : e instanceof PanelError
                ? e.message
                : "Error leyendo el servidor.",
          );
      } finally {
        if (alive) setCargando(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [tick]);

  if (error && !foto) return <p className="text-sm text-danger">{error}</p>;
  if (!foto)
    return (
      <p className="text-sm text-foreground-tertiary font-mono">
        Leyendo el servidor (docker stats tarda unos segundos)…
      </p>
    );

  const s = foto.sistema;
  const ramUsada = (s.ram_total_mb ?? 0) - (s.ram_libre_mb ?? 0);
  const statsPor: Record<string, { cpu: string; ram: string }> = {};
  for (const c of foto.consumo) statsPor[c.nombre] = { cpu: c.cpu, ram: c.ram };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-foreground-secondary">
          <span className="font-mono text-foreground-active">{s.host ?? "server"}</span> · kernel{" "}
          {s.kernel ?? "—"} · foto de {foto.ts.slice(11, 19)}
        </p>
        <button
          type="button"
          disabled={cargando}
          onClick={() => setTick((t) => t + 1)}
          className="btn-pill"
        >
          {cargando ? "Leyendo…" : "Actualizar"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card label="Encendido desde hace">
          <p className="text-xl font-semibold text-foreground-active">{fmtUptime(s.uptime_s)}</p>
          {s.temp_c != null && (
            <p className="text-xs text-foreground-tertiary mt-1">temperatura {s.temp_c}°C</p>
          )}
        </Card>
        <Card label={`Carga (${s.cpus ?? "?"} CPUs)`}>
          <p className="text-xl font-semibold text-foreground-active">
            {s.carga ? s.carga[0].toFixed(2) : "—"}
          </p>
          <p className="text-xs text-foreground-tertiary mt-1">
            5m: {s.carga?.[1]?.toFixed(2) ?? "—"} · 15m: {s.carga?.[2]?.toFixed(2) ?? "—"}
          </p>
        </Card>
        <Card label="RAM">
          <Barra usado={ramUsada} total={s.ram_total_mb ?? 0} unidad="MB" />
          {(s.swap_total_mb ?? 0) > 0 && (
            <p className="text-[11px] text-foreground-tertiary mt-2">
              swap: {((s.swap_total_mb ?? 0) - (s.swap_libre_mb ?? 0)).toLocaleString()} /{" "}
              {(s.swap_total_mb ?? 0).toLocaleString()} MB
            </p>
          )}
        </Card>
        <Card label="Disco (/)">
          <Barra usado={s.disco_usado_gb ?? 0} total={s.disco_total_gb ?? 0} unidad="GB" />
        </Card>
      </div>

      <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 mb-6">
        <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-3">
          Servicios del host
        </p>
        <div className="flex flex-wrap gap-3">
          {foto.servicios.map((sv) => (
            <span
              key={sv.servicio}
              className="text-sm text-foreground-secondary border border-edge-primary rounded-full px-4 py-1.5"
            >
              <span className={sv.activo ? "text-brand-bold" : "text-danger"}>●</span>{" "}
              <span className="font-mono">{sv.servicio}</span>
              {!sv.activo && <span className="text-danger text-xs"> ({sv.estado})</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-edge-primary bg-surface-overlay-large">
        <div className="px-4 pt-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
            Contenedores ({foto.contenedores.length} totales ·{" "}
            {foto.contenedores.filter((c) => c.estado === "running").length} corriendo)
          </p>
        </div>
        <table className="w-full text-left text-sm mt-2">
          <thead className="border-b border-edge-secondary text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
            <tr>
              <th className="px-4 py-2">Contenedor</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">CPU</th>
              <th className="px-4 py-2">RAM</th>
              <th className="px-4 py-2">Imagen</th>
            </tr>
          </thead>
          <tbody>
            {foto.contenedores.map((c) => {
              const st = statsPor[c.nombre];
              const vivo = c.estado === "running";
              return (
                <tr key={c.nombre} className="border-b border-edge-secondary/40">
                  <td className="px-4 py-2 font-mono text-foreground-active">{c.nombre}</td>
                  <td className={`px-4 py-2 ${vivo ? "text-brand-bold" : "text-foreground-tertiary"}`}>
                    ● {c.detalle}
                  </td>
                  <td className="px-4 py-2 text-foreground-secondary">{st?.cpu ?? "—"}</td>
                  <td className="px-4 py-2 text-foreground-secondary">{st?.ram ?? "—"}</td>
                  <td className="px-4 py-2 text-foreground-tertiary text-xs">{c.imagen}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
