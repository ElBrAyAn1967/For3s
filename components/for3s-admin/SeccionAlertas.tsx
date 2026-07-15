"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type TraceAlerta,
  PanelError,
  getAlertas,
  marcarAlertaVista,
} from "@/lib/for3sAdmin";

/**
 * Alertas de trazabilidad (For3s Trace Pieza C). Muestra las anomalías con su
 * PUNTO EXACTO: qué componente falla, en qué paso del embudo, qué usuarios se
 * atoraron y dónde — y en qué INSTANCIA vive. Marcar vista al atender.
 */

function parseAfectados(raw: string): { entidad: string; ubicacion?: Record<string, string> }[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as { entidad: string; ubicacion?: Record<string, string> }[]) : [];
  } catch {
    return [];
  }
}

export default function SeccionAlertas() {
  const [alertas, setAlertas] = useState<TraceAlerta[] | null>(null);
  const [instancia, setInstancia] = useState("");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [abierta, setAbierta] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await getAlertas();
        if (!alive) return;
        setAlertas(r.alertas);
        setInstancia(r.instancia);
        setError("");
      } catch (e) {
        if (alive) setError(e instanceof PanelError ? e.message : "Error cargando alertas.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const marcarVista = useCallback(async (id: number) => {
    try {
      await marcarAlertaVista(id);
      setTick((t) => t + 1);
    } catch {
      /* la recarga lo reflejará */
    }
  }, []);

  if (error && !alertas) return <p className="text-sm text-danger">{error}</p>;
  if (!alertas) return <p className="text-sm text-foreground-tertiary font-mono">Cargando…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-foreground-secondary">
          {alertas.length === 0 ? "Sin alertas pendientes 🎉" : `${alertas.length} alertas pendientes`} · instancia{" "}
          <span className="font-mono text-foreground-active">{instancia}</span>
        </p>
        <button type="button" onClick={() => setTick((t) => t + 1)} className="btn-pill">
          Actualizar
        </button>
      </div>

      {alertas.length === 0 && (
        <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-8 text-center text-foreground-tertiary text-sm">
          For3s no detectó anomalías en la trazabilidad de tus clientes hoy.
        </div>
      )}

      <div className="space-y-3">
        {alertas.map((a) => {
          const afectados = parseAfectados(a.afectados);
          const abierto = abierta === a.id;
          const alta = a.severidad === "alta";
          return (
            <div
              key={a.id}
              className={`rounded-2xl border bg-surface-overlay-large overflow-hidden ${
                alta ? "border-danger/50" : "border-edge-primary"
              }`}
            >
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          alta ? "text-danger border border-danger" : "text-foreground-tertiary border border-edge-primary"
                        }`}
                      >
                        {alta ? "⚠ alta" : "media"}
                      </span>
                      <span className="text-sm font-medium text-foreground-active">{a.detalle}</span>
                    </div>
                    {/* el PUNTO EXACTO */}
                    <p className="text-xs text-foreground-tertiary mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        cliente: <span className="font-mono text-foreground-secondary">{a.client_id}</span>
                      </span>
                      {a.paso && (
                        <span>
                          punto: <span className="font-mono text-foreground-secondary">{a.paso}</span>
                        </span>
                      )}
                      {a.componente && (
                        <span>
                          componente: <span className="font-mono text-foreground-secondary">{a.componente}</span>
                        </span>
                      )}
                      {a.n_afectados > 0 && (
                        <span>
                          afectados: <span className="text-danger font-medium">{a.n_afectados}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => marcarVista(a.id)}
                    className="text-xs font-mono text-foreground-tertiary hover:text-foreground-active border border-edge-primary rounded-full px-3 py-1 shrink-0"
                  >
                    Marcar vista
                  </button>
                </div>

                {afectados.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAbierta(abierto ? null : a.id)}
                    className="text-xs font-mono text-brand-bold hover:underline mt-2"
                  >
                    {abierto ? "▾ ocultar" : `▸ ver los ${afectados.length} afectados y dónde`}
                  </button>
                )}
              </div>

              {abierto && afectados.length > 0 && (
                <div className="px-5 pb-4 border-t border-edge-secondary/40 pt-3">
                  <div className="overflow-x-auto rounded-lg border border-edge-secondary">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary border-b border-edge-secondary">
                        <tr>
                          <th className="px-3 py-2">Entidad / usuario atorado</th>
                          <th className="px-3 py-2">Dónde (si se trazó)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {afectados.map((f, i) => (
                          <tr key={i} className="border-b border-edge-secondary/40">
                            <td className="px-3 py-1.5 font-mono text-foreground-active">{f.entidad}</td>
                            <td className="px-3 py-1.5 text-foreground-secondary">
                              {f.ubicacion && Object.keys(f.ubicacion).length > 0
                                ? Object.entries(f.ubicacion)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(" · ")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
