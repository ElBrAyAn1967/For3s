"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Instancia,
  PanelError,
  getInstancias,
  instanciaOrden,
} from "@/lib/for3sAdmin";

/**
 * Flota de instancias (for3s-ctl, MI-EXTRA-2 ⭐): foco verde/gris + botón
 * on/off. Foresito viene control:false del server (nave nodriza = terminal).
 * `general` es crítica: apagarla tumba la demo pública y el panel de clientes
 * (este control /ctl NO muere — desde aquí mismo se reenciende).
 */

export default function SeccionInstancias() {
  const [flota, setFlota] = useState<Instancia[] | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [operando, setOperando] = useState<string | null>(null);

  const [tick, setTick] = useState(0);

  // patrón de la casa: carga DENTRO del effect + tick de refresco tras acciones.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await getInstancias();
        if (!alive) return;
        setFlota(r.instancias);
        setError("");
      } catch (e) {
        if (alive) setError(e instanceof PanelError ? e.message : "Error cargando la flota.");
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [tick]);
  const cargar = useCallback(() => setTick((t) => t + 1), []);

  const orden = useCallback(
    async (inst: Instancia) => {
      const accion = inst.encendida ? "apagar" : "encender";
      if (inst.critica && accion === "apagar") {
        const ok = window.confirm(
          `«${inst.nombre}» es CRÍTICA: apagarla tumba la demo pública y la API de clientes ` +
            `(este control sigue vivo y puedes reencenderla desde aquí). ¿Apagar de todos modos?`,
        );
        if (!ok) return;
      }
      setOperando(inst.nombre);
      setAviso("");
      setError("");
      try {
        const r = await instanciaOrden(inst.nombre, accion);
        setAviso(`«${r.instancia}» ${r.encendida ? "encendida" : "apagada"} ✓ (${(r.ms / 1000).toFixed(1)}s)`);
      } catch (e) {
        setError(e instanceof PanelError ? e.message : `No pude ${accion} «${inst.nombre}».`);
      } finally {
        setOperando(null);
        cargar();
      }
    },
    [cargar],
  );

  if (error && !flota) return <p className="text-sm text-danger">{error}</p>;
  if (!flota) return <p className="text-sm text-foreground-tertiary font-mono">Cargando…</p>;

  return (
    <div>
      {aviso && <p className="text-xs text-brand-bold mb-3">{aviso}</p>}
      {error && <p className="text-xs text-danger mb-3">{error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {flota.map((inst) => (
          <div
            key={inst.nombre}
            className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-foreground-active flex items-center gap-2">
                <span className={inst.encendida ? "text-brand-bold" : "text-foreground-tertiary"}>●</span>
                {inst.nombre}
                {inst.critica && (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary border border-edge-primary rounded-full px-2 py-0.5">
                    crítica
                  </span>
                )}
              </p>
              <p className="text-xs font-mono text-foreground-tertiary mt-1">{inst.proyecto}</p>
            </div>
            {inst.control ? (
              <button
                type="button"
                disabled={operando !== null}
                onClick={() => void orden(inst)}
                className={`btn-pill ${inst.encendida ? "" : "btn-pill-primary"}`}
              >
                {operando === inst.nombre ? "…" : inst.encendida ? "Apagar" : "Encender"}
              </button>
            ) : (
              <span className="text-[11px] font-mono text-foreground-tertiary">solo terminal</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-foreground-tertiary mt-4">
        Las órdenes corren el gestor <code className="font-mono">for3s</code> del server y quedan
        auditadas. Una operación a la vez por instancia (la segunda recibe «en curso»).
      </p>
    </div>
  );
}
