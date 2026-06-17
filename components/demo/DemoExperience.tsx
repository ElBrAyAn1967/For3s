"use client";

import { useCallback, useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CapacityResponse, DemoKind } from "@/lib/demo/types";
import ConnectApiKey from "./ConnectApiKey";
import ConnectClaude from "./ConnectClaude";
import WaitingRoom from "./WaitingRoom";

// Cómo se conecta cada demo:
//  - 'oauth'  → OAuth de suscripción Claude (jazz/mashe/brian, 1:1, privado).
//  - 'apikey' → el usuario pega su API key (general, vía legal pública).
export type AuthMode = "oauth" | "apikey";

type Phase = "connect" | "joining" | "waiting" | "active";

/**
 * Orquestador client-side de la demo. Máquina de estados:
 *   connect  → el usuario pega su API key (identidad + credencial)
 *   joining  → pide cupo a /api/demo/join
 *   waiting  → General lleno (10 activos): muestra posición en cola + polling
 *   active   → tiene cupo: aquí irá la experiencia real (Fase 2: pegar contexto
 *              → QA Pack). Hoy es un placeholder "listo para usar".
 *
 * Jazz/Mashe nunca caen en 'waiting' (cupo 1:1 propio).
 *
 * FASE 1: no conecta al server for3s. La capacidad/cola corre contra el store
 * in-memory vía las API routes. La pieza 'active' es un stub.
 */
export default function DemoExperience({
  kind,
  authMode,
}: {
  kind: DemoKind;
  authMode: AuthMode;
}) {
  const t = useTranslations("Demo.experience");
  const [phase, setPhase] = useState<Phase>("connect");
  const [keyHint, setKeyHint] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [maxConcurrent, setMaxConcurrent] = useState(10);

  const applyCapacity = useCallback((c: CapacityResponse) => {
    setMaxConcurrent(c.maxConcurrent);
    if (c.status === "waiting") {
      setPhase("waiting");
      setPosition(c.position);
    } else if (c.status === "active") {
      setPhase("active");
      setPosition(null);
    }
  }, []);

  // Tras conectar la API key, pide cupo.
  const handleConnected = useCallback(
    async (hint: string) => {
      setKeyHint(hint);
      setPhase("joining");
      const res = await fetch("/api/demo/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = (await res.json()) as CapacityResponse;
      applyCapacity(data);
    },
    [kind, applyCapacity],
  );

  // Heartbeat mientras está activo o esperando — mantiene viva la sesión y
  // reevalúa la cola. Si estaba esperando y se libera cupo, lo promueve.
  useEffect(() => {
    if (phase !== "active" && phase !== "waiting") return;
    const tick = async () => {
      const res = await fetch("/api/demo/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = (await res.json()) as CapacityResponse;
      applyCapacity(data);
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [phase, kind, applyCapacity]);

  // Libera el cupo al cerrar la pestaña (best-effort).
  useEffect(() => {
    if (phase !== "active" && phase !== "waiting") return;
    const release = () => {
      navigator.sendBeacon?.(
        "/api/demo/leave",
        new Blob([JSON.stringify({ kind })], { type: "application/json" }),
      );
    };
    window.addEventListener("pagehide", release);
    return () => window.removeEventListener("pagehide", release);
  }, [phase, kind]);

  if (phase === "connect") {
    return (
      <div className="flex flex-col items-center gap-6">
        {authMode === "oauth" ? (
          <ConnectClaude kind={kind} onConnected={handleConnected} />
        ) : (
          <ConnectApiKey onConnected={handleConnected} />
        )}
      </div>
    );
  }

  if (phase === "joining") {
    return (
      <p className="text-sm font-mono uppercase tracking-widest text-foreground-tertiary">
        {t("joining")}
      </p>
    );
  }

  if (phase === "waiting") {
    return <WaitingRoom position={position ?? 1} maxConcurrent={maxConcurrent} />;
  }

  // phase === "active" — stub de "listo para usar". Aquí se monta la experiencia
  // real (pegar contexto → QA Pack) en una fase posterior.
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-6 sm:p-8 text-center"
    >
      <div className="inline-flex items-center justify-center size-12 rounded-full bg-brand-bold/10 border border-brand-bold/25 mb-5">
        <Sparkles className="size-5 text-brand-bold" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground-active mb-2">
        {t("ready.title")}
      </h2>
      <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
        {t("ready.description")}
      </p>
      {keyHint && (
        <p className="inline-flex items-center gap-2 rounded-full border border-edge-secondary bg-surface-primary px-3 py-1.5 text-[11px] font-mono text-foreground-tertiary">
          {t("ready.connectedAs")} <span className="text-foreground-active">{keyHint}</span>
        </p>
      )}
    </motion.div>
  );
}
