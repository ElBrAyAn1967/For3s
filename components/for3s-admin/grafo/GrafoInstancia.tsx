"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CONT_INTOCABLES, PanelError, type ServidorFoto, contenedorOrden } from "@/lib/for3sAdmin";
import { labelInstancia, nombreCorto } from "@/lib/servidorLabels";
import NodoContenedor, { type DatosContenedor } from "./NodoContenedor";
import ConfirmModal from "../ConfirmModal";

/**
 * Grafo interno de UN For3s (Capa 2, estilo Railway): sus contenedores como
 * nodos, cableados por su red compartida (todos hablan con la BD y el valkey de
 * su instancia). Clic en un nodo → detalle lateral. El agente es el centro.
 */

const nodeTypes = { contenedor: NodoContenedor };

type Cont = ServidorFoto["contenedores"][number];
type Stats = ServidorFoto["consumo"][number];

export default function GrafoInstancia({
  inst,
  foto,
  onVolver,
  onRefrescar,
}: {
  inst: string;
  foto: ServidorFoto;
  onVolver: () => void;
  onRefrescar?: () => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [accion, setAccion] = useState<{ nombre: string; op: "reiniciar" | "parar" | "arrancar" } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [errAcc, setErrAcc] = useState("");
  const li = labelInstancia(inst);

  const ejecutar = async () => {
    if (!accion) return;
    setOcupado(true);
    setAviso("");
    setErrAcc("");
    try {
      const r = await contenedorOrden(accion.nombre, accion.op);
      setAviso(`${accion.op} ✓ (${(r.ms / 1000).toFixed(1)}s · ${r.corriendo ? "corriendo" : "parado"})`);
      onRefrescar?.();
    } catch (e) {
      setErrAcc(e instanceof PanelError ? e.message : "La acción falló.");
    } finally {
      setOcupado(false);
      setAccion(null);
    }
  };

  const conts = useMemo(() => foto.contenedores.filter((c) => c.instancia === inst), [foto, inst]);
  const statsPor = useMemo(() => {
    const m: Record<string, Stats> = {};
    for (const s of foto.consumo) m[s.nombre] = s;
    return m;
  }, [foto]);

  const { nodes, edges } = useMemo(() => {
    // el agente al centro; la BD y valkey son el eje; los demás alrededor.
    const esCentro = (c: Cont) => c.rol.includes("bot");
    const esData = (c: Cont) => c.rol.includes("Base de datos") || c.rol.includes("Cola");
    const centro = conts.find(esCentro);
    const data = conts.filter(esData);
    const resto = conts.filter((c) => !esCentro(c) && !esData(c));

    const nodes: Node<DatosContenedor>[] = [];
    const push = (c: Cont, x: number, y: number) => {
      const st = statsPor[c.nombre];
      nodes.push({
        id: c.nombre,
        type: "contenedor",
        position: { x, y },
        data: {
          rol: c.rol,
          nombreCorto: nombreCorto(c.nombre, c.instancia),
          vivo: c.estado === "running",
          cpu: st ? st.cpu : null,
          ramPct: st ? st.ram_pct : null,
          ram: st ? st.ram : null,
          seleccionado: sel === c.nombre,
        },
      });
    };

    if (centro) push(centro, 340, 40 + Math.max(resto.length, 2) * 45);
    data.forEach((c, i) => push(c, 620, 60 + i * 150));
    resto.forEach((c, i) => push(c, 40, 40 + i * 110));

    // aristas: todo lo demás → agente → datos (así se lee el flujo real)
    const edges: Edge[] = [];
    if (centro) {
      for (const c of resto) {
        edges.push({ id: `${c.nombre}->${centro.nombre}`, source: c.nombre, target: centro.nombre, animated: c.estado === "running" });
      }
      for (const c of data) {
        edges.push({ id: `${centro.nombre}->${c.nombre}`, source: centro.nombre, target: c.nombre, animated: centro.estado === "running" });
      }
    }
    return { nodes, edges };
  }, [conts, statsPor, sel]);

  const detalle = sel ? conts.find((c) => c.nombre === sel) : null;
  const detalleStats = detalle ? statsPor[detalle.nombre] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <button type="button" onClick={onVolver} className="text-xs font-mono text-foreground-tertiary hover:text-foreground-active mb-1">
            ← todos los For3s
          </button>
          <h2 className="text-lg font-semibold text-foreground-active">
            {li.nombre} <span className="text-sm font-normal text-foreground-tertiary">· {li.sub}</span>
          </h2>
        </div>
        <span className="text-xs font-mono text-foreground-tertiary">
          {conts.filter((c) => c.estado === "running").length}/{conts.length} activos
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="rounded-2xl border border-edge-primary bg-surface-primary overflow-hidden" style={{ height: 480 }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_e, n) => setSel(n.id)}
              onPaneClick={() => setSel(null)}
              fitView
              proOptions={{ hideAttribution: true }}
              minZoom={0.3}
              maxZoom={1.5}
            >
              <Background color="var(--edge-secondary)" gap={20} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-5">
          {!detalle ? (
            <p className="text-sm text-foreground-tertiary">
              Clic en un contenedor para ver su detalle: uso al instante, imagen, red y puertos.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">Contenedor</p>
                <p className="text-foreground-active font-medium">{detalle.rol}</p>
                <p className="text-xs font-mono text-foreground-tertiary break-all">{detalle.nombre}</p>
              </div>
              <Fila k="Estado" v={detalle.estado === "running" ? "🟢 corriendo" : `⚪ ${detalle.detalle}`} />
              {detalleStats && detalle.estado === "running" && (
                <>
                  <Fila k="CPU" v={`${detalleStats.cpu}%`} />
                  <Fila k="RAM" v={`${detalleStats.ram} (${detalleStats.ram_pct}%)`} />
                </>
              )}
              <Fila k="Imagen" v={detalle.imagen} />
              <Fila k="Red" v={detalle.red || "—"} />
              <Fila k="Puertos" v={detalle.puertos || "—"} />

              <div className="pt-2 border-t border-edge-secondary">
                {CONT_INTOCABLES.has(detalle.nombre) ? (
                  <p className="text-xs text-foreground-tertiary">
                    Protegido — la nave nodriza no se controla desde aquí (solo terminal).
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={ocupado}
                      className="btn-pill"
                      onClick={() => setAccion({ nombre: detalle.nombre, op: "reiniciar" })}
                    >
                      Reiniciar
                    </button>
                    {detalle.estado === "running" ? (
                      <button
                        type="button"
                        disabled={ocupado}
                        className="btn-pill text-danger"
                        onClick={() => setAccion({ nombre: detalle.nombre, op: "parar" })}
                      >
                        Parar
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={ocupado}
                        className="btn-pill btn-pill-primary"
                        onClick={() => setAccion({ nombre: detalle.nombre, op: "arrancar" })}
                      >
                        Arrancar
                      </button>
                    )}
                  </div>
                )}
                {aviso && <p className="text-xs text-brand-bold mt-2">{aviso}</p>}
                {errAcc && <p className="text-xs text-danger mt-2">{errAcc}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        abierto={accion !== null}
        peligro={accion?.op !== "arrancar"}
        titulo={`${accion?.op === "reiniciar" ? "Reiniciar" : accion?.op === "parar" ? "Parar" : "Arrancar"} este contenedor`}
        mensaje={
          accion?.op === "parar"
            ? "El contenedor se detiene hasta que lo arranques. Si es una pieza activa de este For3s, esa función deja de responder mientras esté parado."
            : accion?.op === "reiniciar"
              ? "El contenedor se reinicia (unos segundos sin servicio). Útil si se quedó pegado. No se pierde su volumen/datos."
              : "El contenedor vuelve a arrancar."
        }
        textoConfirmar={accion?.op === "reiniciar" ? "Reiniciar" : accion?.op === "parar" ? "Parar" : "Arrancar"}
        ocupado={ocupado}
        onConfirmar={ejecutar}
        onCancelar={() => setAccion(null)}
      />
    </div>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">{k}</p>
      <p className="text-foreground-secondary break-all">{v}</p>
    </div>
  );
}
