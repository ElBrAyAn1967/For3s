"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Apartado "Cerebro" — visualización gráfica del grafo de nodos de For3s OS.
 *
 * Plasma los 11 nodos cerebrales y sus conexiones (edges). Marca cuáles están
 * EN PRODUCCIÓN (H5 memoria real + H6 se cuida) vs los DISEÑADOS. No consulta
 * el grafo en vivo: es una representación fiel de la arquitectura (Grafo Maestro)
 * con su estado actual.
 *
 * Nodos: 1 KG · 2 Hipocampo · 3 PFC · 4 Skills · 5 Microglía · 6 DMN ·
 *        7 Amígdala · 8 Tálamo · 9 Dual-Process · 10 CLS · 11 Neuromod.
 * Estado "live" = lo que H5/H6 ya pusieron a correr.
 */
type NodeStatus = "live" | "design";

interface BrainNode {
  id: string;
  x: number; // % del viewBox (0-100)
  y: number;
  status: NodeStatus;
}

// Posiciones pensadas para un grafo legible (viewBox 100x70).
const NODES: BrainNode[] = [
  { id: "talamo", x: 50, y: 10, status: "design" }, // 8 router (entrada)
  { id: "amigdala", x: 22, y: 22, status: "design" }, // 7
  { id: "pfc", x: 50, y: 30, status: "design" }, // 3 orquestador (centro)
  { id: "skills", x: 78, y: 22, status: "design" }, // 4
  { id: "hipocampo", x: 26, y: 48, status: "live" }, // 2 pgvector
  { id: "kg", x: 50, y: 56, status: "live" }, // 1 Apache AGE
  { id: "cls", x: 74, y: 48, status: "live" }, // 10 consolidación
  { id: "microglia", x: 14, y: 64, status: "live" }, // 5 olvido
  { id: "dmn", x: 86, y: 64, status: "design" }, // 6
  { id: "dual", x: 64, y: 64, status: "design" }, // 9
  { id: "neuromod", x: 38, y: 64, status: "design" }, // 11
];

// Conexiones (edges) entre nodos por id.
const EDGES: [string, string][] = [
  ["talamo", "amigdala"],
  ["talamo", "pfc"],
  ["pfc", "skills"],
  ["pfc", "hipocampo"],
  ["pfc", "kg"],
  ["amigdala", "pfc"],
  ["hipocampo", "kg"], // episodios → grafo
  ["hipocampo", "cls"], // CLS consolida
  ["cls", "kg"], // CLS escribe conceptos
  ["hipocampo", "microglia"], // Microglía olvida
  ["kg", "dual"],
  ["kg", "dmn"],
  ["pfc", "neuromod"],
];

const NODE_IDS = NODES.map((n) => n.id);
const byId = (id: string) => NODES.find((n) => n.id === id)!;

export default function BrainPanel() {
  const t = useTranslations("Demo.shell.brain");
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-foreground-active mb-1">
        {t("title")}
      </h2>
      <p className="text-sm text-foreground-secondary mb-5">{t("subtitle")}</p>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-[11px] font-mono uppercase tracking-widest">
        <span className="inline-flex items-center gap-1.5 text-foreground-accent">
          <span className="size-2.5 rounded-full bg-brand-bold" />
          {t("legend.live")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-foreground-tertiary">
          <span className="size-2.5 rounded-full border border-edge-primary" />
          {t("legend.design")}
        </span>
      </div>

      {/* Grafo */}
      <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large p-3 sm:p-5">
        <svg
          viewBox="0 0 100 70"
          className="w-full h-auto"
          role="img"
          aria-label={t("title")}
        >
          {/* Edges */}
          {EDGES.map(([a, b], i) => {
            const na = byId(a);
            const nb = byId(b);
            const lit = active === a || active === b;
            return (
              <line
                key={`${a}-${b}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={
                  lit ? "var(--brand-bold)" : "var(--edge-primary)"
                }
                strokeWidth={lit ? 0.6 : 0.3}
                opacity={lit ? 0.9 : 0.5}
                className="transition-all duration-200"
              >
                {/* Pulso de datos solo en edges 'live' (memoria viva) */}
                {byId(a).status === "live" && byId(b).status === "live" && (
                  <animate
                    attributeName="opacity"
                    values="0.3;0.8;0.3"
                    dur={`${2.5 + (i % 3) * 0.6}s`}
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}

          {/* Nodos */}
          {NODES.map((n) => {
            const isLive = n.status === "live";
            const isActive = active === n.id;
            return (
              <g
                key={n.id}
                onMouseEnter={() => setActive(n.id)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(isActive ? null : n.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isActive ? 4.2 : 3.4}
                  fill={isLive ? "var(--brand-bold)" : "var(--surface-primary)"}
                  stroke={
                    isLive ? "var(--brand-bold)" : "var(--edge-primary)"
                  }
                  strokeWidth={0.4}
                  fillOpacity={isLive ? 0.95 : 1}
                  className="transition-all duration-200"
                />
                {/* Halo pulsante en nodos vivos */}
                {isLive && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={3.4}
                    fill="none"
                    stroke="var(--brand-bold)"
                    strokeWidth={0.3}
                    opacity={0.5}
                  >
                    <animate
                      attributeName="r"
                      values="3.4;6;3.4"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0;0.5"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <text
                  x={n.x}
                  y={n.y + 7.2}
                  textAnchor="middle"
                  className="pointer-events-none"
                  fontSize="2.4"
                  fill={
                    isLive
                      ? "var(--foreground-accent)"
                      : "var(--foreground-tertiary)"
                  }
                  fontFamily="var(--font-mono), monospace"
                >
                  {t(`nodes.${n.id}.short`)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detalle del nodo seleccionado / instrucción */}
      <div className="mt-4 rounded-xl border border-edge-secondary bg-surface-primary p-4 min-h-[72px]">
        {active && NODE_IDS.includes(active) ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`size-2.5 rounded-full ${
                  byId(active).status === "live"
                    ? "bg-brand-bold"
                    : "border border-edge-primary"
                }`}
              />
              <h3 className="text-sm font-semibold text-foreground-active">
                {t(`nodes.${active}.name`)}
              </h3>
            </div>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              {t(`nodes.${active}.desc`)}
            </p>
          </>
        ) : (
          <p className="text-sm text-foreground-tertiary leading-relaxed">
            {t("hint")}
          </p>
        )}
      </div>

      {/* Resumen H5/H6 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <div className="rounded-xl border border-brand-bold/25 bg-brand-bold/5 p-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-accent mb-1">
            {t("h5.label")}
          </p>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {t("h5.desc")}
          </p>
        </div>
        <div className="rounded-xl border border-brand-bold/25 bg-brand-bold/5 p-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-accent mb-1">
            {t("h6.label")}
          </p>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {t("h6.desc")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}