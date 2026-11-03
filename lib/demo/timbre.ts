// El TIMBRE de for3s-agente-sync (EXT-74, Brian 2026-11-03).
//
// ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
// El lector del server le preguntaba a Neon cada 10 s "¿alguien prendió o apagó un
// agente?". Neon Free duerme a los 5 min sin consultas y da 100 CU-h al mes por
// proyecto: preguntar cada 10 s no la dejaba dormir nunca. Medido por la API de Neon:
// la rama principal de la Demo estuvo despierta 396 h en octubre ≈ 99 de 100 CU-h.
//
// Con el timbre, el server espera en Upstash (Neon dormida, sin gastar) y solo lee
// Neon cuando esta web le avisa. Mismo patrón que el cable del panel global
// (components/Panel-Administrador-Global/CABLE.md §6), medido allá y aquí.
//
// ── QUÉ NO ES ───────────────────────────────────────────────────────────────
// El timbre no lleva la orden ni nada en lo que el server confíe: solo dice "lee la
// BD ahora". La orden vive en `demo_users.agent_on` y el server sigue exigiendo que
// la fila sea del dueño. Un token robado solo puede sonar en vano (el server lee y no
// encuentra nada distinto) o tragarse un timbre (la red de seguridad del server lo
// aplica en su siguiente lectura completa). Retraso, nunca acción.
//
// Si el timbre falla, la petición NO falla: la intención ya está guardada en la BD.

export const llaveTimbre = (servidor: string) => `demo-bell:${servidor}`;

type Fetch = typeof fetch;

/**
 * Toca el timbre del servidor que aplica las órdenes: LPUSH + EXPIRE 120 s en una
 * sola petición (/pipeline de Upstash REST). Un timbre que nadie oye en 2 minutos ya
 * no sirve: para entonces la red de seguridad del server lo cubre.
 *
 * Devuelve `true` si Upstash aceptó los dos comandos. Nunca lanza.
 * Sin DEMO_BELL_REST_URL + DEMO_BELL_REST_TOKEN devuelve `false` (el server, sin
 * timbre configurado, sigue leyendo la BD por su cuenta).
 */
export async function tocarTimbre(fetchImpl: Fetch = fetch): Promise<boolean> {
  const url = process.env.DEMO_BELL_REST_URL?.trim().replace(/\/+$/, "");
  const token = process.env.DEMO_BELL_REST_TOKEN?.trim();
  if (!url || !token || !url.startsWith("https://")) return false;
  const llave = llaveTimbre(process.env.DEMO_BELL_SERVER?.trim() || "for3s");
  try {
    const res = await fetchImpl(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["LPUSH", llave, "agent_on"], ["EXPIRE", llave, "120"]]),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const out = (await res.json()) as { result?: unknown; error?: string }[];
    return Array.isArray(out) && out.length === 2 && out.every((x) => x && !x.error);
  } catch {
    return false;
  }
}
