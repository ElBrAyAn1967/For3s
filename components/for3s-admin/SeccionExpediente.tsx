"use client";

import { useEffect, useState } from "react";
import { type ExpedienteHoja, PanelError, getExpediente } from "@/lib/for3sAdmin";

/**
 * Expediente / hoja de servicio (Frente E F1 — confianza para delegar).
 * El trabajo REAL de For3s con evidencia: misiones delegadas (qué se pidió,
 * qué hizo, cómo se verificó), trabajo nocturno, corridas del equipo,
 * auto-modificaciones e insights. La confianza se gana viéndolo, no creyéndolo.
 */

const VENTANAS = [7, 30, 90] as const;

const EMOJI_RESULTADO: Record<string, string> = {
  en_curso: "⏳",
  entregada: "📦",
  verificada: "✅",
  fallida: "❌",
};

function fecha(iso: string | null): string {
  return iso ? iso.slice(0, 16).replace("T", " ") : "—";
}

export default function SeccionExpediente() {
  const [hoja, setHoja] = useState<ExpedienteHoja | null>(null);
  const [dias, setDias] = useState<number>(7);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await getExpediente(dias);
        if (!alive) return;
        setHoja(r);
        setError("");
      } catch (e) {
        if (alive) setError(e instanceof PanelError ? e.message : "Error cargando el expediente.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [dias, tick]);

  if (error && !hoja) return <p className="text-sm text-danger">{error}</p>;
  if (!hoja) return <p className="text-sm text-foreground-tertiary font-mono">Cargando…</p>;

  const misiones = hoja.misiones?.filas ?? [];
  const nocturno = hoja.nocturno ?? [];
  const equipo = hoja.equipo ?? [];
  const automod = hoja.automod ?? [];
  const insights = hoja.insights ?? {};
  const totalNocturno = nocturno.reduce((s, j) => s + j.corridas, 0);
  const okNocturno = nocturno.reduce((s, j) => s + j.ok, 0);
  const totalInsights = Object.values(insights).reduce((s, n) => s + n, 0);
  const sinTrabajo =
    misiones.length === 0 && nocturno.length === 0 && equipo.length === 0 && automod.length === 0 && totalInsights === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-foreground-secondary">
          Hoja de servicio — el trabajo real de For3s, con evidencia (últimos{" "}
          <span className="font-mono text-foreground-active">{hoja.dias}</span> días)
        </p>
        <div className="flex items-center gap-2">
          {VENTANAS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setDias(v)}
              className={`btn-pill ${dias === v ? "text-foreground-active border-foreground-active" : ""}`}
            >
              {v}d
            </button>
          ))}
          <button type="button" onClick={() => setTick((t) => t + 1)} className="btn-pill">
            Actualizar
          </button>
        </div>
      </div>

      {hoja.fuentes_caidas.length > 0 && (
        <div className="rounded-2xl border border-danger/50 bg-surface-overlay-large px-5 py-3 mb-4 text-sm text-danger">
          🔴 Fuentes sin leer (honestidad): {hoja.fuentes_caidas.join(", ")}
        </div>
      )}

      {sinTrabajo && hoja.fuentes_caidas.length === 0 && (
        <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-8 text-center text-foreground-tertiary text-sm">
          Sin trabajo registrado en el periodo. (Honesto: nada que enseñar aún.)
        </div>
      )}

      {/* 🎯 Misiones delegadas — el corazón del expediente */}
      {(misiones.length > 0 || (hoja.misiones?.total ?? 0) > 0) && (
        <div className="mb-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-foreground-tertiary mb-2">
            🎯 Misiones delegadas · {hoja.misiones?.total ?? 0}
          </h3>
          <div className="space-y-3">
            {misiones.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl border bg-surface-overlay-large px-5 py-4 ${
                  m.resultado === "fallida" ? "border-danger/50" : "border-edge-primary"
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full text-foreground-tertiary border border-edge-primary">
                    #{m.id} · {m.tipo}
                  </span>
                  <span className="text-sm font-medium text-foreground-active">
                    {EMOJI_RESULTADO[m.resultado] ?? "❓"} {m.resultado}
                  </span>
                  <span className="text-xs text-foreground-tertiary ml-auto font-mono">{fecha(m.creado_at)}</span>
                </div>
                <p className="text-sm text-foreground-secondary mt-2">{m.pedido}</p>
                <div className="text-xs text-foreground-tertiary mt-1.5 space-y-0.5">
                  {m.que_hizo && (
                    <p>
                      hizo: <span className="text-foreground-secondary">{m.que_hizo}</span>
                    </p>
                  )}
                  {m.verificacion && (
                    <p>
                      verificado: <span className="text-foreground-secondary">{m.verificacion}</span>
                    </p>
                  )}
                  {m.errores && <p className="text-danger">⚠️ {m.errores}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🌙 Trabajo nocturno */}
      {nocturno.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-foreground-tertiary mb-2">
            🌙 Trabajo nocturno · {totalNocturno} corridas, {okNocturno} OK
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-edge-primary bg-surface-overlay-large">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] font-mono uppercase tracking-widest text-foreground-tertiary border-b border-edge-secondary">
                <tr>
                  <th className="px-4 py-2">Job</th>
                  <th className="px-4 py-2">Corridas</th>
                  <th className="px-4 py-2">OK</th>
                  <th className="px-4 py-2">Última</th>
                </tr>
              </thead>
              <tbody>
                {nocturno.map((j) => (
                  <tr key={j.job} className="border-b border-edge-secondary/40">
                    <td className="px-4 py-1.5 font-mono text-foreground-active">{j.job}</td>
                    <td className="px-4 py-1.5 text-foreground-secondary">{j.corridas}</td>
                    <td className={`px-4 py-1.5 ${j.ok === j.corridas ? "text-foreground-secondary" : "text-danger"}`}>
                      {j.ok === j.corridas ? "✅ todas" : `⚠️ ${j.ok}/${j.corridas}`}
                    </td>
                    <td className="px-4 py-1.5 text-foreground-tertiary font-mono text-xs">{fecha(j.ultima)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🤝 Equipo multi-agente */}
      {equipo.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-foreground-tertiary mb-2">
            🤝 Corridas del equipo · {equipo.length}
          </h3>
          <div className="space-y-2">
            {equipo.map((c) => (
              <div key={c.id} className="rounded-2xl border border-edge-primary bg-surface-overlay-large px-5 py-3">
                <p className="text-sm text-foreground-secondary">{c.tarea}</p>
                <p className="text-xs text-foreground-tertiary mt-1 font-mono">
                  #{c.id} · {c.n_ok}/{c.n_specialists} OK · {c.segundos}s · {c.familia} · {fecha(c.creado_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🪞 Auto-modificaciones */}
      {automod.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-foreground-tertiary mb-2">
            🪞 Auto-modificaciones detectadas · {automod.length}
          </h3>
          <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large px-5 py-3 space-y-1">
            {automod.map((a, i) => (
              <p key={i} className="text-xs text-foreground-tertiary font-mono">
                {a.archivo} <span className="text-foreground-secondary">({a.origen})</span> · {fecha(a.detectado_at)}
                {a.nota && <span className="text-foreground-secondary"> · {a.nota}</span>}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 💡 Insights */}
      {totalInsights > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-foreground-tertiary mb-2">
            💡 Insights minados · {totalInsights}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(insights)
              .sort()
              .map(([estado, n]) => (
                <span
                  key={estado}
                  className="text-xs font-mono px-3 py-1 rounded-full border border-edge-primary text-foreground-secondary"
                >
                  {estado}: {n}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
