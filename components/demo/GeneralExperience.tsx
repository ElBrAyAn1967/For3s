"use client";

import { useCallback, useEffect, useState } from "react";
import type { RegisterResult, DemoKind } from "@/lib/demo/types";
import GeneralRegister from "./GeneralRegister";
import GeneralWaitlist from "./GeneralWaitlist";
import DemoShell from "./DemoShell";

/**
 * Experiencia de la demo GENERAL (registro por nombre + correo).
 * Máquina de estados:
 *   register → el usuario da nombre + correo
 *   active   → tiene cupo (≤10): entra al SHELL de la app (gate API key Claude →
 *              Perfil / Conectores). El menú del sitio se oculta a este nivel.
 *   waitlist → demo llena (≥10): pantalla "te avisaremos por correo".
 *
 * La sesión persiste por correo: cerrar pestaña / cerrar sesión libera el cupo,
 * pero volver con el mismo correo continúa donde se quedó.
 *
 * `onActiveChange` avisa al padre (la página) para ocultar navbar/footer del
 * sitio cuando el usuario está dentro del shell.
 */
type Phase = "register" | "active" | "waitlist";

export default function GeneralExperience({
  kind = "general",
  onActiveChange,
}: {
  kind?: DemoKind;
  onActiveChange?: (active: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("register");
  const [position, setPosition] = useState<number | null>(null);
  const [maxConcurrent, setMaxConcurrent] = useState(10);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Si el usuario ya tenía su SK guardada, el shell entra directo (sin pedirla).
  const [hasApiKey, setHasApiKey] = useState(false);
  const [keyHint, setKeyHint] = useState<string | null>(null);
  const [agentOn, setAgentOn] = useState(true);

  const apply = useCallback(
    (r: RegisterResult, who?: { name: string; email: string }) => {
      if (who) {
        setName(who.name);
        setEmail(who.email);
      }
      if (typeof r.hasApiKey === "boolean") setHasApiKey(r.hasApiKey);
      if (r.apiKeyHint !== undefined) setKeyHint(r.apiKeyHint);
      if (typeof r.agentOn === "boolean") setAgentOn(r.agentOn);
      setMaxConcurrent(r.maxConcurrent);
      if (r.status === "waiting") {
        setPhase("waitlist");
        setPosition(r.position);
        onActiveChange?.(false);
      } else if (r.status === "active") {
        setPhase("active");
        setPosition(null);
        onActiveChange?.(true);
      }
    },
    [onActiveChange],
  );

  // Heartbeat mientras está activo o esperando.
  useEffect(() => {
    if (phase !== "active" && phase !== "waitlist") return;
    const tick = async () => {
      const res = await fetch("/api/demo/general/heartbeat", { method: "POST" });
      if (res.ok) apply((await res.json()) as RegisterResult);
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [phase, apply]);

  // Libera el cupo al cerrar la pestaña.
  useEffect(() => {
    if (phase !== "active" && phase !== "waitlist") return;
    const release = () => {
      navigator.sendBeacon?.("/api/demo/general/logout");
    };
    window.addEventListener("pagehide", release);
    return () => window.removeEventListener("pagehide", release);
  }, [phase]);

  const logout = useCallback(async () => {
    await fetch("/api/demo/general/logout", { method: "POST" });
    setPhase("register");
    setPosition(null);
    onActiveChange?.(false);
  }, [onActiveChange]);

  if (phase === "register") {
    return (
      <GeneralRegister kind={kind} onRegistered={(r, who) => apply(r, who)} />
    );
  }

  if (phase === "waitlist") {
    return <GeneralWaitlist position={position} maxConcurrent={maxConcurrent} />;
  }

  // active → shell de la app. Si ya tenía SK guardada, entra directo a Perfil;
  // si no, la primera petición dentro del shell es conectar la API key.
  return (
    <DemoShell
      kind={kind}
      name={name}
      email={email}
      initialKeyHint={hasApiKey ? keyHint : null}
      agentOn={agentOn}
      onLogout={logout}
    />
  );
}