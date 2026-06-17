// Control del contenedor Docker del agente For3s OS de una demo 1:1.
//
// Cada demo 1:1 (jazz/mashe/brian) tiene su contenedor `for3s-demo-<kind>` en el
// server for3s. Encender/apagar el agente = start/stop de ese contenedor.
//
// IMPORTANTE (producción/Vercel): Vercel NO está en la red Tailscale del server,
// así que NO puede ejecutar `docker` por SSH directamente. Para que esto funcione
// en producción hace falta un pequeño agente HTTP en el server (Fase 2) que
// reciba la orden y ejecute el docker localmente. Por ahora:
//   - Si está configurado DEMO_AGENT_CONTROL_URL → llama a ese agente HTTP.
//   - Si no → es un NO-OP (solo se guarda el estado en BD; el contenedor no se
//     toca). Así la UI funciona end-to-end sin romper en Vercel.

import { CONTAINER_NAME, type DemoKind } from "./types";

// Intenta start/stop del contenedor del agente. Devuelve true si la orden se
// despachó a un controlador real; false si fue NO-OP (sin controlador).
export async function setContainerRunning(
  kind: DemoKind,
  on: boolean,
): Promise<boolean> {
  if (kind === "general") return false; // general no tiene agente individual
  const base = process.env.DEMO_AGENT_CONTROL_URL;
  const token = process.env.DEMO_AGENT_CONTROL_TOKEN;
  if (!base) {
    // Sin controlador configurado: solo persistimos el estado en BD (lo hace el
    // caller). El contenedor real se sincroniza cuando exista el controlador.
    console.info(
      `[container NO-OP] ${CONTAINER_NAME[kind]} → ${on ? "start" : "stop"} (sin DEMO_AGENT_CONTROL_URL)`,
    );
    return false;
  }
  try {
    const res = await fetch(`${base}/container`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name: CONTAINER_NAME[kind], action: on ? "start" : "stop" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
