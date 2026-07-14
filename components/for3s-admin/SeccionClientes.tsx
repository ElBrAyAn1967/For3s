"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Cliente,
  type LogLlamada,
  PanelError,
  altaCliente,
  cambiarEstado,
  editarCliente,
  getClientes,
  getLogs,
  parseScopes,
  rotarKey,
  waitlistEstado,
} from "@/lib/for3sAdmin";

/**
 * Clientes del canal API: tabla con uso + TODAS las acciones de api_admin
 * (alta / suspender / reactivar / revocar / rotar / cuotas / scopes) + logs.
 * La key se muestra UNA sola vez (igual que la CLI) — copiar y guardar.
 */

const ESTADO_BADGE: Record<Cliente["estado"], string> = {
  activo: "text-brand-bold",
  suspendido: "text-foreground-tertiary",
  revocado: "text-danger",
};

function KeyUnaVez({ clientId, keyPlana, onCerrar }: { clientId: string; keyPlana: string; onCerrar: () => void }) {
  const [copiada, setCopiada] = useState(false);
  return (
    <div className="rounded-2xl border border-brand-bold bg-surface-overlay-large p-5 mb-6">
      <p className="text-[11px] font-mono uppercase tracking-widest text-brand-bold mb-2">
        Key de «{clientId}» — se muestra UNA sola vez
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-surface-primary border border-edge-primary px-3 py-2 text-xs font-mono text-foreground-active break-all select-all">
          {keyPlana}
        </code>
        <button
          type="button"
          className="btn-pill btn-pill-primary shrink-0"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(keyPlana);
              setCopiada(true);
            } catch {
              /* http/permiso: queda el select-all manual */
            }
          }}
        >
          {copiada ? "Copiada ✓" : "Copiar"}
        </button>
      </div>
      <p className="text-xs text-foreground-tertiary mt-2">
        Guárdala YA — el server solo conserva su hash. Después solo queda rotar.
      </p>
      <button type="button" onClick={onCerrar} className="text-xs font-mono text-foreground-tertiary underline mt-3">
        Entendido, cerrar
      </button>
    </div>
  );
}

interface PrefillAlta {
  nombre: string;
  email: string;
  waitlistId: number;
}

