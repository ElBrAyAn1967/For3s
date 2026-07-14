"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Prospecto,
  PanelError,
  getWaitlist,
  waitlistEstado,
} from "@/lib/for3sAdmin";

/**
 * Waitlist de prospectos (llegan solos por POST /v1/waitlist desde la demo o
 * el sitio). Ciclo: nuevo → contactado → convertido | descartado. "Convertir"
 * salta a Clientes con el alta prellenada (y al crear, marca convertido).
 */

const ESTADOS: { id: string; label: string }[] = [
  { id: "", label: "Todos" },
  { id: "nuevo", label: "Nuevos" },
  { id: "contactado", label: "Contactados" },
  { id: "convertido", label: "Convertidos" },
  { id: "descartado", label: "Descartados" },
];

const BADGE: Record<Prospecto["estado"], string> = {
  nuevo: "text-brand-bold",
  contactado: "text-foreground-active",
  convertido: "text-brand-bold",
  descartado: "text-foreground-tertiary",
};

export default function SeccionWaitlist({
  onConvertir,
}: {
  onConvertir: (p: { nombre: string; email: string; waitlistId: number }) => void;
}) {
  const [filas, setFilas] = useState<Prospecto[] | null>(null);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const [tick, setTick] = useState(0);

  // patrón de la casa (demo-admin): la carga vive DENTRO del effect (el estado
  // se toca tras el await) y se re-dispara con el tick tras cada acción.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await getWaitlist(filtro || undefined);
        if (!alive) return;
        setFilas(r.waitlist);
        setError("");
      } catch (e) {
        if (alive) setError(e instanceof PanelError ? e.message : "Error cargando la waitlist.");
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [filtro, tick]);

  const mover = useCallback(async (id: number, estado: string) => {
    setOcupado(true);
    setAviso("");
    setError("");
    try {
      await waitlistEstado(id, estado);
      setAviso(`Prospecto #${id} → ${estado} ✓`);
      setTick((t) => t + 1);
    } catch (e) {
      setError(e instanceof PanelError ? e.message : "La transición falló.");
    } finally {
      setOcupado(false);
    }
  }, []);

  if (error && !filas) return <p className="text-sm text-danger">{error}</p>;
  if (!filas) return <p className="text-sm text-foreground-tertiary font-mono">Cargando…</p>;

  return (
    <div>
      {aviso && <p className="text-xs text-brand-bold mb-3">{aviso}</p>}
      {error && <p className="text-xs text-danger mb-3">{error}</p>}

      <div className="flex gap-2 mb-4 flex-wrap">
        {ESTADOS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setFiltro(e.id)}
            className={`text-xs font-mono rounded-full border px-3 py-1.5 transition-colors ${
              filtro === e.id
                ? "border-brand-bold text-brand-bold"
                : "border-edge-primary text-foreground-tertiary hover:text-foreground-secondary"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-edge-primary bg-surface-overlay-large">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-edge-secondary text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
            <tr>
              <th className="px-4 py-3">Prospecto</th>
              <th className="px-4 py-3">Mensaje</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Llegó</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground-tertiary">
                  Sin prospectos {filtro ? `en «${filtro}»` : "todavía"}.
                </td>
              </tr>
            )}
            {filas.map((p) => (
              <tr key={p.id} className="border-b border-edge-secondary/50">
                <td className="px-4 py-3">
                  <span className="text-foreground-active">{p.nombre}</span>
                  <span className="block text-xs font-mono text-foreground-tertiary">{p.email}</span>
                </td>
                <td className="px-4 py-3 text-foreground-secondary text-xs max-w-[240px]">
                  {p.mensaje ?? "—"}
                </td>
                <td className="px-4 py-3 text-foreground-tertiary text-xs font-mono">{p.origen}</td>
                <td className={`px-4 py-3 font-medium ${BADGE[p.estado]}`}>● {p.estado}</td>
                <td className="px-4 py-3 text-foreground-tertiary text-xs">{p.creado_at.slice(0, 16)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {p.estado === "nuevo" && (
                      <button
                        type="button"
                        disabled={ocupado}
                        className="btn-pill"
                        onClick={() => void mover(p.id, "contactado")}
                      >
                        Contactado
                      </button>
                    )}
                    {(p.estado === "nuevo" || p.estado === "contactado") && (
                      <>
                        <button
                          type="button"
                          disabled={ocupado}
                          className="btn-pill btn-pill-primary"
                          onClick={() => onConvertir({ nombre: p.nombre, email: p.email, waitlistId: p.id })}
                        >
                          Convertir en cliente
                        </button>
                        <button
                          type="button"
                          disabled={ocupado}
                          className="btn-pill text-foreground-tertiary"
                          onClick={() => void mover(p.id, "descartado")}
                        >
                          Descartar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
