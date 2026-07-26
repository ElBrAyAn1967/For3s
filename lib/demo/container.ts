// Encender/apagar el agente For3s OS de una instancia 1:1.
//
// ── POR QUÉ NO SE LLAMA A NADIE (modelo C, Brian 2026-07-26) ─────────────────
// El mini-agente `for3s-ctl` YA existe en el server (systemd, MI-EXTRA-2, commit
// 2164376): sabe correr el gestor `for3s` y expone /flota y encender/apagar. Pero
// vive en `for3s.tail6749e5.ts.net:8443/ctl`, **tailnet-only a propósito** — es el
// plano admin del diseño dual-plane (R10).
//
// Vercel está en internet, no en el tailnet. Las opciones eran:
//   A · exponer /ctl al Funnel público → un token filtrado apaga las instancias de
//       los clientes. Amplía la superficie de ataque del plano ADMIN.
//   C · ⭐ ELEGIDA · invertir el control: nadie entra desde internet. La web solo
//       ESCRIBE la intención en `demo_users.agent_on` (que es lo que ya hacía), y
//       for3s-ctl —que corre DENTRO del server— la lee y ejecuta el docker.
//
// Con C, `/ctl` nunca se expone y el plano admin queda intacto. La contrapartida es
// honesta: no es instantáneo. La orden se aplica en el siguiente ciclo del lector
// (~5-15s), así que la UI debe decir "encendiendo…" y confirmar cuando el estado
// real coincida — NUNCA fingir éxito inmediato, que es lo que hacía el NO-OP viejo.
//
// ── QUIÉN PUEDE ─────────────────────────────────────────────────────────────
// SOLO EL DUEÑO (regla de Brian). Se hace cumplir en el endpoint
// `app/api/demo/general/agent/route.ts` contra demo_duenos: un invitado con llave
// podría, si no, apagarle la memoria al dueño (denegación de servicio).

import { containerName, type DemoKind } from "./types";

/**
 * Registra la intención de encender/apagar. NO ejecuta docker: eso lo hace
 * for3s-ctl en el server leyendo `demo_users.agent_on` (el caller ya lo guardó).
 *
 * Devuelve `true` solo si la orden se aplicó de forma SÍNCRONA — hoy nunca, porque
 * el modelo es asíncrono. El endpoint lo expone como `aplicado`, que significa
 * "ya está hecho", no "se despachó". La UI usa el estado real para confirmar.
 *
 * Se conserva la vía HTTP directa (DEMO_AGENT_CONTROL_URL) SIN configurar: sirve
 * para un entorno donde el sitio SÍ esté dentro del tailnet (dev local con
 * Tailscale). En Vercel esa var no existe y no debe existir.
 */
export async function setContainerRunning(
  instancia: DemoKind,
  on: boolean,
): Promise<boolean> {
  const base = process.env.DEMO_AGENT_CONTROL_URL;
  if (!base) {
    // Camino normal en producción: la orden viaja por la BD, no por HTTP.
    console.info(
      `[agente] ${containerName(instancia)} → ${on ? "start" : "stop"} encolado en BD (lo aplica for3s-ctl)`,
    );
    return false;
  }
  // Camino opcional (dev dentro del tailnet): orden directa al mini-agente.
  try {
    const token = process.env.DEMO_AGENT_CONTROL_TOKEN;
    const res = await fetch(`${base}/container`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: containerName(instancia),
        action: on ? "start" : "stop",
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (e) {
    // No rompe: el estado ya está en BD y for3s-ctl lo recogerá igual.
    console.warn(`[agente] control directo falló, queda en BD: ${(e as Error).message}`);
    return false;
  }
}
