"use client";

import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";

/**
 * Nodo de un contenedor en el grafo interno de un For3s (Capa 2). Muestra rol,
 * estado (foco), y mini-barras de CPU/RAM en vivo. Clic → detalle lateral.
 */

export interface DatosContenedor extends Record<string, unknown> {
  rol: string;
  nombreCorto: string;
  vivo: boolean;
  cpu: number | null;
  ramPct: number | null;
  ram: string | null;
  seleccionado: boolean;
}

type NodoContenedorType = Node<DatosContenedor, "contenedor">;

function Mini({ pct }: { pct: number }) {
  const v = Math.min(100, Math.max(0, pct));
  return (
    <div className="h-1 rounded-full bg-black/20 overflow-hidden">
      <div className={`h-full rounded-full ${v >= 90 ? "bg-danger" : "bg-brand-bold"}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export default function NodoContenedor({ data }: NodeProps<NodoContenedorType>) {
  return (
    <div
      className={`rounded-xl border bg-surface-overlay-large px-3 py-2 w-[190px] transition-colors ${
        data.seleccionado ? "border-brand-bold" : "border-edge-primary"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-edge-primary !w-1.5 !h-1.5 !border-0" />
      <p className="text-xs font-medium text-foreground-active flex items-center gap-1.5 truncate">
        <span className={data.vivo ? "text-brand-bold" : "text-foreground-tertiary"}>●</span>
        {data.rol}
      </p>
      <p className="text-[10px] font-mono text-foreground-tertiary truncate mb-1.5">{data.nombreCorto}</p>
      {data.vivo && data.cpu != null && data.ramPct != null ? (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-foreground-tertiary w-7">CPU</span>
            <div className="flex-1">
              <Mini pct={data.cpu} />
            </div>
            <span className="text-[9px] font-mono text-foreground-tertiary w-9 text-right">{data.cpu}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-foreground-tertiary w-7">RAM</span>
            <div className="flex-1">
              <Mini pct={data.ramPct} />
            </div>
            <span className="text-[9px] font-mono text-foreground-tertiary w-9 text-right truncate">{data.ram}</span>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-foreground-tertiary">apagado</p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-edge-primary !w-1.5 !h-1.5 !border-0" />
    </div>
  );
}