export default function SeccionClientes({
  prefillAlta,
  onAltaConsumida,
}: {
  prefillAlta: PrefillAlta | null;
  onAltaConsumida: () => void;
}) {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [keyNueva, setKeyNueva] = useState<{ clientId: string; key: string } | null>(null);
  const [mostrandoAlta, setMostrandoAlta] = useState(false);
  // alta
  const [fId, setFId] = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fDias, setFDias] = useState("");
  // detalle expandido
  const [abierto, setAbierto] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [cuotaReq, setCuotaReq] = useState("");
  const [cuotaTok, setCuotaTok] = useState("");
  const [logs, setLogs] = useState<Record<string, LogLlamada[]>>({});
  const [ocupado, setOcupado] = useState(false);

  const [tick, setTick] = useState(0);
  const [prefillVisto, setPrefillVisto] = useState<number | null>(null);

  // patrón de la casa: carga DENTRO del effect + tick de refresco tras acciones.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await getClientes(30);
        if (!alive) return;
        setClientes(r.clientes);
        setError("");
      } catch (e) {
        if (alive) setError(e instanceof PanelError ? e.message : "Error cargando clientes.");
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [tick]);
  const cargar = useCallback(() => setTick((t) => t + 1), []);

  // llegó un prospecto desde Waitlist → abrir el alta prellenada. Ajuste de
  // estado DURANTE el render (patrón oficial de React para reaccionar a props;
  // sin effect — el render se reinicia con el estado nuevo).
  if (prefillAlta && prefillAlta.waitlistId !== prefillVisto) {
    setPrefillVisto(prefillAlta.waitlistId);
    setMostrandoAlta(true);
    setFNombre(prefillAlta.nombre);
    setFId(
      prefillAlta.nombre
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32),
    );
  }

  const accion = useCallback(
    async (fn: () => Promise<unknown>, exito: string) => {
      setOcupado(true);
      setAviso("");
      setError("");
      try {
        await fn();
        setAviso(exito);
        cargar();
      } catch (e) {
        setError(e instanceof PanelError ? e.message : "La acción falló.");
      } finally {
        setOcupado(false);
      }
    },
    [cargar],
  );

  const crear = useCallback(async () => {
    const id = fId.trim();
    if (!id) {
      setError("Falta el client_id.");
      return;
    }
    setOcupado(true);
    setError("");
    try {
      const r = await altaCliente({
        client_id: id,
        nombre: fNombre.trim() || undefined,
        dias: fDias.trim() ? Number(fDias) : undefined,
      });
      setKeyNueva({ clientId: r.client_id, key: r.key });
      // si venía de la waitlist: marcar convertido (el flujo completo)
      if (prefillAlta) {
        try {
          await waitlistEstado(prefillAlta.waitlistId, "convertido");
        } catch {
          setAviso("Cliente creado; NO pude marcar el prospecto como convertido (hazlo en Waitlist).");
        }
        onAltaConsumida();
      }
      setMostrandoAlta(false);
      setFId("");
      setFNombre("");
      setFDias("");
      cargar();
    } catch (e) {
      setError(e instanceof PanelError ? e.message : "El alta falló.");
    } finally {
      setOcupado(false);
    }
  }, [fId, fNombre, fDias, prefillAlta, onAltaConsumida, cargar]);

  const verLogs = useCallback(async (clientId: string) => {
    try {
      const r = await getLogs(clientId, 50);
      setLogs((prev) => ({ ...prev, [clientId]: r.logs }));
    } catch {
      /* la tabla dirá "sin logs" */
    }
  }, []);

  if (error && !clientes) return <p className="text-sm text-danger">{error}</p>;
  if (!clientes) return <p className="text-sm text-foreground-tertiary font-mono">Cargando…</p>;

  return (
    <div>
      {keyNueva && (
        <KeyUnaVez clientId={keyNueva.clientId} keyPlana={keyNueva.key} onCerrar={() => setKeyNueva(null)} />
      )}
      {aviso && <p className="text-xs text-brand-bold mb-3">{aviso}</p>}
      {error && <p className="text-xs text-danger mb-3">{error}</p>}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-foreground-secondary">
          {clientes.length} clientes · uso de 30 días
        </p>
        <button
          type="button"
          className="btn-pill btn-pill-primary"
          onClick={() => setMostrandoAlta((v) => !v)}
        >
          {mostrandoAlta ? "Cancelar" : "+ Nuevo cliente"}
        </button>
      </div>

      {mostrandoAlta && (
        <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 mb-6">
          {prefillAlta && (
            <p className="text-xs text-brand-bold mb-3">
              Convirtiendo prospecto: {prefillAlta.nombre} ({prefillAlta.email})
            </p>
          )}
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              value={fId}
              onChange={(e) => setFId(e.target.value)}
              placeholder="client_id (ej. hotel-acme)"
              className="rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-3 py-2 text-sm text-foreground-active outline-none font-mono"
            />
            <input
              value={fNombre}
              onChange={(e) => setFNombre(e.target.value)}
              placeholder="Nombre visible"
              className="rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-3 py-2 text-sm text-foreground-active outline-none"
            />
            <input
              value={fDias}
              onChange={(e) => setFDias(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Expira en N días (vacío = sin expiración)"
              className="rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-3 py-2 text-sm text-foreground-active outline-none"
            />
          </div>
          <button type="button" disabled={ocupado} className="btn-pill btn-pill-primary mt-4" onClick={crear}>
            {ocupado ? "Creando…" : "Crear y generar key"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-edge-primary bg-surface-overlay-large">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-edge-secondary text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Uso 30d</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Último uso</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-foreground-tertiary">
                  Sin clientes todavía.
                </td>
              </tr>
            )}
            {clientes.map((c) => (
              <ClienteFila
                key={c.client_id}
                c={c}
                abierto={abierto === c.client_id}
                onToggle={() => {
                  const abre = abierto !== c.client_id;
                  setAbierto(abre ? c.client_id : null);
                  setMotivo("");
                  setCuotaReq(c.cuota_dia_requests?.toString() ?? "");
                  setCuotaTok(c.cuota_dia_tokens?.toString() ?? "");
                  if (abre && !logs[c.client_id]) void verLogs(c.client_id);
                }}
                motivo={motivo}
                setMotivo={setMotivo}
                cuotaReq={cuotaReq}
                setCuotaReq={setCuotaReq}
                cuotaTok={cuotaTok}
                setCuotaTok={setCuotaTok}
                logs={logs[c.client_id]}
                ocupado={ocupado}
                onEstado={(a) => {
                  if (!motivo.trim()) {
                    setError("La transición necesita un motivo (queda en el audit).");
                    return;
                  }
                  if (a === "revocar" && !window.confirm(`REVOCAR a «${c.client_id}» es TERMINAL (no hay vuelta). ¿Seguro?`)) return;
                  void accion(() => cambiarEstado(c.client_id, a, motivo.trim()), `${c.client_id}: ${a} ✓`);
                }}
                onRotar={() => {
                  if (!window.confirm(`Rotar la key de «${c.client_id}» mata la anterior AL INSTANTE. ¿Seguro?`)) return;
                  void accion(async () => {
                    const r = await rotarKey(c.client_id);
                    setKeyNueva({ clientId: c.client_id, key: r.key });
                  }, `${c.client_id}: key rotada ✓`);
                }}
                onCuotas={() => {
                  void accion(
                    () =>
                      editarCliente(c.client_id, {
                        cuota_dia_requests: cuotaReq.trim() ? Number(cuotaReq) : null,
                        cuota_dia_tokens: cuotaTok.trim() ? Number(cuotaTok) : null,
                      }),
                    `${c.client_id}: cuotas actualizadas ✓`,
                  );
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClienteFila({
  c,
  abierto,
  onToggle,
  motivo,
  setMotivo,
  cuotaReq,
  setCuotaReq,
  cuotaTok,
  setCuotaTok,
  logs,
  ocupado,
  onEstado,
  onRotar,
  onCuotas,
}: {
  c: Cliente;
  abierto: boolean;
  onToggle: () => void;
  motivo: string;
  setMotivo: (v: string) => void;
  cuotaReq: string;
  setCuotaReq: (v: string) => void;
  cuotaTok: string;
  setCuotaTok: (v: string) => void;
  logs: LogLlamada[] | undefined;
  ocupado: boolean;
  onEstado: (a: "suspender" | "reactivar" | "revocar") => void;
  onRotar: () => void;
  onCuotas: () => void;
}) {
  const scopes = parseScopes(c.scopes);
  return (
    <>
      <tr
        className="border-b border-edge-secondary/50 cursor-pointer hover:bg-surface-primary/60 transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <span className="font-mono text-foreground-active">{c.client_id}</span>
          {c.nombre && <span className="block text-xs text-foreground-tertiary">{c.nombre}</span>}
        </td>
        <td className={`px-4 py-3 font-medium ${ESTADO_BADGE[c.estado]}`}>
          ● {c.estado}
          {c.estado_motivo && (
            <span className="block text-[11px] font-normal text-foreground-tertiary">{c.estado_motivo}</span>
          )}
        </td>
        <td className="px-4 py-3 text-foreground-secondary">
          {c.con_key ? "propia" : "demo"}
          {c.byok && <span className="ml-1 text-[10px] font-mono text-brand-bold">BYOK</span>}
          {c.key_expira_at && (
            <span className="block text-[11px] text-foreground-tertiary">
              expira {c.key_expira_at.slice(0, 10)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-foreground-secondary">
          {c.uso ? `${c.uso.llamadas} llamadas · ${Number(c.uso.tokens).toLocaleString()} tok` : "—"}
          {c.uso && Number(c.uso.errores) > 0 && (
            <span className="block text-[11px] text-danger">{c.uso.errores} errores</span>
          )}
        </td>
        <td className="px-4 py-3 text-foreground-secondary">
          {c.uso ? `$${Number(c.uso.costo).toFixed(4)}` : "—"}
        </td>
        <td className="px-4 py-3 text-foreground-tertiary text-xs">{c.ultimo_uso.slice(0, 16)}</td>
        <td className="px-4 py-3 text-foreground-tertiary text-xs">{abierto ? "▲" : "▼"}</td>
      </tr>
      {abierto && (
        <tr className="border-b border-edge-secondary/50 bg-surface-primary/40">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-2">
                  Acciones (todo queda en el audit)
                </p>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Motivo de la transición (obligatorio)"
                  className="w-full rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-3 py-2 text-sm text-foreground-active outline-none mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  {c.estado === "activo" && (
                    <button type="button" disabled={ocupado} className="btn-pill" onClick={() => onEstado("suspender")}>
                      Suspender
                    </button>
                  )}
                  {c.estado === "suspendido" && (
                    <button type="button" disabled={ocupado} className="btn-pill btn-pill-primary" onClick={() => onEstado("reactivar")}>
                      Reactivar
                    </button>
                  )}
                  {c.estado !== "revocado" && (
                    <button type="button" disabled={ocupado} className="btn-pill text-danger" onClick={() => onEstado("revocar")}>
                      Revocar (terminal)
                    </button>
                  )}
                  {c.estado === "activo" && (
                    <button type="button" disabled={ocupado} className="btn-pill" onClick={onRotar}>
                      Rotar key
                    </button>
                  )}
                </div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mt-5 mb-2">
                  Cuotas diarias (vacío = default del server) · scopes: {scopes.join(", ") || "—"}
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    value={cuotaReq}
                    onChange={(e) => setCuotaReq(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="req/día"
                    className="w-28 rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-3 py-2 text-sm text-foreground-active outline-none"
                  />
                  <input
                    value={cuotaTok}
                    onChange={(e) => setCuotaTok(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="tokens/día"
                    className="w-32 rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-3 py-2 text-sm text-foreground-active outline-none"
                  />
                  <button type="button" disabled={ocupado} className="btn-pill" onClick={onCuotas}>
                    Guardar cuotas
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-2">
                  Últimas llamadas
                </p>
                {!logs && <p className="text-xs text-foreground-tertiary">Cargando…</p>}
                {logs && logs.length === 0 && <p className="text-xs text-foreground-tertiary">Sin llamadas registradas.</p>}
                {logs && logs.length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-edge-secondary">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {logs.map((l, i) => (
                          <tr key={i} className="border-b border-edge-secondary/40">
                            <td className="px-2 py-1.5 font-mono text-foreground-tertiary whitespace-nowrap">
                              {l.creado_at.slice(5, 16)}
                            </td>
                            <td className="px-2 py-1.5 text-foreground-secondary">{l.tema ?? "—"}</td>
                            <td className="px-2 py-1.5 text-foreground-secondary whitespace-nowrap">
                              {l.tokens_in + l.tokens_out} tok
                            </td>
                            <td className="px-2 py-1.5 text-foreground-secondary">{l.ms} ms</td>
                            <td className={`px-2 py-1.5 font-medium ${l.estado === "ok" ? "text-brand-bold" : "text-danger"}`}>
                              {l.estado}
                              {l.byok && <span className="ml-1 text-[10px] text-foreground-tertiary">byok</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
